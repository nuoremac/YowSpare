## Project Context

### Organization
- An organization is defined by: tax number, business registration number, capital share, CEO name, year founded, name, logo, website URL and social networks, email, description, legal form, and a headquarter (which is one of the agencies).

### Agency
- An organization has multiple agencies defined by: location, name, owner ID/name, description, open/close times, contact, average revenue, registration numbers, total affiliated customers, and tax number.

### Employees (per agency)
- Employees have permissions and profiles defined by: first and last name, email, phone, description, gender, photo, nationality, birth date, profession, biography, addresses, contact, role, and department.

## User Journey
1. The first user who creates the organization account becomes the admin and can invite other agency owners.
2. Each agency owner (tenant admin) can invite users in the agency, manage users/roles, manage tenant profile, and view an overview of their actions.
3. In an agency, roles are:
   - Technician: search parts, check stock, consume/issue parts.
   - Inventory manager: manage bins/locations, stock in/out/transfers, reconcile counts.
   - Procurement manager: manage suppliers, catalog/pricing, create/track purchase orders.
   - Analyst: analytics, KPIs, demand/usage trends.
4. A supplier is an existing organization within the application and can view incoming purchase orders and respond with pricing/lead time.

## Integration Into Host Frontends (`comops-frontend` / `ksm-frontend`)

YowSpare can now run under a route prefix (example: `/yowspare`) so it can be mounted inside another frontend host.

### 1) YowSpare env (build-time)

Set these in `yowspare-frontend`:

```bash
# Route prefix when embedded behind a host app proxy.
NEXT_PUBLIC_APP_BASE_PATH=/yowspare

# Optional: disables PWA/service worker for embedded mode.
NEXT_PUBLIC_INTEGRATION_MODE=true

# Keep API bases relative so they follow the prefix:
NEXT_PUBLIC_CORE_API_BASE=/api/tiers
NEXT_PUBLIC_STOCK_API_BASE=/api/stock
NEXT_PUBLIC_SPARE_API_BASE=/api/spare
NEXT_PUBLIC_TIERS_API_BASE=/api/tiers
NEXT_PUBLIC_BILLING_API_BASE=/api/billing
NEXT_PUBLIC_ACCOUNTING_API_BASE=/api/accounting
```

And configure upstream targets (used by Next.js rewrites):

```bash
KERNEL_CORE_DEST=https://yowspare-backend.onrender.com
KERNEL_CORE_CLIENT_ID=your-client-application-id
KERNEL_CORE_API_KEY=your-server-side-client-secret
KERNEL_CORE_DEFAULT_TENANT_ID=your-platform-tenant-uuid
CORE_API_DEST=https://yowspare-backend.onrender.com
CORE_API_PATH_PREFIX=/api
STOCK_API_DEST=https://yowspare-backend.onrender.com
STOCK_API_PATH_PREFIX=/api
SPARE_API_DEST=https://yowspare-backend.onrender.com
SPARE_API_PATH_PREFIX=/api/spare
TIERS_API_DEST=https://yowspare-backend.onrender.com
TIERS_API_PATH_PREFIX=/api
BILLING_API_DEST=https://yowspare-backend.onrender.com
ACCOUNTING_API_DEST=https://yowspare-backend.onrender.com
```

The three `KERNEL_CORE_*` authentication variables are server-only. Do not
expose the API key through a `NEXT_PUBLIC_*` variable.

The app now prefixes internal API bases and static icon paths automatically when `NEXT_PUBLIC_APP_BASE_PATH` is set.

### 2) Host app (`comops-frontend` or `ksm-frontend`) proxy

In `comops-frontend/next.config.ts`, proxy `/yowspare/:path*` to the deployed/running YowSpare app.
Example destination:

```ts
{ source: "/yowspare/:path*", destination: "https://your-yowspare-domain/:path*" }
```

### 3) Result

- Open YowSpare from host app at `/yowspare`.
- YowSpare routes, static assets, and API proxy calls stay under the same prefix.
