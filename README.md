# Ecommerce Backend — Team Split & Clean Architecture Structure

## 1. Project Structure (.NET Clean Architecture)

```
EcommerceSystem/
├── src/
│   ├── EcommerceSystem.Domain/              # Rahaf (core owner)
│   │   ├── Entities/
│   │   │   ├── Product.cs
│   │   │   ├── Order.cs
│   │   │   ├── OrderItem.cs
│   │   │   ├── Cart.cs
│   │   │   ├── CartItem.cs
│   │   │   ├── User.cs
│   │   │   └── Payment.cs
│   │   ├── Enums/
│   │   │   └── OrderStatus.cs               # state machine states
│   │   ├── ValueObjects/
│   │   │   └── Money.cs
│   │   ├── Exceptions/
│   │   │   └── DomainException.cs
│   │   └── Interfaces/                      # repository contracts, no implementation
│   │       ├── IProductRepository.cs
│   │       ├── IOrderRepository.cs
│   │       ├── ICartRepository.cs
│   │       └── IUnitOfWork.cs
│   │
│   ├── EcommerceSystem.Application/         # Omar (core owner)
│   │   ├── DTOs/
│   │   │   ├── ProductDto.cs
│   │   │   ├── OrderDto.cs
│   │   │   └── CartDto.cs
│   │   ├── Interfaces/
│   │   │   ├── IAuthService.cs
│   │   │   ├── ICacheService.cs
│   │   │   ├── IPaymentService.cs
│   │   │   └── IAiService.cs                # contract only — Mariam implements in Infra
│   │   ├── Features/
│   │   │   ├── Products/
│   │   │   │   ├── Queries/GetProductsQuery.cs
│   │   │   │   └── Handlers/GetProductsHandler.cs
│   │   │   ├── Cart/
│   │   │   │   ├── Commands/AddToCartCommand.cs
│   │   │   │   └── Handlers/AddToCartHandler.cs
│   │   │   └── Orders/
│   │   │       ├── Commands/PlaceOrderCommand.cs
│   │   │       └── Handlers/PlaceOrderHandler.cs   # idempotency + compensation logic lives here
│   │   ├── Mappings/
│   │   │   └── MappingProfile.cs            # Mapster config
│   │   ├── Validators/
│   │   │   └── PlaceOrderValidator.cs       # FluentValidation
│   │   └── Common/
│   │       ├── Behaviors/ValidationBehavior.cs
│   │       └── Result.cs
│   │
│   ├── EcommerceSystem.Infrastructure/      # Reem (core owner) + Mariam (AI section only)
│   │   ├── Persistence/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/              # EF Fluent API per entity
│   │   │   ├── Repositories/
│   │   │   │   ├── ProductRepository.cs
│   │   │   │   ├── OrderRepository.cs
│   │   │   │   └── UnitOfWork.cs
│   │   │   └── Migrations/
│   │   ├── Caching/
│   │   │   └── RedisCacheService.cs
│   │   ├── Auth/
│   │   │   ├── JwtTokenGenerator.cs
│   │   │   └── PasswordHasher.cs
│   │   ├── Payments/
│   │   │   └── StripePaymentService.cs
│   │   ├── Logging/
│   │   │   └── SerilogConfig.cs
│   │   └── AI/                              # MARIAM'S FOLDER — all AI lives here only
│   │       ├── OpenAiService.cs             # implements IAiService
│   │       ├── Prompts/
│   │       │   └── SearchAssistantPrompt.cs
│   │       └── Dtos/
│   │           └── AiSearchResultDto.cs
│   │
│   └── EcommerceSystem.WebApi/              # Mariam (co-owner, wiring + AI endpoints)
│       ├── Controllers/
│       │   ├── v1/
│       │   │   ├── ProductsController.cs
│       │   │   ├── CartController.cs
│       │   │   ├── OrdersController.cs
│       │   │   ├── AuthController.cs
│       │   │   └── AiController.cs          # Mariam owns this controller
│       ├── Middleware/
│       │   ├── ExceptionHandlingMiddleware.cs  # consistent error contract
│       │   └── RateLimitingMiddleware.cs
│       ├── Filters/
│       ├── Program.cs                       # DI wiring, all layers plugged here
│       └── appsettings.json
│
└── tests/
    ├── EcommerceSystem.UnitTests/
    │   ├── Application/                     # Omar
    │   └── Domain/                          # Rahaf
    └── EcommerceSystem.IntegrationTests/
        ├── Orders/PlaceOrderConcurrencyTests.cs   # idempotency/concurrency — shared, Omar leads
        └── AI/AiServiceTests.cs             # Mariam
```

