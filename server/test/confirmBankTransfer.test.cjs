const test = require("node:test");
const assert = require("node:assert/strict");
const { Types } = require("mongoose");
const Order = require("../dist/models/Order.js").default;
const { confirmBankTransfer, PaymentActionError } = require("../dist/services/confirmBankTransfer.js");

const originalFindOneAndUpdate = Order.findOneAndUpdate;
const originalFindById = Order.findById;

test.afterEach(() => {
  Order.findOneAndUpdate = originalFindOneAndUpdate;
  Order.findById = originalFindById;
});

test("confirms a transfer with a conditional atomic update", async () => {
  const orderId = new Types.ObjectId().toString();
  const savedOrder = { _id: orderId, paymentMethod: "bank_transfer", status: "pending", isPaid: true };
  Order.findOneAndUpdate = async (filter, update, options) => {
    assert.deepEqual(filter, {
      _id: orderId,
      paymentMethod: "bank_transfer",
      status: { $ne: "cancelled" },
      isPaid: false,
    });
    assert.equal(update.$set.isPaid, true);
    assert.ok(update.$set.paidAt instanceof Date);
    assert.deepEqual(options, { new: true, runValidators: true });
    return savedOrder;
  };

  const result = await confirmBankTransfer(orderId);
  assert.equal(result.order, savedOrder);
  assert.equal(result.newlyConfirmed, true);
});

test("returns an already-paid order without repeating confirmation side effects", async () => {
  const orderId = new Types.ObjectId().toString();
  const existingOrder = { _id: orderId, paymentMethod: "bank_transfer", status: "confirmed", isPaid: true };
  Order.findOneAndUpdate = async () => null;
  Order.findById = async () => existingOrder;

  const result = await confirmBankTransfer(orderId);
  assert.equal(result.order, existingOrder);
  assert.equal(result.newlyConfirmed, false);
});

test("never confirms payment on a cancelled order", async () => {
  const orderId = new Types.ObjectId().toString();
  Order.findOneAndUpdate = async () => null;
  Order.findById = async () => ({ _id: orderId, paymentMethod: "bank_transfer", status: "cancelled", isPaid: false });

  await assert.rejects(confirmBankTransfer(orderId), (error) =>
    error instanceof PaymentActionError && error.statusCode === 409
  );
});
