# Infrastructure Layer — Reem's Part

Owner: **Reem** (entire `Infrastructure` project except `Infrastructure/AI/`, which is Mariam's).
Layer position: `Domain ← Application ← Infrastructure ← WebApi`.

---

## 1. What this layer does

| Concern | File(s) | Implements |
|---|---|---|
| Database access | `Persistence/AppDbContext.cs`, `Persistence/Configurations/*.cs` | EF Core mapping of every Domain entity to SQL Server, incl. `Money` as an owned type |
| Repositories | `Persistence/Repositories/*.cs` | `IProductRepository`, `ICartRepository`, `IOrderRepository`, `IUnitOfWork`, `IAuditLogRepository` |
| Caching | `Caching/RedisCacheService.cs` | `ICacheService` — backs the cached `GET /products` endpoint |
| Idempotency fast-path | `Caching/RedisIdempotencyStore.cs` | `IIdempotencyStore` — cache check before `PlaceOrderHandler` touches SQL Server |
| Auth | `Auth/AuthService.cs`, `PasswordHasher.cs`, `JwtSettings.cs`, `AdminOnlyPolicy.cs` | `IAuthService`, plus the `"AdminOnly"` authorization policy used on every `Admin/*` controller |
| Audit trail | `Logging/SerilogAuditLogger.cs` | `IAuditLogger` — writes an `AuditLog` row AND a structured Serilog line per admin write |
| Payments | `Payments/StripePaymentService.cs` | `IPaymentService` — real Stripe.net calls in test mode, incl. refund for compensation |
| Logging | `Logging/SerilogConfig.cs` | Structured logging with a destructuring policy that redacts sensitive fields |
| Rate limiting | `Ecommerce/RateLimiting/RateLimitingExtensions.cs` | Lives in the WebApi project (needs the ASP.NET Core shared framework a plain class library doesn't get) |
| Wiring | `DependencyInjection.cs` | Single `AddInfrastructure()` call from `Program.cs` |

---

## 2. ⚠️ Currently excluded from the build — not my responsibility, blocked on teammates

`Application.csproj` has a `<Compile Remove>` block excluding 5 files. **Do not delete this
block** until the underlying gap is fixed — removing it re-breaks the whole solution's build.

| File | Calls that don't exist yet | Owner who needs to add it |
|---|---|---|
| `Admin/Products/Handlers/CreateProductHandler.cs` | `Product.PhotoUrl`, `.DisplayOrder`, `.DiscountPercentage`, `.DiscountStartsAtUtc`, `.DiscountEndsAtUtc` (fields don't exist on `Product`); `IProductRepository.AddAsync`, `.GetMaxDisplayOrderAsync` (not declared); `ICacheService.RemoveByPrefixAsync` (not declared) | Rahaf (Product fields + repo interface), Omar (`ICacheService` interface) |
| `Admin/Products/Handlers/UpdateProductHandler.cs` | Same as above | Rahaf, Omar |
| `Admin/Products/Handlers/Deleteproducthandler.cs` | `IProductRepository.AddAsync`-adjacent delete method, `ICacheService.RemoveByPrefixAsync` | Rahaf, Omar |
| `Admin/Discounts/Handlers/Setproductdiscounthandler.cs` | `Product.SetDiscount(...)` (method doesn't exist); `ICacheService.RemoveByPrefixAsync` | Rahaf, Omar |
| `Admin/Discounts/Handlers/Setstorewidediscounthandler.cs` | Same as above | Rahaf, Omar |

**Also blocked, not yet built anywhere (Infrastructure or Application):**
- `UserDiscountRepository.cs` — can't implement: `Domain/Entities/UserDiscount.cs` currently
  only contains the `UserDiscountType` enum, not an actual entity class (`PlaceOrderHandler`
  in the version Omar pushed calls `UserDiscount.CreatePostOrderWindow(...)`, `.MarkUsed()`,
  `.DiscountPercentage` — none of which exist). `IUserDiscountRepository`'s declared methods
  (`GetAvailableAsync`, `AddAsync(UserDiscountType)`) also don't match how it's actually called
  (`GetActiveAsync`, `AddAsync(UserDiscount)`). **`PlaceOrderHandler.cs` in this zip has been
  reverted to the last version that compiles against current interfaces — it does NOT include
  discount resolution yet.** Once Rahaf/Omar fix the above, that logic needs to be re-added.
- `IOrderRepository.GetCompletedOrderCountAsync` — called by the discount-aware
  `PlaceOrderHandler` but never declared on the interface. Needed before discount resolution
  ("is this the user's first order?") can work.
- `GetSalesAnalyticsQuery`/`GetAuditLogsQuery` handlers — the query shapes exist
  (`Application/Features/Admin/Analytics/Queries/`) but no `Handlers/` folder yet, so nothing
  to implement a controller or cache against.
- Admin controllers (`AdminProductsController`, `AdminDiscountsController`,
  `AdminAnalyticsController`, `AdminAuditLogController`) — not added yet, since there's nothing
  working to wire them to.

**Fixed as trivial cleanup, not a design decision:** removed a stray `using Abp.Auditing;` from
`IAuditLogRepository.cs` and the now-unnecessary `Abp.Zero.Common` package reference from
`Domain.csproj` — pulled in an unrelated third-party framework, unused, and violated the team's
own "Domain must be pure C#" rule.

---

## 3. Request flow

**`GET /api/v1/products`**: `ProductsController` → `GetProductsQuery` (MediatR) →
`GetProductsHandler` → `IProductRepository`/`ICacheService` → SQL Server or Redis → `ProductDto`.

**`POST /api/v1/orders` (checkout)**: `OrdersController` requires `Idempotency-Key` header →
`PlaceOrderHandler` checks `IIdempotencyStore` (Redis) first → if new, begins a real DB
transaction → `IProductRepository.GetByIdForUpdateAsync` row-locks the product
(`WITH (UPDLOCK, ROWLOCK)`) → stock decremented, order staged → `IPaymentService.ChargeAsync`
(Stripe) → commit on success / rollback on failure → result cached in `IIdempotencyStore`.

**Admin write (once unblocked)**: `Admin*Controller` (`[Authorize(Policy = "AdminOnly")]`) →
command handler → DB write → `IAuditLogger.LogAsync(...)` (writes `AuditLog` row + Serilog line)
→ `ICacheService.RemoveByPrefixAsync("products:")` to invalidate the stale product cache.

---

## 4. Setup — from zero to a running database

### Secrets (from `Ecommerce/`)
```
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(local);Database=ecommerce_dev;Trusted_Connection=True;TrustServerCertificate=True"
dotnet user-secrets set "ConnectionStrings:Redis" "localhost:6379"
dotnet user-secrets set "Jwt:Secret" "<32+ char random string>"
dotnet user-secrets set "Stripe:SecretKey" "sk_test_..."
```

### Local infra
- **SQL Server**: via SSMS, `(local)` default instance, database `ecommerce_dev` created manually.
- **Redis**: `docker compose up -d` from the solution root.

### Migration (from `Infrastructure/`)
```
dotnet ef migrations add AddAuditLog --startup-project ../Ecommerce
dotnet ef database update --startup-project ../Ecommerce
```
(If your `ecommerce_dev` DB already has the earlier `InitialCreate` schema applied, this adds
the new `AuditLogs` table on top of it. If you're starting fresh, `InitialCreate` first.)

---

## 5. Decisions worth being able to defend

- **SQL Server, not Postgres** — switched mid-build for faster local tooling (SSMS). Only code
  differences: `UseSqlServer` vs `UseNpgsql`, `GETUTCDATE()` vs `now()`, `Like` vs `ILike`.
- **Pessimistic row locking, not optimistic concurrency**, for stock — `WITH (UPDLOCK, ROWLOCK)`
  held for the duration of the checkout transaction, matching Omar's `PlaceOrderHandler` design.
- **`Money` as an EF owned type** — real object in C#, two plain columns in SQL.
- **Rate limiting lives in the WebApi project**, not Infrastructure — `AddRateLimiter` needs the
  ASP.NET Core shared framework, which only `Microsoft.NET.Sdk.Web` gets automatically.
- **Audit logging writes both a DB row and a structured log line** — the row is what the admin
  dashboard queries; the log line is what you'd grep in an incident, independent of the DB.
- **`AdminOnlyPolicy` as a named policy, not repeated `[Authorize(Roles = "Admin")]`** — one
  place to change if the admin-access rule ever needs a second condition.

---

## 6. What's stubbed vs. real

- Repositories, EF configs (incl. `Money` mapping, new `AuditLog` table), Redis cache +
  idempotency store, JWT+BCrypt auth, admin authorization policy, Serilog masking + audit
  logging, rate limiting: **real, working implementations**.
- `StripePaymentService`: real Stripe.net call in **test mode** (needs your own `sk_test_...` key).
- `Infrastructure/AI/` is empty on purpose — Mariam's.
- `ExceptionHandlingMiddleware` doesn't exist yet — a `DomainException` currently bubbles up as
  a raw 500. Flagged with a `TODO` in `Program.cs`.
- Discount resolution in checkout, `UserDiscountRepository`, admin product CRUD, admin discount
  endpoints, sales/audit-log query handlers: **blocked on Domain/Application fixes** — see §2.

## 7. Still on you before submission
- Get §2's gap list to Rahaf and Omar.
- Write the two tests your team's rules require: Serilog masking verified, concurrency test on
  `GetByIdForUpdateAsync`.
- Seed at least one product manually in SSMS so cart/checkout has something to test.
- Confirm the Stripe test charge actually succeeds end-to-end.
