const test = require("node:test");
const assert = require("node:assert/strict");
const { canTransitionOrderStatus } = require("../dist/services/orderStatusPolicy.js");

test("allows forward fulfillment transitions and cancellation before shipment", () => {
  assert.equal(canTransitionOrderStatus("pending", "confirmed"), true);
  assert.equal(canTransitionOrderStatus("confirmed", "shipped"), true);
  assert.equal(canTransitionOrderStatus("shipped", "delivered"), true);
  assert.equal(canTransitionOrderStatus("pending", "cancelled"), true);
  assert.equal(canTransitionOrderStatus("confirmed", "cancelled"), true);
});

test("prevents skipped, backward, or post-delivery order transitions", () => {
  assert.equal(canTransitionOrderStatus("pending", "shipped"), false);
  assert.equal(canTransitionOrderStatus("shipped", "confirmed"), false);
  assert.equal(canTransitionOrderStatus("delivered", "cancelled"), false);
  assert.equal(canTransitionOrderStatus("cancelled", "confirmed"), false);
});
