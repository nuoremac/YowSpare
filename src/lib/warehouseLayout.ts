export const WAREHOUSE_BIN_ROWS = ["A", "B", "C", "D", "E", "F"] as const;
export const WAREHOUSE_BIN_COLUMNS = 10;

export const WAREHOUSE_BINS = WAREHOUSE_BIN_ROWS.flatMap((row) =>
  Array.from(
    { length: WAREHOUSE_BIN_COLUMNS },
    (_, index) => `${row}${index + 1}`,
  ),
);

export type WarehouseBinPosition = {
  aisle: number;
  bay: number;
  bin: string;
  level: number;
  rack: string;
  side: "LEFT" | "RIGHT";
  x: number;
  z: number;
};

const AISLE_CENTERS = [-5.4, 0, 5.4] as const;
const RACK_OFFSET = 1.15;
const BAY_SPACING = 1.55;

export const getWarehouseBinPosition = (
  bin: string,
): WarehouseBinPosition | null => {
  const match = /^([A-F])(10|[1-9])$/i.exec(bin.trim());
  if (!match) return null;

  const rack = match[1].toUpperCase();
  const bay = Number(match[2]);
  const rowIndex = WAREHOUSE_BIN_ROWS.indexOf(
    rack as (typeof WAREHOUSE_BIN_ROWS)[number],
  );
  if (rowIndex < 0) return null;

  const aisle = Math.floor(rowIndex / 2) + 1;
  const side = rowIndex % 2 === 0 ? "LEFT" : "RIGHT";
  const x = (bay - (WAREHOUSE_BIN_COLUMNS + 1) / 2) * BAY_SPACING;
  const z =
    AISLE_CENTERS[aisle - 1] +
    (side === "LEFT" ? -RACK_OFFSET : RACK_OFFSET);

  return {
    aisle,
    bay,
    bin: `${rack}${bay}`,
    level: 1,
    rack,
    side,
    x,
    z,
  };
};
