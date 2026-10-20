const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

process.env.CLIENT_URL = "http://zentro.test";
const app = require("../dist/app.js").default;
let server;
let port;

test.before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  port = server.address().port;
});

test.after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const postLogout = (headers = {}) => new Promise((resolve, reject) => {
  const request = http.request({ hostname: "127.0.0.1", port, method: "POST", path: "/api/auth/logout", headers }, (response) => {
    response.resume();
    response.once("end", () => resolve(response.statusCode));
  });
  request.once("error", reject);
  request.end();
});

test("allows mutations from the configured storefront origin", async () => {
  assert.equal(await postLogout({ Origin: "http://zentro.test" }), 200);
});

test("rejects cross-origin and origin-less cookie-authenticated mutations", async () => {
  assert.equal(await postLogout({ Origin: "https://attacker.test" }), 403);
  assert.equal(await postLogout({ Cookie: "accessToken=example" }), 403);
});

test("allows origin-less non-browser mutations without session cookies", async () => {
  assert.equal(await postLogout(), 200);
});
