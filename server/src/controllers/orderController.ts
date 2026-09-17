import { Request, Response } from "express";
import { Types } from "mongoose";
import Order from "../models/Order";
import Product from "../models/Product";
import Discount from "../models/Discount";
import { calculateShipping } from "../utils/shipping";

interface OrderItemRequest {
  productId: string;
  quantity: number;
}

interface ShippingAddressRequest {
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

const generateOrderNumber = () => {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `ZNT-${Date.now()}-${randomPart}`;
};

export const createOrder = async (req: Request, res: Response) => {
  const session = await Order.startSession();

  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      discountCode,
    }: {
      items: OrderItemRequest[];
      shippingAddress: ShippingAddressRequest;
      paymentMethod: "cod" | "bank_transfer";
      discountCode?: string;
    } = req.body;

    // -----------------------------
    // 1. Basic request validation
    // -----------------------------
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (!["cod", "bank_transfer"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const requiredShippingFields = [
      "fullName",
      "email",
      "phone",
      "address",
      "city",
      "province",
      "district",
      "postalCode",
      "country",
    ] as const;

    for (const field of requiredShippingFields) {
      if (!shippingAddress[field]?.trim()) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
    }

    // -----------------------------
    // 2. Combine duplicate products
    // -----------------------------
    const itemMap = new Map<string, number>();

    for (const item of items) {
      if (!Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({
          message: "Invalid product ID",
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({
          message: "Quantity must be a positive whole number",
        });
      }

      itemMap.set(
        item.productId,
        (itemMap.get(item.productId) ?? 0) + item.quantity
      );
    }

    // -----------------------------
    // 3. Start transaction
    // -----------------------------
    session.startTransaction();

    const orderItems = [];
    let subtotal = 0;

    for (const [productId, quantity] of itemMap.entries()) {
      const product = await Product.findById(productId).session(session);

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (product.stock < quantity) {
        throw new Error(
          `Not enough stock for "${product.name}". Available stock: ${product.stock}`
        );
      }

      // Use the current selling price.
      // If a product has a discountPrice, use that.
      const sellingPrice =
        product.discountPrice !== undefined &&
        product.discountPrice < product.price
          ? product.discountPrice
          : product.price;

      subtotal += sellingPrice * quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] ?? "",
        price: sellingPrice,
        quantity,
      });

      // Reduce stock
      product.stock -= quantity;
      await product.save({ session });
    }

    // -----------------------------
    // 4. Calculate shipping
    // -----------------------------
    const shippingCost = calculateShipping(
      shippingAddress.province,
      subtotal
    );

    // Tax is currently 0 in the checkout implementation.
    const tax = 0;

    // -----------------------------
    // 5. Validate discount
    // -----------------------------
    let discountAmount = 0;
    let appliedDiscountCode: string | undefined;

    if (discountCode?.trim()) {
      const discount = await Discount.findOne({
        code: discountCode.trim().toUpperCase(),
      }).session(session);

      if (!discount) {
        throw new Error("Invalid discount code");
      }

      if (!discount.isActive) {
        throw new Error("This discount code is no longer active");
      }

      if (discount.expiresAt < new Date()) {
        throw new Error("This discount code has expired");
      }

      if (discount.usedCount >= discount.maxUses) {
        throw new Error("This discount code has reached its usage limit");
      }

      if (subtotal < discount.minPurchase) {
        throw new Error(
          `Minimum purchase of LKR ${discount.minPurchase} required for this code`
        );
      }

      discountAmount =
        discount.type === "percentage"
          ? (subtotal * discount.value) / 100
          : discount.value;

      discountAmount = Math.min(discountAmount, subtotal);

      appliedDiscountCode = discount.code;

      // Consume one usage only when the order is actually created.
      discount.usedCount += 1;
      await discount.save({ session });
    }

    // -----------------------------
    // 6. Calculate final total
    // -----------------------------
    const total = Math.max(
      0,
      subtotal + shippingCost + tax - discountAmount
    );

    // -----------------------------
    // 7. Create order
    // -----------------------------
    const [order] = await Order.create(
      [
        {
          user: req.user?._id,
          orderNumber: generateOrderNumber(),
          items: orderItems,
          shippingAddress,
          paymentMethod,
          isPaid: false,
          subtotal,
          shippingCost,
          tax,
          discountAmount,
          discountCode: appliedDiscountCode,
          total,
          status: "pending",
        },
      ],
      { session }
    );

    // -----------------------------
    // 8. Commit transaction
    // -----------------------------
    await session.commitTransaction();

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    await session.abortTransaction();

    res.status(400).json({
      message:
        err instanceof Error ? err.message : "Failed to create order",
    });
  } finally {
    await session.endSession();
  }
};