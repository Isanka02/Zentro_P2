import { createHash, randomBytes } from "node:crypto";
import { Types } from "mongoose";
import Discount from "../models/Discount";
import Order, { IOrder } from "../models/Order";
import Product from "../models/Product";
import { calculateShipping } from "../utils/shipping";
import { fromMinorUnits, isMoneyAmount, toMinorUnits } from "../utils/money";

export interface OrderShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  district: string;
  postalCode: string;
  country: string;
}

export interface PlaceOrderInput {
  itemQuantities: ReadonlyMap<string, { productId: string; variantId?: string; quantity: number; expectedPrice: number }>;
  shippingAddress: OrderShippingAddress;
  paymentMethod: "cod" | "bank_transfer";
  discountCode?: string;
  userId?: Types.ObjectId;
  idempotencyKey: string;
}

export interface PlaceOrderResult {
  order: IOrder;
  created: boolean;
}

export class OrderPlacementError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "OrderPlacementError";
  }
}

const generateOrderNumber = () => `ZNT-${randomBytes(12).toString("hex").toUpperCase()}`;

const createCheckoutFingerprint = (input: PlaceOrderInput) => createHash("sha256")
  .update(JSON.stringify({
    items: [...input.itemQuantities.entries()]
      .map(([, item]) => [item.productId, item.variantId ?? "", item.quantity, toMinorUnits(item.expectedPrice)])
      .sort(([leftProd, leftVar], [rightProd, rightVar]) => `${leftProd}:${leftVar}`.localeCompare(`${rightProd}:${rightVar}`)),
    shippingAddress: Object.fromEntries(Object.entries(input.shippingAddress).map(([key, value]) => [key, value.trim()])),
    paymentMethod: input.paymentMethod,
    discountCode: input.discountCode?.trim().toUpperCase() ?? "",
  }))
  .digest("hex");

const isSameRequester = (order: IOrder, userId?: Types.ObjectId) =>
  (order.user?.toString() ?? "guest") === (userId?.toString() ?? "guest");

const isDuplicateKey = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

