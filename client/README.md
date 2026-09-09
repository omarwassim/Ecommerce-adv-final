# FIGURES. — storefront (React)

The React 19 front end for the collectible-figure store, built to the `FIGURES.` UI spec and
wired to talk to the .NET Web API in this repo. It runs standalone against a local static
catalogue and **progressively upgrades** to live API data when the backend is reachable.

## Run the whole stack

```bash
# 1. Redis (needed by the API for caching + idempotency)
#    Windows: `winget install Redis.Redis` installs it as an auto-start service on :6379
redis-cli ping                       # -> PONG

# 2. Database (SQL Server / SQL Server Express)
cd Ecommerce-adv-final
dotnet ef database update --project Infrastructure --startup-project Ecommerce

# 3. API  (https://localhost:58332)
cd Ecommerce
ASPNETCORE_ENVIRONMENT=Development dotnet run

# 4. Front end  (http://localhost:5173)
cd ../client
npm install
npm run dev
```

The API's dev connection string points at `Server=.\SQLEXPRESS`
(`Ecommerce/appsettings.Development.json`) — change it if your instance name differs.

With no real Stripe key configured, the API uses `Infrastructure/Payments/FakePaymentService`
(every charge succeeds, no network call) so checkout completes locally. Set
`dotnet user-secrets set "Stripe:SecretKey" "sk_test_…" --project Ecommerce` to use real
Stripe test-mode calls instead.

## Front end only

```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

Build / preview:

```bash
npm run build
npm run preview
```

### Configuration

`.env.development` sets the API base URL:

```
VITE_API_BASE_URL=https://localhost:58332/api/v1
```

That matches `Ecommerce/Properties/launchSettings.json`. Point it elsewhere per environment
(`.env.production`, shell env, etc.). If the API can't be reached, every page falls back to
local data — see below.

> The dev API is HTTPS with a dev certificate. Trust it once with
> `dotnet dev-certs https --trust`, or the browser will block the fetches.

## Backend integration

The front end is tailored to the endpoints the .NET API **actually exposes today**. Where the
API has no endpoint, the UI section stays visible but is filled from `src/data/dummy.js` and
labelled as demo data — no request is attempted.

### Wired to real endpoints

| Storefront action | API call | Notes |
|---|---|---|
| Home / listing / search | `GET /products?page&pageSize&category&search` | Paged. Response mapped by `src/api/adapters.js`. Local catalogue seeds first paint. |
| Product detail | `GET /products` (paged, matched by id) | No `GET /products/:id` exists, so the list endpoint is used. |
| Sign in | `POST /auth/login` → `{ token }` | JWT in `localStorage`; `id/email/role/name` decoded client-side (no `/auth/me`). Offline demo accounts only when the API is unreachable. |
| Register | `POST /auth/register` | In the API client, not surfaced in the UI. |
| Add to bag | `POST /cart/items { productId, quantity }` | Best-effort sync. Backend cart has no variant concept, so the client cart owns colour/size lines. |
| Checkout | `POST /orders` + `Idempotency-Key` header | Key generated once per checkout visit. Cart lines pushed to `/cart/items` first. Offline → a locally-simulated order result. |
| Admin · products | `POST` / `PUT` / `DELETE /admin/products` | Fired best-effort alongside the in-memory `AdminDataContext`. |
| Admin · discounts | `POST /admin/discounts/{product,storewide}` | API takes `durationHours`; the UI's start/end window is converted. Scheduled windows stay client-side. |
| Admin · analytics | `GET /admin/analytics/sales?topN` | Real source. On empty/failure, demo bars (`DUMMY_SALES`) with a visible "demo figures" note. |
| Admin · audit log | `GET /admin/audit-log?page&pageSize` | Real source. Falls back to the in-memory audit log. |

### Demo-only (no endpoint on the API)

| UI surface | Missing endpoint | What's shown |
|---|---|---|
| Orders page | `GET /orders` | `DUMMY_ORDERS` + any orders placed in this browser (mirrored to `localStorage`). Banner says it's demo data. |
| Admin dashboard — Orders & Revenue stats | `GET /orders` | `DUMMY_ORDER_STATS` (+ local orders). Other three stats are live. |
| Ask Jarvis assistant | `POST /ai/search` | Local keyword/budget match against the catalogue; replies tagged `via demo`. |
| Admin products/discounts tables | `GET /admin/products`, `GET /admin/discounts` | Rendered from `AdminDataContext` (seeded from the local catalogue), which also drives the write calls above. |

### Loading / empty / error behaviour

Pages that hit real endpoints seed synchronously from the local catalogue
(`src/data/catalog.js`) so first paint is never blank, replace it on a successful fetch, and
fall back to the local seed on failure. Demo-only surfaces skip the fetch entirely.

## Backend changes made to run the stack locally

| File | Change |
|---|---|
| `Ecommerce/Program.cs` | Added a `"storefront"` CORS policy for the Vite dev origins (`http://localhost:5173-5175`). Override via `"Cors": { "AllowedOrigins": [...] }`. |
| `Ecommerce/appsettings.Development.json` | `Server=(local)` → `Server=.\SQLEXPRESS` (dev SQL instance name). |
| `Infrastructure/Payments/FakePaymentService.cs` *(new)* | No-op `IPaymentService` — every charge/refund succeeds, no network call. |
| `Infrastructure/DependencyInjection.cs` | Registers `FakePaymentService` when `Stripe:SecretKey` is unset or still the placeholder, `StripePaymentService` otherwise. |

The solution targets `net10.0` — needs the .NET 10 SDK (`winget install Microsoft.DotNet.SDK.10`).

## Seed data

Fresh DB has no seed. `POST /admin/products` can't set a product's category (the
`AdminProductDto` has no category field — a backend gap), so 13 demo products were inserted
directly via SQL. Two users exist: `admin@figures.shop` and `demo@figures.shop`
(password `Figures123!`), the first promoted to `Role = Admin` in the DB.

## Demo credentials

Against the running API: `demo@figures.shop` / `admin@figures.shop`, password `Figures123!`.

Offline demo accounts (used only when the API is unreachable):

- Collector — `demo@figures.shop` / `figures123`
- Admin — `admin@figures.shop` / `admin123`

When the API *is* reachable, real credentials go straight through and the JWT's `role` claim
drives the `/admin` gating.

## Structure

```
src/
  api/         fetch wrapper + endpoint modules + DTO adapters
  context/     AuthContext, CartContext, AdminDataContext
  lib/         pricing, per-user discount, analytics, formatting (pure, verbatim from spec §5)
  data/        static catalogue seed
  components/  Layout shell, product presentational bits, admin shell, inline SVG icons
  pages/       one component per route (+ pages/admin/*)
```

Styling is hand-written plain CSS, one file per component/page, tokens in `src/index.css`.
No CSS framework, no icon/form/animation library. React Compiler is enabled in
`vite.config.js`, so components don't hand-roll `useMemo`/`useCallback`.
