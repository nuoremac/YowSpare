---

# YowSpare – Offline-First MRO Spare Parts Management (Frontend Prototype)

YowSpare is an **offline-first, multi-tenant SaaS frontend prototype** designed for managing spare parts in **Maintenance, Repair, and Operations (MRO)** contexts.
It targets industrial environments (oil & gas, mining, energy, manufacturing) where **connectivity is unreliable**, but **availability of spare parts is critical**.

This repository contains the **modern frontend implementation with mocked data only**.

---

## Key Features

###  Offline-First by Design

* Works **100% offline** after first load
* Uses **IndexedDB** for persistent local storage
* Designed to later integrate DuckDB-Wasm for analytics
* All operations are queued locally (mock sync)

### Progressive Web App (PWA)

* Installable on mobile
* App-like experience (standalone mode)
* Cached UI shell and assets
* Works without network after first visit

### Multi-Tenant Architecture (Frontend Simulation)

* Each tenant has isolated data
* Tenant resolved from:

  * URL parameter (`?tenant=demo`)
  * or hostname (`demo.yowspare.com`)
* Tenant data seeded locally on first login

### Role-Based Access Control (RBAC)

Each user has **one immutable role**:

* `TECH` – Inventory access
* `WAREHOUSE` – Warehouse & stock movements
* `PROCUREMENT` – Reorder alerts & purchase orders
* `PLANNER` – Analytics (mocked)
* `SUPPLIER` – Purchase order responses

- Navigation is role-filtered
- Pages are role-guarded
- Users cannot switch roles

---

## Application Flow

```
/               → Authentication (offline login)
/app            → Dashboard (role-based)
/inventory      → Inventory (TECH, WAREHOUSE, PROCUREMENT, PLANNER)
/warehouse      → Warehouse (WAREHOUSE)
/procurement    → Procurement (PROCUREMENT, SUPPLIER)
/planner        → Planner (PLANNER)
```

> Route groups like `(auth)` and `(app)` are used for structure
> Real URLs are **explicitly defined** (`/app`, `/inventory`, etc.)

---

##  Authentication (Mocked, Offline)

* No backend authentication
* Users are **seeded locally** per tenant
* Login selects a user by email
* Session stored using **Zustand + persist**
* Session survives refresh and navigation

---

## State Management

### Zustand Store (`src/store/session.ts`)

* Stores:

  * `tenant`
  * `user`
  * `role`
* Persisted to `localStorage`
* Role derived **only from logged-in user**
* No role switching in UI (by design)

---

##  Data Layer (Mocked)

* IndexedDB via a typed helper
* Entities:

  * Tenant
  * User
  * Part
  * Bin
  * Stock
  * Supplier
  * Catalog
  * Purchase Order
  * Stock Movement
* All schemas are strongly typed (`src/lib/type.ts`)

---

##  Warehouse & Inventory

* Inventory lookup by SKU
* Warehouse bin map (mock coordinates)
* Stock IN / OUT operations
* Movements queued locally (mock sync)

---

##  Procurement

* Reorder alerts based on:

  * ROP
  * Safety stock
* Supplier comparison table
* One-click Purchase Order creation
* Supplier response simulation

---

##  PWA Support

### Enabled with:

* `@ducanh2912/next-pwa`
* Web App Manifest (`src/app/manifest.ts`)
* Service Worker (production only)

### What the PWA provides:

* Offline UI shell
* Installability
* Asset caching

> Business data offline support is handled by IndexedDB (not by the service worker).

---

##  Tech Stack

* **Next.js 16 (App Router)**
* **React 19**
* **TypeScript (strict)**
* **Zustand** (state + persistence)
* **IndexedDB**
* **Tailwind CSS**
* **@ducanh2912/next-pwa**
* **Webpack build mode** (required for PWA plugin)

---

## Scripts

```json
{
  "dev": "next dev --webpack",
  "build": "next build --webpack",
  "start": "next start"
}
```

> Webpack is explicitly used because the PWA plugin relies on webpack hooks.

---

## Development Notes

* PWA is **disabled in development**
* Test PWA using:

  ```bash
  npm run build
  npm run start
  ```
* Open Chrome DevTools → **Application**

  * Manifest
  * Service Workers
  * Cache Storage

---

##  Important Folders

```
src/
├─ app/
│  ├─ (auth)/          # Login
│  ├─ app/             # /app dashboard
│  ├─ inventory/
│  ├─ warehouse/
│  ├─ procurement/
│  └─ planner/
├─ components/
├─ lib/
│  ├─ db.ts
│  ├─ seed.ts
│  ├─ tenant.ts
│  └─ type.ts
├─ store/
│  └─ session.ts
```

---

## Scope of This Prototype

✔ Frontend only
✔ Mocked data
✔ No backend
✔ No real sync
✔ Architecture ready for production backend

---

## Goal

This prototype demonstrates how an **industrial, offline-first, multi-tenant SaaS frontend** can be built with modern web technologies, while respecting:

* real MRO constraints
* role separation
* offline environments
* PWA deployment requirements

---
