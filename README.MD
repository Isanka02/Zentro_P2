# Zentro

Zentro is a Sri Lankan single-store online shopping application. The current MVP includes customer accounts, product browsing and search with category, LKR price, availability, rating, and tag filters, cart and checkout, cash on delivery and manual bank transfer, order tracking, account-backed wishlists, verified-purchase reviews, discount codes, customer-to-admin support conversations, and an admin area for catalog, categories, users, orders, discounts, and the support inbox. Products can have optional variant choices, each with its own SKU, price, discount, and stock.

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the handbook progress map and the remaining verification and deployment work.

## Requirements

- Node.js and npm compatible with the versions used by the client and server dependencies.
- MongoDB configured as a replica set (MongoDB Atlas is suitable). Checkout uses a transaction to reserve stock, consume a discount, and create an order together. The sample local URI expects a local replica set named `rs0`.
- A Cloudinary account for product image uploads. These credentials may be left empty for local work that does not upload images.

For local MongoDB Community on Windows, start a single-node replica set in one PowerShell window:

```powershell
New-Item -ItemType Directory -Force C:\data\zentro
mongod --replSet rs0 --bind_ip 127.0.0.1 --dbpath C:\data\zentro
```

In a second window, initialize it once:

```powershell
mongosh --host 127.0.0.1 --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: '127.0.0.1:27017'}]})"
```

Keep the first window running while using Zentro. If you use MongoDB Atlas, use its replica-set connection string in `MONGO_URI` instead.

## Local setup

1. Create `server/.env` from `server/.env.example` and set `MONGO_URI`, `CLIENT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
2. Use two different random JWT secrets, each at least 32 characters. Admin and customer passwords must be at least 12 characters and no more than 72 UTF-8 bytes (the limit used by bcrypt). Keep all secrets out of source control.
3. Create `client/.env` from `client/.env.example`. Set `VITE_API_URL` to the server API base URL, usually `http://localhost:5000/api`.
4. Install and start the server:

   ```powershell
   cd server
   npm install
   npm run dev
   ```

5. In another terminal, install and start the client:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

The server creates the admin account on first startup when the configured admin email does not already exist. Changing `ADMIN_PASSWORD` later does not reset an existing account; update it through a secure account-management process. Logging out, changing a password, or changing an account's role revokes that account's outstanding sessions across devices.

## Isolated checkout walkthrough

Use a separate MongoDB database for manual checkout verification. This keeps test orders, discount usage, and stock changes out of the normal `zentro` development database. Start the local MongoDB replica set described above, then open a PowerShell terminal in `server` and run:

```powershell
$env:MONGO_URI = "mongodb://127.0.0.1:27017/zentro_checkout_test?replicaSet=rs0"
$env:PORT = "5001"
npm run dev
```

These process-level settings take precedence over values in `server/.env`. They apply only to this terminal and use a different database name and API port. For bank-transfer walkthroughs, set the public `BANK_TRANSFER_BANK_NAME`, `BANK_TRANSFER_ACCOUNT_NAME`, and `BANK_TRANSFER_ACCOUNT_NUMBER` values in that terminal before starting the API; use test or authorized details only. The configured admin account will be seeded into the isolated database on first startup.

In a second PowerShell terminal in `client`, point the storefront at the isolated API and start it:

```powershell
$env:VITE_API_URL = "http://localhost:5001/api"
npm run dev
```

The checkout walkthrough can then cover guest and signed-in orders, COD, configured bank transfer, stock conflicts, cancellation and stock restoration, discounts, and variant inventory. Do not run that walkthrough using the default `zentro` URI. Clear the process overrides when finished by closing those terminals.

## Configuration

