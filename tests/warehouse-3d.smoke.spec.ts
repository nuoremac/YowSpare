import { expect, test } from "@playwright/test";
import sharp from "sharp";

test.setTimeout(600_000);

const products = [
  {
    id: "product-1",
    organizationId: "organization-1",
    sku: "BRK-001",
    name: "Brake Caliper",
    categoryId: "category-1",
    categoryName: "Braking",
    minStockLevel: 4,
  },
  {
    id: "product-2",
    organizationId: "organization-1",
    sku: "FLT-002",
    name: "Oil Filter",
    categoryId: "category-2",
    categoryName: "Filters",
    minStockLevel: 8,
  },
];

const installApiMocks = async (page: import("@playwright/test").Page) => {
  await page.route("**/api/tiers/users/me**", (route) =>
    route.fulfill({
      json: {
        id: "user-1",
        tenantId: "tenant-1",
        organizationId: "organization-1",
        businessActorId: "actor-1",
        email: "owner@example.com",
        firstName: "Warehouse",
        lastName: "Owner",
        roles: ["ORGANIZATION_ADMIN"],
        active: true,
      },
    }),
  );
  await page.route("**/api/tiers/agencies", (route) =>
    route.fulfill({
      json: [
        {
          id: "agency-1",
          name: "Main Warehouse",
          type: "WAREHOUSE",
          isHeadquarter: true,
        },
      ],
    }),
  );
  await page.route("**/api/tiers/employees", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/stock/products/categories", (route) =>
    route.fulfill({
      json: [
        { id: "category-1", name: "Braking" },
        { id: "category-2", name: "Filters" },
      ],
    }),
  );
  await page.route("**/api/stock/products", (route) =>
    route.fulfill({ json: products }),
  );
  await page.route("**/api/stock/stock-levels", (route) =>
    route.fulfill({
      json: [
        {
          id: "level-1",
          productId: "product-1",
          agencyId: "agency-1",
          quantity: 18,
        },
        {
          id: "level-2",
          productId: "product-2",
          agencyId: "agency-1",
          quantity: 3,
        },
      ],
    }),
  );
  await page.route("**/api/stock/movements", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(
    "**/api/spare/warehouses/agency-1/product-locations",
    (route) =>
      route.fulfill({
        json: [
          {
            agencyId: "agency-1",
            productId: "product-1",
            binCode: "A1",
          },
          {
            agencyId: "agency-1",
            productId: "product-2",
            binCode: "D6",
          },
        ],
      }),
  );
};

const installOwnerSession = async (page: import("@playwright/test").Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "yowspare-session",
      JSON.stringify({
        state: {
          tenant: {
            id: "organization-1",
            businessActorId: "actor-1",
            name: "Smoke Test Parts",
          },
          user: {
            id: "user-1",
            tenantId: "tenant-1",
            organizationId: "organization-1",
            businessActorId: "actor-1",
            email: "owner@example.com",
            firstName: "Warehouse",
            lastName: "Owner",
          },
          roles: [],
          activeAgencyId: "agency-1",
          token: "smoke-token",
          currency: "XAF",
        },
        version: 0,
      }),
    );
  });
};

const assertCanvasHasPixels = async (
  canvas: import("@playwright/test").Locator,
  path: string,
  minimumWidth: number,
) => {
  const dataUrl = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL("image/png"),
  );
  const image = Buffer.from(dataUrl.split(",")[1], "base64");
  await sharp(image).png().toFile(path);
  const { data, info } = await sharp(image)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const colors = new Set<string>();
  const stride = Math.max(3, Math.floor(data.length / 6000 / 3) * 3);
  for (let index = 0; index < data.length; index += stride) {
    colors.add(`${data[index]},${data[index + 1]},${data[index + 2]}`);
  }

  expect(info.width).toBeGreaterThan(minimumWidth);
  expect(info.height).toBeGreaterThan(400);
  expect(colors.size).toBeGreaterThan(20);
};

test("owner can operate warehouse and inspect exact 3D bin positions", async ({
  page,
}) => {
  await installApiMocks(page);
  await installOwnerSession(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://localhost:3000/app/warehouse", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByText(
      "Your role can view warehouse data, but operations are disabled.",
    ),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Map", exact: true }).click();

  const map = page.locator('[role="application"][aria-label]');
  await expect(map).toBeVisible({ timeout: 120_000 });
  const canvas = map.locator("canvas");
  await expect(canvas).toBeVisible();
  await assertCanvasHasPixels(
    canvas,
    "/tmp/warehouse-3d-canvas.png",
    500,
  );

  await map.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Aisle 1 / Rack A / Bay 01 / Level 1").first(),
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(map).toBeVisible();
  await map.scrollIntoViewIfNeeded();
  await assertCanvasHasPixels(
    canvas,
    "/tmp/warehouse-3d-mobile-canvas.png",
    280,
  );
});
