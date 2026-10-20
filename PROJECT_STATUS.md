# Zentro project status

Zentro is being built as a Sri Lankan, single-store marketplace MVP. This status separates features present in the source from behavior that still needs a real checkout or deployment walkthrough.

## Handbook progress

| Handbook area | Current evidence in the project | Status |
| --- | --- | --- |
| Weeks 1–4: setup, reusable UI, homepage, responsive layout | React/TypeScript storefront, shared layout and product components, home page | Implemented in source; client build and lint pass |
| Weeks 5–8: marketplace pages | Product catalog and detail pages, category navigation, search, cart, wishlist, profile, support, and order pages | Implemented in source; full browser flow still needs a walkthrough |
| Weeks 9–12: API, authentication, database | Express/TypeScript API, MongoDB models, cookie-based authentication, account roles, origin checks, and rate limits | Implemented in source; current API build passes; live database behavior needs checkout verification |
| Weeks 13–16: admin tools | Admin dashboard, catalog and category management, users, discounts, order fulfillment, and support inbox | Implemented in source; operational walkthrough remains |
| Weeks 17–20: wishlist, reviews, notifications, advanced search | Account-backed wishlist, delivered-order reviews, in-app notifications, and filters for category, LKR price, stock, rating, and tag | Implemented in source; the filter UI and integrations need a browser walkthrough |
| Weeks 21–24: optimization, security, testing, deployment, documentation | Input validation, transactional order and inventory changes, security headers, deployment guidance, build/lint workflow, and project status | In progress; see remaining work below |

“Implemented in source” is not the same as verified in a live customer journey. Local build and lint checks are useful gates, but they do not prove that checkout, payment confirmation, stock restoration, or deployment works end to end.

## Current checks

- API TypeScript build: passed locally.
- Storefront lint and production build: passed locally.
- GitHub Actions workflow: added at `.github/workflows/quality.yml`; it has not run on GitHub yet.
- API test suite: available through `npm test`, but not run in this work session.
- Local development database: MongoDB's Windows service is running, and `GET /api/health` returned `200` with `database: connected`. A read-only API check found five active products, two categories, no products marked featured, and no products with variants. The homepage and product-list pages render; the homepage now shows an empty featured-products state until an admin selects featured products. No product, order, or account data was changed during this walkthrough. Atlas configuration has not been verified separately.
- Local checkout configuration: all nine provinces and 25 districts are returned by the API. Bank transfer is currently disabled because its public account instructions are not configured.
- Checkout isolation: the README now documents a separate local `zentro_checkout_test` database and API port for manual purchase walkthroughs. The walkthrough itself has not been run; no orders or catalog data were created or changed during this work.

## Remaining work before calling the MVP finished

1. Configure the public bank-transfer instructions if that method is to be offered, then use a dedicated test database and complete the purchase walkthrough: new account, separate wishlist, guest and signed-in checkout, COD delivery, bank-transfer confirmation, invalid discount, insufficient stock, cancellation, and variant stock restoration.
2. Resolve any issues found in that walkthrough, then run the documented API checks and client checks.
3. Push the branch and confirm the GitHub Actions workflow completes successfully.
4. Choose a hosting provider and configure production secrets, MongoDB backups, Cloudinary, HTTPS, SPA route fallback, and the trusted proxy hop count for that provider.
5. Deploy to a staging environment, verify the health endpoint and core purchase/admin flows, then decide whether the single-store MVP is ready for production sales.

Live payment processing, refunds and returns, shipping-carrier integration, email/SMS delivery, multi-seller support, and the AI chat assistant are outside the agreed first release. The future assistant should use narrow catalog, order-status, and support services with normal customer authorization; it should not query MongoDB or bypass access checks.