/** Reserves stock, consumes a discount, and persists the order as one transaction. */
export const placeOrder = async (input: PlaceOrderInput): Promise<PlaceOrderResult> => {
  const checkoutFingerprint = createCheckoutFingerprint(input);
  const existingOrder = await Order.findOne({ idempotencyKey: input.idempotencyKey }).select("+checkoutFingerprint");
  if (existingOrder) {
    if (existingOrder.checkoutFingerprint !== checkoutFingerprint || !isSameRequester(existingOrder, input.userId)) {
      throw new OrderPlacementError("This checkout request key was already used with different details", 409);
    }
    return { order: existingOrder, created: false };
  }

  const session = await Order.startSession();
  try {
    let placedOrder: IOrder | null = null;
    await session.withTransaction(async () => {
    const orderItems = [];
    let subtotalMinor = 0;

    for (const [, cartItem] of input.itemQuantities) {
      const { productId, variantId, quantity, expectedPrice } = cartItem;
      const product = await Product.findById(productId).session(session);
      if (!product) throw new OrderPlacementError("A product in this order is no longer available", 409);
      if (product.isActive === false) throw new OrderPlacementError(`"${product.name}" is no longer available for purchase`, 409);
      const variant = variantId ? product.variants.find((item) => item._id.toString() === variantId) : undefined;
      if (product.variants.length && !variant) throw new OrderPlacementError(`Choose an available option for "${product.name}"`, 409);
      if (variantId && !variant) throw new OrderPlacementError(`The selected option for "${product.name}" is no longer available`, 409);
      const sellingStock = variant?.stock ?? product.stock;
      if (sellingStock < quantity) {
        throw new OrderPlacementError(`Not enough stock for "${product.name}"${variant ? ` (${variant.label})` : ""}. Available stock: ${sellingStock}`, 409);
      }

      const regularPrice = variant?.price ?? product.price;
      const discountedPrice = variant?.discountPrice ?? product.discountPrice;
      if (!isMoneyAmount(regularPrice) || (discountedPrice !== undefined && !isMoneyAmount(discountedPrice))) {
        throw new OrderPlacementError("A product has an invalid price", 409);
      }
      const sellingPrice = discountedPrice !== undefined && discountedPrice < regularPrice
        ? discountedPrice
        : regularPrice;
      if (toMinorUnits(sellingPrice) !== toMinorUnits(expectedPrice)) {
        throw new OrderPlacementError(`The price for "${product.name}" has changed. Remove it from your cart and add it again to review the new total.`, 409);
      }
      subtotalMinor += toMinorUnits(sellingPrice) * quantity;
      orderItems.push({
        product: product._id,
        ...(variant ? { variantId: variant._id, variantLabel: variant.label } : {}),
        name: product.name,
        image: product.images[0] ?? "",
        price: sellingPrice,
        quantity,
      });

      if (variant) {
        variant.stock -= quantity;
        product.stock = product.variants.reduce((total, item) => total + item.stock, 0);
      } else {
        product.stock -= quantity;
      }
      await product.save({ session });
    }

    const subtotal = fromMinorUnits(subtotalMinor);
    const shippingCost = calculateShipping(input.shippingAddress.province, subtotal);
    const tax = 0;
    let discountMinor = 0;
    let appliedDiscountCode: string | undefined;
    let appliedDiscountId: Types.ObjectId | undefined;

    if (input.discountCode?.trim()) {
      const discount = await Discount.findOne({ code: input.discountCode.trim().toUpperCase() }).session(session);
      if (!discount) throw new OrderPlacementError("Invalid discount code", 400);
      if (!discount.isActive) throw new OrderPlacementError("This discount code is no longer active", 400);
      if (discount.expiresAt <= new Date()) throw new OrderPlacementError("This discount code has expired", 400);
      if (discount.usedCount >= discount.maxUses) throw new OrderPlacementError("This discount code has reached its usage limit", 409);
      if (subtotal < discount.minPurchase) {
        throw new OrderPlacementError(`Minimum purchase of LKR ${discount.minPurchase} required for this code`, 400);
      }

      discountMinor = discount.type === "percentage"
        ? Math.round(subtotalMinor * discount.value / 100)
        : toMinorUnits(discount.value);
      discountMinor = Math.min(discountMinor, subtotalMinor);
      appliedDiscountCode = discount.code;
      appliedDiscountId = discount._id;
      discount.usedCount += 1;
      await discount.save({ session });
    }

    const discountAmount = fromMinorUnits(discountMinor);
    const total = fromMinorUnits(Math.max(0, subtotalMinor + toMinorUnits(shippingCost + tax) - discountMinor));
    const [order] = await Order.create([{
      user: input.userId,
      orderNumber: generateOrderNumber(),
      idempotencyKey: input.idempotencyKey,
      checkoutFingerprint,
      items: orderItems,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      isPaid: false,
      subtotal,
      shippingCost,
      tax,
      discountAmount,
      discountCode: appliedDiscountCode,
      discount: appliedDiscountId,
      total,
      status: "pending",
    }], { session });

    placedOrder = order;
    });
    if (!placedOrder) throw new Error("Checkout transaction completed without creating an order");
    return { order: placedOrder, created: true };
  } catch (error) {
    if (isDuplicateKey(error)) {
      const concurrentOrder = await Order.findOne({ idempotencyKey: input.idempotencyKey }).select("+checkoutFingerprint");
      if (concurrentOrder?.checkoutFingerprint === checkoutFingerprint && isSameRequester(concurrentOrder, input.userId)) {
        return { order: concurrentOrder, created: false };
      }
      if (concurrentOrder) {
        throw new OrderPlacementError("This checkout request key was already used with different details", 409);
      }
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