Dependency direction (Clean Architecture rule, non-negotiable):
`Domain ← Application ← Infrastructure ← WebApi`
Domain depends on nothing. Application depends only on Domain. Infrastructure implements Application's interfaces. WebApi wires everything via DI. No layer references the one "above" it. No Domain reference to EF Core, no Application reference to Redis/Stripe/OpenAI SDKs directly — only through interfaces.

---

## 2. Bottom-Up Build Order

Work flows bottom-up. No one starts a layer before the layer below is stable enough to build against.

1. **Domain first (Rahaf)** — entities, enums, value objects, repository interfaces. Nothing compiles against anything else until this exists. This is the team's day-1 blocker; everyone waits on the interface shapes here.
2. **Application second (Omar)** — once Domain interfaces exist, build DTOs, use cases/handlers, validators against those interfaces. Mocks the repository interfaces for now — does not wait for Infrastructure's real implementation.
3. **Infrastructure third (Reem + Mariam)** — implements Domain's repository interfaces and Application's service interfaces (cache, payment, AI) with real tech (EF Core, Redis, Stripe, OpenAI). Can start as soon as Domain interfaces are frozen, in parallel with Omar, since both only depend on Domain.
4. **WebApi last (Mariam leads wiring, everyone plugs in their controller)** — controllers call Application handlers, DI container wires Infrastructure implementations to Application interfaces in `Program.cs`. This is the integration point — nothing here is real logic, just composition.

