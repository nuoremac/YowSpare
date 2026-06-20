/**
 * DuckDB-Wasm local-first service for spare-parts inventory analytics.
 *
 * Provides an in-browser analytical SQL engine. Data is loaded from the API
 * once and cached locally, enabling fast offline queries and low-latency
 * dashboard aggregations without round-trips to the server.
 *
 * Usage:
 *   const db = await getDuckDB();
 *   const rows = await db.query("SELECT sku, qty FROM stock WHERE qty < 10");
 */

import * as duckdb from "@duckdb/duckdb-wasm";

// ─── Singleton ────────────────────────────────────────────────────────────────

let _db: duckdb.AsyncDuckDB | null = null;
let _conn: duckdb.AsyncDuckDBConnection | null = null;
let _initialized = false;

/**
 * Initialises DuckDB-Wasm and returns the database instance.
 * Subsequent calls return the cached instance.
 */
export async function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (_db && _initialized) return _db;

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: "text/javascript" })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  _db = new duckdb.AsyncDuckDB(logger, worker);
  await _db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  _initialized = true;
  return _db;
}

/**
 * Returns a persistent DuckDB connection (creates one if needed).
 */
export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (_conn) return _conn;
  const db = await getDuckDB();
  _conn = await db.connect();
  return _conn;
}

// ─── Schema bootstrap ─────────────────────────────────────────────────────────

/**
 * Creates the local inventory tables if they do not already exist.
 * Call this once after the DB is initialised.
 */
export async function bootstrapSchema(): Promise<void> {
  const conn = await getConnection();

  await conn.query(`
    CREATE TABLE IF NOT EXISTS stock_levels (
      agency_id    VARCHAR NOT NULL,
      product_id   VARCHAR NOT NULL,
      sku          VARCHAR,
      product_name VARCHAR,
      qty          INTEGER NOT NULL DEFAULT 0,
      min_qty      INTEGER,
      loaded_at    TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (agency_id, product_id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id           VARCHAR PRIMARY KEY,
      agency_id    VARCHAR NOT NULL,
      product_id   VARCHAR NOT NULL,
      sku          VARCHAR,
      type         VARCHAR NOT NULL,
      status       VARCHAR NOT NULL,
      qty          INTEGER NOT NULL,
      reference    VARCHAR,
      moved_at     TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id            VARCHAR PRIMARY KEY,
      po_number     VARCHAR NOT NULL,
      supplier_name VARCHAR,
      status        VARCHAR NOT NULL,
      total_ht      DOUBLE,
      created_at    TIMESTAMP
    )
  `);
}

// ─── Data loaders ─────────────────────────────────────────────────────────────

export type StockLevelRow = {
  agencyId: string;
  productId: string;
  sku?: string;
  productName?: string;
  qty: number;
  minQty?: number;
};

/**
 * Loads stock level rows into the local DuckDB table.
 * Replaces existing rows for the given agency.
 *
 * @param agencyId the agency to load data for
 * @param rows     the stock level rows from the API
 */
export async function loadStockLevels(agencyId: string, rows: StockLevelRow[]): Promise<void> {
  const conn = await getConnection();
  await conn.query(`DELETE FROM stock_levels WHERE agency_id = '${agencyId}'`);

  for (const r of rows) {
    await conn.query(`
      INSERT INTO stock_levels (agency_id, product_id, sku, product_name, qty, min_qty)
      VALUES (
        '${agencyId}',
        '${r.productId}',
        ${r.sku ? `'${r.sku.replace(/'/g, "''")}'` : "NULL"},
        ${r.productName ? `'${r.productName.replace(/'/g, "''")}'` : "NULL"},
        ${r.qty},
        ${r.minQty ?? "NULL"}
      )
      ON CONFLICT (agency_id, product_id) DO UPDATE SET
        qty = EXCLUDED.qty,
        min_qty = EXCLUDED.min_qty,
        loaded_at = NOW()
    `);
  }
}

// ─── Analytical queries ───────────────────────────────────────────────────────

/**
 * Returns products below their configured minimum quantity.
 *
 * @param agencyId the agency to query
 * @returns rows with sku, product_name, qty, min_qty
 */
export async function queryLowStock(agencyId: string): Promise<unknown[]> {
  const conn = await getConnection();
  const result = await conn.query(`
    SELECT sku, product_name, qty, min_qty,
           ROUND((qty::DOUBLE / NULLIF(min_qty, 0)) * 100, 1) AS pct_of_min
    FROM   stock_levels
    WHERE  agency_id = '${agencyId}'
      AND  min_qty IS NOT NULL
      AND  qty < min_qty
    ORDER BY (qty::DOUBLE / NULLIF(min_qty, 0)) ASC
  `);
  return result.toArray().map((r) => r.toJSON());
}

/**
 * Returns a stock summary for a given agency: total products, total units,
 * count of low-stock items, count of out-of-stock items.
 *
 * @param agencyId the agency to query
 */
export async function queryStockSummary(agencyId: string): Promise<{
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
}> {
  const conn = await getConnection();
  const result = await conn.query(`
    SELECT
      COUNT(*)                                                        AS total_products,
      COALESCE(SUM(qty), 0)                                           AS total_units,
      COUNT(*) FILTER (WHERE min_qty IS NOT NULL AND qty < min_qty)   AS low_stock_count,
      COUNT(*) FILTER (WHERE qty = 0)                                 AS out_of_stock_count
    FROM stock_levels
    WHERE agency_id = '${agencyId}'
  `);
  const row = result.toArray()[0]?.toJSON() as Record<string, number> | undefined;
  return {
    totalProducts:  Number(row?.total_products  ?? 0),
    totalUnits:     Number(row?.total_units      ?? 0),
    lowStockCount:  Number(row?.low_stock_count  ?? 0),
    outOfStockCount: Number(row?.out_of_stock_count ?? 0),
  };
}

/**
 * Returns top N products by quantity.
 *
 * @param agencyId the agency to query
 * @param limit    maximum number of rows (default 10)
 */
export async function queryTopStockProducts(agencyId: string, limit = 10): Promise<unknown[]> {
  const conn = await getConnection();
  const result = await conn.query(`
    SELECT sku, product_name, qty
    FROM   stock_levels
    WHERE  agency_id = '${agencyId}'
    ORDER BY qty DESC
    LIMIT ${limit}
  `);
  return result.toArray().map((r) => r.toJSON());
}
