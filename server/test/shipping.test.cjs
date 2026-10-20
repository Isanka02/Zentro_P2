const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateShipping, DISTRICTS_BY_PROVINCE, isValidSriLankanDistrict } = require("../dist/utils/shipping.js");

test("uses the configured Sri Lankan province delivery rates", () => {
  assert.equal(calculateShipping("Western", 4999.99), 300);
  assert.equal(calculateShipping("Central", 4999.99), 450);
  assert.equal(calculateShipping("Northern", 4999.99), 600);
  assert.equal(calculateShipping("Western", 5000), 0);
});

test("rejects unknown provinces and validates districts against their province", () => {
  assert.throws(() => calculateShipping("Atlantis", 1000), /valid Sri Lankan province/);
  assert.equal(isValidSriLankanDistrict("Western", "Colombo"), true);
  assert.equal(isValidSriLankanDistrict("Western", "Kandy"), false);
  assert.equal(isValidSriLankanDistrict("Unknown", "Colombo"), false);
  assert.equal(Object.keys(DISTRICTS_BY_PROVINCE).length, 9);
});