Rule: if you're blocked because a lower layer isn't ready, you extend an interface stub in Domain/Application yourself (with the owner's sign-off) rather than freezing. You never skip a layer or call Infrastructure directly from a Controller.

---

## 3. Individual Task Breakdown

### Omar — Application Layer + Order/Cart Logic
- Own `Application` project entirely.
- DTOs for Product, Cart, Order.
- CQRS-style handlers: `GetProducts`, `AddToCart`, `PlaceOrder`.
- **Checkout idempotency**: idempotency key stored per request (e.g. header `Idempotency-Key`), checked before processing `PlaceOrderCommand` — duplicate key returns cached prior result, no reprocessing.
- **Order state machine**: define states (`Pending → Paid → Confirmed → Failed → Compensated`), and the compensation path when payment succeeds but order creation fails (refund trigger or manual-review queue entry).
- **Price snapshot**: `OrderItem` stores `UnitPriceAtPurchase` copied from `Product.Price` at order time — never a live FK-read price.
- Mapster profile setup and mapping conventions doc (why Mapster over AutoMapper: no reflection-heavy runtime mapping, compiled mapping functions, less GC pressure at scale).
- FluentValidation validators.
- Concurrency/idempotency test cases in `IntegrationTests`.

**Rules for Omar:**
- No EF Core, no HTTP client, no SDK references inside Application. Interfaces only.
- Every handler returns a DTO, never a Domain entity.
- Every command handler that mutates state must be idempotency-safe or explicitly documented why not.

---

### Mariam — AI Integration + Infrastructure (AI section) + WebApi wiring
- **All AI logic lives under `Infrastructure/AI/` — no AI code anywhere else in the solution.**
- Implement `IAiService` (defined by Omar in Application) inside `Infrastructure/AI/OpenAiService.cs`.
- Feature: product search assistant — natural language query → structured product filter/recommendation, calling chosen LLM provider (OpenAI/Anthropic API).
- `AiController` in WebApi — one endpoint, e.g. `POST /api/v1/ai/search`, calling Application layer, which calls `IAiService`.
- Own `Program.cs` DI wiring for the whole solution (registering repos, cache, payment, AI, auth) since she's the one gluing every layer together at WebApi level — coordinate with Reem here since Reem builds most of what gets registered.
- Own the AI section of the write-up: provider choice, prompt design, cost/latency reasoning, failure fallback (what happens if the AI call times out or errors — must not break checkout/browse flow).

**Rules for Mariam:**
- AI calls never sit in a critical path that can be blocked without a fallback (e.g. AI search failure must not break normal product browsing).
- API keys for the AI provider go in secrets/config, never hardcoded, never logged.
- `AiController` returns DTOs from `Application`, not raw AI provider response shapes.

---

### Rahaf — Domain Layer + Data Model
- Own `Domain` project entirely — this is the first thing built, everyone else depends on it.
- Entities: `Product`, `Cart`, `CartItem`, `Order`, `OrderItem`, `User`, `Payment`.
- Repository interfaces (`IProductRepository`, `IOrderRepository`, `IUnitOfWork`) — contracts only, no implementation.
- ERD design and normalization reasoning (3NF baseline, deliberate denormalization only where justified, e.g. price snapshot on `OrderItem`).
- `OrderStatus` enum backing the state machine Omar implements logic for.
- Domain exceptions (`DomainException` and subtypes) used for business-rule violations, not caught generically.

**Rules for Rahaf:**
- Zero references to any framework (no EF Core attributes, no ASP.NET types) in Domain — pure C#.
- Any entity change after day 2 needs a heads-up to Omar and Reem — they build directly against these shapes.
- Interfaces are the contract; changing a method signature after others build against it is a breaking change, flag it immediately.

---

### Reem — Infrastructure Layer (Persistence, Cache, Auth, Payment, Logging)
- Own `Infrastructure` project except the `AI/` folder (Mariam's).
- `AppDbContext`, EF Core configurations, migrations, repository implementations of Rahaf's interfaces.
- `RedisCacheService` implementing `ICacheService` — cache the product listing endpoint (read-heavy, low-change data — good cache fit).
- JWT generation/validation, password hashing.
- Stripe (or chosen provider) payment service implementing `IPaymentService`.
- Serilog setup: structured JSON logs, sinks (console + file/seq), log levels per environment, and a scrubbing/masking rule so passwords, tokens, and payment fields never hit a log sink (redact at the logging pipeline level, not by convention/hope).
- Rate limiting middleware config (registered in WebApi, implemented/configured here).

**Rules for Reem:**
- Every repository implements the interface exactly as Rahaf defined it — no extra public methods leaking Infrastructure-only concerns upward.
- No secrets in `appsettings.json` committed to source — use user-secrets/env vars, document in README.
- Any sensitive field (password, token, card data) must be excluded at the Serilog destructuring/masking policy level, verified in a test.

---

## 4. Third-Party Packages Needed

| Purpose | Package | Owner |
|---|---|---|
| ORM | `Microsoft.EntityFrameworkCore` + `Npgsql.EntityFrameworkCore.PostgreSQL` (or SqlServer) | Reem |
| Mapping | `Mapster` + `Mapster.DependencyInjection` | Omar |
| Validation | `FluentValidation.AspNetCore` | Omar |
| Mediator/CQRS | `MediatR` | Omar |
| Caching | `StackExchange.Redis` | Reem |
| Auth | `Microsoft.AspNetCore.Authentication.JwtBearer`, `BCrypt.Net-Next` | Reem |
| Payments | `Stripe.net` | Reem |
| Logging | `Serilog.AspNetCore`, `Serilog.Sinks.Console`, `Serilog.Sinks.File` (or `Serilog.Sinks.Seq`) | Reem |
| Rate limiting | built-in `Microsoft.AspNetCore.RateLimiting` (.NET 7+) | Reem |
| AI/LLM | `OpenAI` (or `Anthropic.SDK`) NuGet client | Mariam |
| API docs | `Swashbuckle.AspNetCore` | Mariam (wiring) |
| Testing | `xUnit`, `Moq`, `FluentAssertions`, `Testcontainers` (for real-DB concurrency tests) | Omar + Rahaf |

---

## 5. Best Way to Work Together

- **Day 1**: Rahaf ships Domain skeleton (entities + interfaces) — this unblocks everyone. Treat this as a hard sync point, not a background task.
- **Day 2–4**: Omar builds Application against Rahaf's interfaces. Reem and Mariam build Infrastructure implementations in parallel — both only depend on Domain, so no blocking between them.
- **Day 4–5**: Integration — Mariam wires DI in `Program.cs`, connects real Infrastructure implementations to Application interfaces, stands up controllers.
- **Day 5–6**: Cross-cutting — logging, rate limiting, error middleware, idempotency/concurrency tests.
- **Day 6–7**: Buffer for the write-up, ERD/diagram, and rehearsing the defense — everyone must be able to explain their own layer AND how it plugs into the others, not just their own code.
- **Daily 15-min sync**: flag interface changes immediately — a changed method signature in Domain or Application interfaces is the #1 thing that breaks someone else's day.
- **Branching**: one branch per layer/owner (`feature/domain`, `feature/application`, `feature/infra`, `feature/ai`), merge to `develop` only when the layer compiles standalone against the interfaces below it.
- **Definition of done per person**: your layer compiles, your unit tests pass, and you can verbally defend every decision in your layer without your teammates filling in for you — that's literally the grading bar.
