# LiliShop Frontend - AI Agent Instructions

## Project Overview
LiliShop is a modern Angular 21 e-commerce frontend for a .NET 9 backend API. The application supports two distinct user roles: **regular users** (shopping) and **administrators** (content management).

**Key Tech Stack:** Angular 21, TypeScript (strict mode), Material Design, RxJS, Stripe integration, Cloudinary for images

---

## Architecture Patterns

### Module Structure (SCAM - Single Component Angular Module anti-pattern avoided)
- **Core Module** (`src/app/core/`): Single-use services, guards, interceptors, error/not-found pages. Imported once in `AppModule` only (guarded by constructor check).
- **Shared Module** (`src/app/shared/`): Reusable components, pipes, directives, Material imports, models/constants used across features.
- **Features Modules** (`src/app/features/`):
  - `user-area/`: User shopping, account, checkout flows
  - `admin-area/`: Admin dashboard, product/user management
  - Both lazy-loaded via routing

**Critical Rule:** Core module must only be imported in AppModule—constructor enforces singleton pattern.

### Service Architecture
Services use `providedIn: 'root'` for tree-shaking. State management relies on **RxJS BehaviorSubject** for shared state:
- `AccountService.currentUser$`: ReplaySubject(1) tracks authenticated user across app
- `BasketService.basket$`: BehaviorSubject manages shopping cart state
- `ProductService`: Implements optional caching (configurable in `environment.useCache`)

**HTTP Communication:** No custom API wrapper—services call `HttpClient` directly with base URL from `environment.apiUrl`.

### Data Flow for Key Operations

**Authentication Flow:**
1. `LoginComponent` → `AccountService.login()` → stores JWT token via `StorageService`
2. `jwtInterceptor` attaches Bearer token to all requests
3. Token refresh handled automatically on 401 (prevents multiple refresh requests via `TokenService.isRefreshing()`)
4. `AccountService.currentUser$` observable subscribed by guards and components

**Shopping Flow:**
1. Product listing: `ProductService.getProducts()` with query params (pagination, filters, sort)
2. Add to cart: `BasketService.addToBasket()` → updates `basket$` observable
3. Checkout: `CheckoutService` + `BasketService.createPaymentIntent()` → Stripe integration

---

## Critical Conventions & Patterns

### Observable Handling
- **Always use RxJS operators**: Use `map`, `switchMap`, `tap`, `catchError` for transformations
- **Unsubscribe pattern**: Components use `@ngneat/until-destroy` via `UntilDestroy` decorator to auto-unsubscribe
- **No manual subscriptions in templates**: Use `async` pipe (e.g., `{{ basket$ | async }}`)

**Example:** [src/app/core/services/account.service.ts](src/app/core/services/account.service.ts#L44) shows `tap` usage to update ReplaySubject in `loadCurrentUser()`

### Type Safety
- **Strict mode enabled** in `tsconfig.json`: `strict: true`, `noUnusedLocals`, `strictNullChecks`
- **All HTTP responses are typed** with interfaces from `src/app/shared/models/`
- **Nullable types:** Use `Type | null`, not `any`. Handle null explicitly in operators (`map`, `switchMap`)

### Angular 21 Modern Syntax
- **Standalone components not used** (project pre-dates standalone era)
- **Signal-based change detection**: `provideZonelessChangeDetection()` in `AppModule` for performance
- **Functional interceptors**: `HttpInterceptorFn` (not class-based) in `jwtInterceptor`, `loadingInterceptor`, `errorInterceptor`
- **Functional guards**: `CanMatchFn` for route protection ([src/app/core/guards/auth.guard.ts](src/app/core/guards/auth.guard.ts#L12))

### Forms & Validation
- **Reactive Forms** via `FormBuilder` (not template-driven)
- **Custom form controls**: `ControlValueAccessor` for `TextInputComponent`, `TextTextareaComponent`, `PhotoEditorComponent`
- **Query params preservation**: Admin pages (products, users) persist filter/sort state via `ProductQueryParams`, `UserQueryParams`

### Authorization
- **Policy-based authorization** (not role-based RBAC):
  - `AuthorizationService.getPolicy()` fetches required roles for a policy from backend
  - `authGuard` checks `route.data['policy']` matches user role
  - `CheckPolicyDirective` hides UI elements without permission
- Example: `admin` route requires policy from route data

---

## Build & Development Commands

```bash
npm start                    # ng serve (http://localhost:4200)
npm build                    # ng build (outputs to ../../backend/wwwroot)
npm watch                    # ng build --watch --configuration development
npm test                     # ng test (runs Karma + Jasmine)
```

**Important:** Build output writes to `../../LiliShop-backend-dotnet/Lili.Shop/Main/LiliShop.API/wwwroot` (see `angular.json`). This feeds the .NET backend.

---

## Integration Points

### External Services
- **Stripe** (`@stripe/stripe-js`): Payment processing via `CheckoutService` + `StripeUtils` helper
- **Cloudinary** (`@cloudinary/ng`): Image uploads/optimization. Config: `cloudinary.config.ts`
- **Google OAuth**: Social login via `google_clientId` in `environment.ts`
- **SignalR** (`@microsoft/signalr`): Real-time notifications via `PrintessSignalRService`

### Backend Communication
- **Base URL:** `environment.apiUrl` (dev: `http://localhost:6001/api/`)
- **Error handling:** `errorInterceptor` catches 4xx/5xx, shows `DialogComponent` modal
- **Loading indicator:** `loadingInterceptor` triggers `BusyService` to show spinner

---

## File Organization Reference

| Path | Purpose |
|------|---------|
| `src/app/core/services/` | Singleton services (auth, basket, products, notifications) |
| `src/app/core/guards/` | Route guards (auth policy enforcement) |
| `src/app/core/interceptors/` | HTTP interceptors (JWT, errors, loading) |
| `src/app/shared/components/` | Reusable UI (navbar, forms, dialogs) |
| `src/app/shared/models/` | TypeScript interfaces/types for API DTOs |
| `src/app/shared/constants/` | Enums, magic strings, local storage keys |
| `src/app/features/user-area/` | Shopping, checkout, account pages |
| `src/app/features/admin-area/` | Admin dashboard, product/user management |

---

## Common Tasks

### Adding a New Feature
1. **Create feature module** with lazy-loaded routing in `app-routing.module.ts`
2. **Define models** in `src/app/shared/models/` (interface extends backend API contract)
3. **Create service** in core if shared, else in feature module
4. **Use `async` pipe** in templates, inject service via constructor

### Debugging Authentication Issues
1. Check `StorageService.get(LOCAL_STORAGE_KEYS.AUTH_TOKEN)` for token presence
2. Verify JWT payload at [jwt.io](https://jwt.io)
3. Test `jwtInterceptor` bypass by checking request headers in DevTools

### Working with Product Caching
- Toggle `environment.useCache` to enable/disable cache (1-minute TTL)
- Cache key generated from query params—clear cache when params change

---

## Testing Notes
- **Test command:** `npm test` (Karma + Jasmine)
- **Spec files colocated:** `component.spec.ts` alongside `component.ts`
- **Mocking:** Use `HttpClientTestingModule` for HTTP mocks

