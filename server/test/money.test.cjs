const test = require("node:test");
const assert = require("node:assert/strict");
const { fromMinorUnits, isMoneyAmount, toMinorUnits } = require("../dist/utils/money.js");

test("accepts only finite, non-negative LKR amounts with at most two decimals", () => {
  for (const amount of [0, 0.01, 19.9, 999_999_999.99, 1_000_000_000]) {
    assert.equal(isMoneyAmount(amount), true, `expected ${amount} to be a valid amount`);
  }

  for (const amount of [-0.01, 1.001, Number.NaN, Number.POSITIVE_INFINITY, "12.50", 1_000_000_000.01]) {
    assert.equal(isMoneyAmount(amount), false, `expected ${amount} to be rejected`);
  }
});

test("converts LKR amounts to and from integer minor units without float drift", () => {
  assert.equal(toMinorUnits(0.1 + 0.2), 30);
  assert.equal(toMinorUnits(1250.99), 125099);
  assert.equal(fromMinorUnits(125099), 1250.99);
});
