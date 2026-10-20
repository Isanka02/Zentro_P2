const test = require("node:test");
const assert = require("node:assert/strict");
const { Types } = require("mongoose");
const Order = require("../dist/models/Order.js").default;
const { OrderStatusUpdateError, updateOrderStatus } = require("../dist/services/updateOrderStatus.js");

const originalFindById = Order.findById;
const originalFindOneAndUpdate = Order.findOneAndUpdate;

test.afterEach(() => {
  Order.findById = originalFindById;
  Order.findOneAndUpdate = originalFindOneAndUpdate;
});

test("updates status only when the persisted status still matches", async () => {
  const orderId = new Types.ObjectId().toString();
  const updatedOrder = { _id: orderId, status: "confirmed" };
  Order.findById = async () => ({ status: "pending", paymentMethod: "cod", isPaid: false });
  Order.findOneAndUpdate = async (filter, update, options) => {
    assert.deepEqual(filter, { _id: orderId, status: "pending" });
    assert.deepEqual(update.$set, { status: "confirmed" });
    assert.deepEqual(options, { new: true, runValidators: true });
    return updatedOrder;
  };

  const result = await updateOrderStatus({ orderId, status: "confirmed" });
  assert.equal(result.order, updatedOrder);
  assert.equal(result.previousStatus, "pending");
});

test("marks cash-on-delivery orders paid when they are delivered", async () => {
  const orderId = new Types.ObjectId().toString();
  Order.findById = async () => ({ status: "shipped", paymentMethod: "cod", isPaid: false });
  Order.findOneAndUpdate = async (_filter, update) => {
    assert.equal(update.$set.status, "delivered");
    assert.equal(update.$set.isPaid, true);
    assert.ok(update.$set.paidAt instanceof Date);
    return { _id: orderId, status: "delivered", isPaid: true };
  };

  const result = await updateOrderStatus({ orderId, status: "delivered" });
  assert.equal(result.order.isPaid, true);
});

test("clears supplied tracking fields while leaving omitted fields untouched", async () => {
  const orderId = new Types.ObjectId().toString();
  Order.findById = async () => ({ status: "confirmed", paymentMethod: "cod", isPaid: false });
  Order.findOneAndUpdate = async (_filter, update) => {
    assert.equal(update.$set.status, "confirmed");
    assert.equal(update.$set.trackingNumber, undefined);
    assert.equal(Object.hasOwn(update.$set, "carrier"), false);
    assert.equal(update.$set.estimatedDelivery, undefined);
    return { _id: orderId, status: "confirmed" };
  };

  await updateOrderStatus({
    orderId,
    status: "confirmed",
    trackingNumber: "",
    estimatedDelivery: null,
  });
});

test("prevents shipping an unpaid bank-transfer order", async () => {
  const orderId = new Types.ObjectId().toString();
  Order.findById = async () => ({ status: "confirmed", paymentMethod: "bank_transfer", isPaid: false });
  Order.findOneAndUpdate = async () => assert.fail("unpaid transfer must not be updated");

  await assert.rejects(updateOrderStatus({ orderId, status: "shipped" }), (error) =>
    error instanceof OrderStatusUpdateError && error.statusCode === 409
  );
});

test("returns a conflict when another action changed the order first", async () => {
  const orderId = new Types.ObjectId().toString();
  Order.findById = async () => ({ status: "pending", paymentMethod: "cod", isPaid: false });
  Order.findOneAndUpdate = async () => null;

  await assert.rejects(updateOrderStatus({ orderId, status: "confirmed" }), (error) =>
    error instanceof OrderStatusUpdateError && error.statusCode === 409
  );
});