- `CLIENT_URL` must be the exact browser origin allowed to call the API. The API rejects mutations from other browser origins and cookie-authenticated mutations without an origin header. Production requires HTTPS.
- When the API is behind a reverse proxy, set `TRUST_PROXY_HOPS` to the exact number of trusted proxies between the internet and the API. This lets IP-based rate limits identify clients correctly. Leave it unset for direct connections, and do not set it to match a proxy chain that untrusted clients can bypass.
- Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` together to enable product image uploads.
- Bank transfer instructions are public checkout information. Set `BANK_TRANSFER_BANK_NAME`, `BANK_TRANSFER_ACCOUNT_NAME`, and `BANK_TRANSFER_ACCOUNT_NUMBER` together; `BANK_TRANSFER_BRANCH` is optional. Do not place private credentials in these fields.
- Never commit `.env` files or share screenshots containing passwords, access tokens, or private account details.

## Build

```powershell
cd server
npm run build

cd ..\client
npm run build
```

The client output is generated in `client/dist`. The API health check is available at `/api/health` after the server starts.

## Checks

Run the API build and its dependency-free business-rule and request-origin checks with:

```powershell
cd server
npm test
```

Run the storefront static checks and production build with:

```powershell
cd client
npm run lint
npm run build
```

The API checks cover LKR minor-unit arithmetic, shipping rates and district validation, order-status transitions, and browser mutation origin handling. They do not replace a live checkout walkthrough against a configured MongoDB replica set.

GitHub Actions runs the API build and its automated checks, storefront lint, and storefront production build for pushes and pull requests. The workflow does not need production secrets or a database because the API checks exercise isolated business rules and request-origin handling without connecting to MongoDB.

## Production deployment

1. Provision MongoDB as a replica set and create a dedicated application database user. The user needs normal read/write access and permission to create the order indexes; the API creates those indexes before it starts listening.
2. Deploy the API with `NODE_ENV=production`, `MONGO_URI`, the exact `CLIENT_URL`, separate random JWT secrets, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. If the host places the API behind a reverse proxy, also set `TRUST_PROXY_HOPS` to that host's documented proxy-hop count. The configured admin account is created once. If that email already belongs to a customer, startup stops rather than silently granting or assuming admin access.
3. Deploy the client as a static single-page application. Set `VITE_API_URL` to the HTTPS API base URL, such as `https://api.zentro.lk/api`, and configure the host to serve `index.html` for application routes.
4. Keep the storefront and API on HTTPS hosts under the same site (for example, `shop.zentro.lk` and `api.zentro.lk`). Production cookies are secure, HTTP-only, and `SameSite=Lax`; unrelated cross-site domains need a different authentication-cookie strategy.
5. Configure Cloudinary before enabling catalog image uploads. Configure the bank transfer details only if bank transfer checkout is being offered; these values are shown to customers. Keep environment secrets in the hosting provider's secret store, never in the client build or repository.
6. Confirm the deployed API reports `200` from `/api/health`. A `503` response means the database is disconnected.

Manual bank transfers require an administrator to confirm receipt before shipment. The MVP does not process refunds, so paid orders cannot be canceled through the application. Define a separate refund process before offering production sales that may need refunds.

## Current architecture and extension points

The application is a React and TypeScript client with an Express and TypeScript API backed by MongoDB/Mongoose. The API uses controllers for HTTP handling, models for persistence, and focused services for placing and cancelling orders, payment actions, support conversations, notifications, and order-status policy. The API serves the province/district list, delivery rates, and free-shipping threshold used by both checkout display and final order calculation. Checkout requests use idempotency keys so retrying the same request does not reserve stock or consume a discount twice. Variant inventory is reserved and restored by the selected variant ID, while order items retain the option label for the purchase record. Keep new business rules in focused services rather than adding database or business logic to React components. A future AI assistant should call narrow, permission-checked application services for product search, order status, and support; it should never query MongoDB directly or bypass normal authorization.

## Payment and fulfillment scope

The MVP supports cash on delivery and manual bank transfer. An administrator must confirm a bank transfer before the order can ship. Customers receive in-app updates for orders, payments, and support replies. Card processing, refunds, returns, shipping-provider integrations, email/SMS notifications, multi-seller management, and AI chat are not currently included and need explicit implementation before production use if required.
