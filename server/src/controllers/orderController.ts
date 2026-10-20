import { Request, Response } from "express";
import { Types } from "mongoose";
import Order from "../models/Order";
import { isValidSriLankanDistrict, normalizeSriLankanPhone } from "../utils/shipping";
import { getBankTransferInstructions } from "../services/bankTransferInstructions";
import { cancelOrder, OrderCancellationError } from "../services/cancelOrder";
import { notifyUser } from "../services/notificationService";
import { OrderPlacementError, placeOrder } from "../services/placeOrder";
import { isMoneyAmount } from "../utils/money";
import { CustomerOrderStatusError, getCustomerOrderStatus } from "../services/customerOrderStatus";

interface OrderItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
  expectedPrice: number;
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

export const createOrder = async (req: Request, res: Response) => {
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
    } = req.body ?? {};

    // -----------------------------
    // 1. Basic request validation
    // -----------------------------
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }
    if (items.length > 50) {
      return res.status(400).json({ message: "An order cannot contain more than 50 different products" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (paymentMethod === "bank_transfer" && !getBankTransferInstructions().configured) {
      return res.status(400).json({ message: "Bank transfer is temporarily unavailable" });
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

    const maxShippingFieldLength: Record<(typeof requiredShippingFields)[number], number> = {
      fullName: 120,
      email: 254,
      phone: 32,
      address: 300,
      city: 100,
      province: 40,
      district: 60,
      postalCode: 20,
      country: 60,
    };

    for (const field of requiredShippingFields) {
      const value = shippingAddress[field];
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
      if (value.trim().length > maxShippingFieldLength[field]) {
        return res.status(400).json({ message: `${field} is too long` });
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email.trim())) {
      return res.status(400).json({ message: "Enter a valid shipping email" });
    }
    const normalizedPhone = normalizeSriLankanPhone(shippingAddress.phone);
    if (!normalizedPhone) {
      return res.status(400).json({ message: "Enter a valid Sri Lankan phone number" });
    }
    if (!/^\d{5}$/.test(shippingAddress.postalCode.trim())) {
      return res.status(400).json({ message: "Enter the five-digit Sri Lankan postcode" });
    }
    if (shippingAddress.country.trim().toLowerCase() !== "sri lanka") {
      return res.status(400).json({ message: "Zentro currently ships within Sri Lanka" });
    }
    if (!isValidSriLankanDistrict(shippingAddress.province, shippingAddress.district)) {
      return res.status(400).json({ message: "Select a district within the selected province" });
    }
    if (discountCode !== undefined && (typeof discountCode !== "string" || discountCode.length > 32)) {
      return res.status(400).json({ message: "Discount code is invalid" });
    }
    const idempotencyKey = req.get("Idempotency-Key");
    if (!idempotencyKey || !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
      return res.status(400).json({ message: "A valid checkout request key is required" });
    }

    const normalizedShippingAddress: ShippingAddressRequest = {
      fullName: shippingAddress.fullName.trim(),
      email: shippingAddress.email.trim().toLowerCase(),
      phone: normalizedPhone,
      address: shippingAddress.address.trim(),
      city: shippingAddress.city.trim(),
      province: shippingAddress.province.trim(),
      district: shippingAddress.district.trim(),
      postalCode: shippingAddress.postalCode.trim(),
      country: "Sri Lanka",
    };

    // -----------------------------
    // 2. Combine duplicate products
    // -----------------------------
    const itemMap = new Map<string, { productId: string; variantId?: string; quantity: number; expectedPrice: number }>();

    for (const item of items) {
      if (!item || typeof item !== "object") {
        return res.status(400).json({ message: "Each order item must include a product and quantity" });
      }
      if (typeof item.productId !== "string" || !Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({
          message: "Invalid product ID",
        });
      }
      if (item.variantId !== undefined && (typeof item.variantId !== "string" || !Types.ObjectId.isValid(item.variantId))) {
        return res.status(400).json({ message: "Invalid product variant" });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return res.status(400).json({
          message: "Quantity must be a whole number between 1 and 100",
        });
      }
      if (!isMoneyAmount(item.expectedPrice)) {
        return res.status(400).json({ message: "Each cart item must include its displayed LKR price" });
      }

      const key = `${item.productId}:${item.variantId ?? "default"}`;
      const existingItem = itemMap.get(key);
      if (existingItem && Math.round(existingItem.expectedPrice * 100) !== Math.round(item.expectedPrice * 100)) {
        return res.status(400).json({ message: "The cart contains conflicting prices for the same product" });
      }
      const combinedQuantity = (existingItem?.quantity ?? 0) + item.quantity;
      if (combinedQuantity > 100) {
        return res.status(400).json({ message: "An order cannot exceed 100 units of a product" });
      }
      itemMap.set(key, { productId: item.productId, ...(item.variantId ? { variantId: item.variantId } : {}), quantity: combinedQuantity, expectedPrice: item.expectedPrice });
    }

    const { order, created } = await placeOrder({
      itemQuantities: itemMap,
      shippingAddress: normalizedShippingAddress,
      paymentMethod,
      discountCode,
      userId: req.user?._id,
      idempotencyKey,
    });

    if (created && req.user) {
      await notifyUser({
        userId: req.user._id,
        type: "order",
        title: "Order placed",
        message: `Order ${order.orderNumber} has been placed successfully.`,
        link: `/orders/${order._id}`,
      });
    }
    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order._id,
        ownerId: order.user?.toString() ?? null,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof OrderPlacementError) return res.status(err.statusCode).json({ message: err.message });
    console.error("Order placement error:", err);
    return res.status(500).json({ message: "Failed to create order" });
  }
};
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.json({ orders });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id as string;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = order.user?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this order" });
    }

    return res.json({ order });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch order details" });
  }
};

/** Narrow customer-scoped lookup suitable for support tooling and future assistant integrations. */
export const getMyOrderStatus = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  try {
    const order = await getCustomerOrderStatus(req.params.id as string, req.user._id);
    return res.json({ order });
  } catch (err) {
    if (err instanceof CustomerOrderStatusError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: "Failed to fetch order status" });
  }
};

export const trackOrder = async (req: Request, res: Response) => {
  try {
    const orderNumber = (req.params.orderNumber as string)?.trim().toUpperCase();

    if (!orderNumber || orderNumber.length > 40 || !/^ZNT-[A-Z0-9-]+$/.test(orderNumber)) {
      return res.status(400).json({ message: "Enter a valid order number" });
    }

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Public tracking must not expose a customer's address, purchases, or payment details.
    return res.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to track order" });
  }
};
export const cancelMyOrder = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  try {
    const id = req.params.id as string;
    const order = await cancelOrder(id, req.user._id);
    return res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    if (err instanceof OrderCancellationError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: "Failed to cancel order" });
  }
};
