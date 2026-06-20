# Frontend to KernelCore endpoint audit

Audit date: 2026-06-13

## Routing

- `/api/tiers/*` is handled by `kernelTiersProxy.ts` and forwarded to KernelCore `/api/*`.
- `/api/stock/*` is handled by `kernelStockProxy.ts` and translated to KernelCore product and inventory APIs.
- `/api/spare/*` is rewritten to KernelCore `/api/spare/*`.
- All active clients send the selected tenant, organization, agency, and bearer token when available.

## Connected active features

| Frontend feature | Frontend path | KernelCore path | Notes |
| --- | --- | --- | --- |
| Login | `/api/tiers/auth/login` | `/api/auth/login` | Request and response translated by the tiers proxy. |
| Registration | `/api/tiers/auth/register` | `/api/auth/sign-up` | Request and response translated by the tiers proxy. |
| Current user | `/api/tiers/users/me` | `/api/users/me` | Direct contract. |
| Actor profile | `/api/tiers/actors/*` | `/api/actors/*` | Direct contract. |
| Organizations | `/api/tiers/organizations/*` | `/api/organizations/*` | Legacy fields translated by the tiers proxy. |
| Agencies | `/api/tiers/agencies/*` | `/api/organizations/{organizationId}/agencies/*` | Path and body translated by the tiers proxy. |
| Employees | `/api/tiers/employees*` | `/api/employees*` | List query and invite path translated by the tiers proxy. |
| Settings | `/api/tiers/settings/*` | KernelCore general options endpoints | Uses the KernelCore fallback paths. |
| Files | `/api/tiers/files/*` | `/api/files/*` | Direct contract. |
| System audit | `/api/tiers/system-audits/*` | `/api/system-audits/*` | Direct contract. |
| Products and categories | `/api/stock/products*` | `/api/products*`, `/api/product-categories*` | Request and response translated by the stock proxy. |
| Stock levels and movements | `/api/stock/stock-levels`, `/api/stock/movements*` | `/api/inventory/movements*` | Translated and grouped by the stock proxy. |
| Purchase orders | `/api/spare/purchase-orders*` | `/api/spare/purchase-orders*` | Direct contract. |
| Receipts | `/api/spare/receipts*` | `/api/spare/receipts*` | Direct contract. |
| Product locations | `/api/spare/warehouses/*/product-locations*` | Same | Direct contract. |
| Departments | `/api/spare/departments*` | Same | Added to KernelCore, including member assignment. |

## Partial or unsupported active features

| Frontend feature | Status | Reason |
| --- | --- | --- |
| Suppliers | Partial | KernelCore has `/api/suppliers` CRUD, but the frontend still calls `/api/spare/suppliers`. KernelCore has no supplier-product link contract matching the UI. |
| Reorder analytics | Unsupported | No KernelCore `/api/spare/analytics/reorder-recommendations` controller exists. |
| Material requests | Unsupported | No KernelCore `/api/spare/material-requests` controller exists. |
| Approval workflow | Unsupported | No KernelCore `/api/spare/workflow/requests` controller exists. |
| Invitation acceptance | Unsupported | The frontend calls old Spare invitation endpoints and `/api/auth/accept-invitation`; KernelCore exposes employee invite but not this token workflow. |
| Warehouse layout | Unsupported | Product locations exist, but `/api/spare/warehouses/{agencyId}/layout` does not. |

## Generated but currently unused mismatches

- `POST /api/tiers/employees/roles` has no compatible KernelCore request contract.
- `GET /api/tiers/employees/{id}` is not exposed by KernelCore.
- Legacy location-policy and reservation clients have no matching KernelCore Spare controllers.
- Generated stock inventory-session and transformation clients require separate contract verification before use.

## Department implementation

KernelCore now owns departments in the `spare` schema:

- `spare.departments`
- `spare.department_members`

The API is tenant and organization scoped and supports list, create, update, delete, list members, add member, and remove member.
