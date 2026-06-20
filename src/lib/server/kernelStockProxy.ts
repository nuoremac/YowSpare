import { NextResponse } from "next/server";

const DEFAULT_LOCAL_TENANT_ID = "11111111-1111-1111-1111-111111111111";

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const configuration = () => {
  const baseUrl = (
    process.env.KERNEL_CORE_DEST ||
    process.env.STOCK_API_DEST ||
    "http://localhost:8080"
  ).replace(/\/+$/, "");
  const clientId = process.env.KERNEL_CORE_CLIENT_ID;
  const apiKey = process.env.KERNEL_CORE_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error("KernelCore client credentials are not configured.");
  }

  return {
    apiKey,
    baseUrl,
    clientId,
    tenantId:
      process.env.KERNEL_CORE_DEFAULT_TENANT_ID || DEFAULT_LOCAL_TENANT_ID,
  };
};

const requestHeaders = (
  request: Request,
  clientId: string,
  apiKey: string,
  defaultTenantId: string,
) => {
  const headers = new Headers();
  [
    "accept",
    "authorization",
    "content-type",
    "x-agency-id",
    "x-organization-id",
    "x-request-id",
    "x-tenant-id",
  ].forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });
  headers.set("X-Client-Id", clientId);
  headers.set("X-Api-Key", apiKey);
  if (!headers.has("X-Tenant-Id")) {
    headers.set("X-Tenant-Id", defaultTenantId);
  }
  return headers;
};

const parseBody = async (request: Request) => {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const text = await request.text();
  return text ? (JSON.parse(text) as unknown) : undefined;
};

const unwrap = (payload: unknown) =>
  isObject(payload) && "data" in payload ? payload.data : payload;

const callKernel = async (
  baseUrl: string,
  path: string,
  headers: Headers,
  method = "GET",
  body?: unknown,
) => {
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    redirect: "manual",
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return { payload, response };
};

const upstreamFailure = (response: Response, payload: unknown) =>
  NextResponse.json(payload, { status: response.status });

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 32) || "CATEGORY";

const mapCategory = (value: unknown) => {
  if (!isObject(value)) return value;
  return {
    id: value.id,
    organizationId: value.organizationId,
    name: value.name,
    description: value.description,
    parentId: value.parentCode,
    code: value.code,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const mapProduct = (
  value: unknown,
  categories: Map<string, JsonObject> = new Map(),
) => {
  if (!isObject(value)) return value;
  const category =
    typeof value.categoryCode === "string"
      ? categories.get(value.categoryCode)
      : undefined;
  return {
    ...value,
    categoryId: category?.id,
    categoryName: category?.name,
    unit: value.variantLabel,
    defaultSalePrice: value.unitPrice,
    defaultCostPrice: value.unitPrice,
    stockable: true,
    perishable: false,
  };
};

const mapMovement = (value: unknown, products: Map<string, JsonObject>) => {
  if (!isObject(value)) return value;
  const productId =
    typeof value.productId === "string" ? value.productId : undefined;
  const product = productId ? products.get(productId) : undefined;
  const agencyId =
    typeof value.agencyId === "string" ? value.agencyId : undefined;
  const movementType =
    typeof value.movementType === "string" ? value.movementType : undefined;
  const legacyType =
    movementType === "INBOUND" || movementType === "ADJUSTMENT_IN"
      ? "IN"
      : movementType === "OUTBOUND" || movementType === "ADJUSTMENT_OUT"
        ? "OUT"
        : movementType;

  return {
    id: value.id,
    organizationId: value.organizationId,
    reference: value.referenceNumber,
    type: legacyType,
    status: value.status,
    sourceAgencyId: legacyType === "IN" ? undefined : agencyId,
    destinationAgencyId: legacyType === "IN" ? agencyId : undefined,
    thirdPartyId: value.thirdPartyId,
    notes: value.sourceDocumentNumber,
    items: [
      {
        productId,
        productName: product?.name,
        productCode: product?.sku,
        quantity: value.quantity,
        costPrice: product?.unitPrice,
      },
    ],
  };
};

const requireContext = (request: Request) => {
  const organizationId = request.headers.get("x-organization-id");
  if (!organizationId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          data: null,
          message: "No active organization is selected.",
          errorCode: "ORGANIZATION_REQUIRED",
        },
        { status: 400 },
      ),
    };
  }
  return {
    agencyId: request.headers.get("x-agency-id"),
    organizationId,
  };
};

export const proxyStockRequest = async (
  request: Request,
  pathSegments: string[],
) => {
  try {
    const config = configuration();
    const headers = requestHeaders(
      request,
      config.clientId,
      config.apiKey,
      config.tenantId,
    );
    const context = requireContext(request);
    if ("error" in context) return context.error;

    const frontendPath = pathSegments.join("/");
    const body = await parseBody(request);
    const orgQuery = `organizationId=${encodeURIComponent(context.organizationId)}`;

    if (request.method === "GET" && frontendPath === "products/categories") {
      const result = await callKernel(
        config.baseUrl,
        `/api/product-categories?${orgQuery}`,
        headers,
      );
      if (!result.response.ok) {
        return upstreamFailure(result.response, result.payload);
      }
      const categories = unwrap(result.payload);
      return NextResponse.json(
        Array.isArray(categories) ? categories.map(mapCategory) : [],
      );
    }

    if (request.method === "POST" && frontendPath === "products/categories") {
      const legacy = isObject(body) ? body : {};
      const name = typeof legacy.name === "string" ? legacy.name.trim() : "";
      const result = await callKernel(
        config.baseUrl,
        "/api/product-categories",
        headers,
        "POST",
        {
          organizationId: context.organizationId,
          code: slugify(name),
          name,
          description: legacy.description,
        },
      );
      if (!result.response.ok) {
        return upstreamFailure(result.response, result.payload);
      }
      return NextResponse.json(mapCategory(unwrap(result.payload)), {
        status: result.response.status,
      });
    }

    const categoryMatch = frontendPath.match(/^products\/categories\/([^/]+)$/);
    if (
      categoryMatch &&
      (request.method === "PATCH" || request.method === "PUT")
    ) {
      const legacy = isObject(body) ? body : {};
      const result = await callKernel(
        config.baseUrl,
        `/api/product-categories/${encodeURIComponent(categoryMatch[1])}`,
        headers,
        "PATCH",
        {
          name: legacy.name,
          description: legacy.description,
          parentCode: legacy.parentId,
        },
      );
      if (!result.response.ok) {
        return upstreamFailure(result.response, result.payload);
      }
      return NextResponse.json(mapCategory(unwrap(result.payload)));
    }

    if (categoryMatch && request.method === "DELETE") {
      const result = await callKernel(
        config.baseUrl,
        `/api/product-categories/${encodeURIComponent(categoryMatch[1])}`,
        headers,
        "DELETE",
      );
      if (!result.response.ok) {
        return upstreamFailure(result.response, result.payload);
      }
      return NextResponse.json(unwrap(result.payload));
    }

    const loadCategories = async () => {
      const result = await callKernel(
        config.baseUrl,
        `/api/product-categories?${orgQuery}`,
        headers,
      );
      if (!result.response.ok) return new Map<string, JsonObject>();
      const values = unwrap(result.payload);
      return new Map(
        (Array.isArray(values) ? values : [])
          .filter(isObject)
          .filter((value) => typeof value.code === "string")
          .map((value) => [value.code as string, value]),
      );
    };

    const mapProductMutation = (
      legacy: JsonObject,
      categories: Map<string, JsonObject>,
    ) => {
      const category = Array.from(categories.values()).find(
        (value) => value.id === legacy.categoryId,
      );
      const name = typeof legacy.name === "string" ? legacy.name.trim() : "";
      const unitPrice =
        typeof legacy.defaultSalePrice === "number"
          ? legacy.defaultSalePrice
          : typeof legacy.defaultCostPrice === "number"
            ? legacy.defaultCostPrice
            : 0.01;
      return {
        organizationId: context.organizationId,
        sku: legacy.sku,
        name,
        familyCode:
          typeof category?.code === "string" ? category.code : "SPARE_PART",
        categoryCode: category?.code,
        variantLabel:
          typeof legacy.unit === "string" && legacy.unit.trim()
            ? legacy.unit.trim()
            : "UNIT",
        description: legacy.description,
        minStockLevel:
          typeof legacy.minStockLevel === "number"
            ? legacy.minStockLevel
            : null,
        maxStockLevel:
          typeof legacy.maxStockLevel === "number"
            ? legacy.maxStockLevel
            : null,
        unitPrice: Math.max(unitPrice, 0.01),
        currency: "XAF",
        status: "ACTIVE",
      };
    };

    if (request.method === "GET" && frontendPath === "products") {
      const [result, categories] = await Promise.all([
        callKernel(config.baseUrl, `/api/products?${orgQuery}`, headers),
        loadCategories(),
      ]);
      if (!result.response.ok) {
        return upstreamFailure(result.response, result.payload);
      }
      const products = unwrap(result.payload);
      return NextResponse.json(
        Array.isArray(products)
          ? products.map((value) => mapProduct(value, categories))
          : [],
      );
    }

    if (request.method === "POST" && frontendPath === "products") {
      const legacy = isObject(body) ? body : {};
      const categories = await loadCategories();
      const result = await callKernel(
        config.baseUrl,
        "/api/products",
        headers,
        "POST",
        mapProductMutation(legacy, categories),
      );
      if (!result.response.ok) {
        return upstreamFailure(result.response, result.payload);
      }
      return NextResponse.json(mapProduct(unwrap(result.payload), categories), {
        status: result.response.status,
      });
    }

    const productMatch = frontendPath.match(/^products\/([^/]+)$/);
    if (request.method === "GET" && productMatch) {
      const [result, categories] = await Promise.all([
        callKernel(config.baseUrl, `/api/products/${productMatch[1]}`, headers),
        loadCategories(),
      ]);
      if (!result.response.ok) {
        return upstreamFailure(result.response, result.payload);
      }
      return NextResponse.json(mapProduct(unwrap(result.payload), categories));
    }

    if (
      productMatch &&
      (request.method === "PATCH" || request.method === "PUT")
    ) {
      const legacy = isObject(body) ? body : {};
      const categories = await loadCategories();
      const result = await callKernel(
        config.baseUrl,
        `/api/products/${encodeURIComponent(productMatch[1])}`,
        headers,
        "PATCH",
        mapProductMutation(legacy, categories),
      );
      if (!result.response.ok) {
        return upstreamFailure(result.response, result.payload);
      }
      return NextResponse.json(mapProduct(unwrap(result.payload), categories));
    }

    if (productMatch && request.method === "DELETE") {
      const result = await callKernel(
        config.baseUrl,
        `/api/products/${encodeURIComponent(productMatch[1])}`,
        headers,
        "DELETE",
      );
      if (!result.response.ok) {
        return upstreamFailure(result.response, result.payload);
      }
      return NextResponse.json(unwrap(result.payload));
    }

    const loadProducts = async () => {
      const result = await callKernel(
        config.baseUrl,
        `/api/products?${orgQuery}`,
        headers,
      );
      return {
        ...result,
        products: Array.isArray(unwrap(result.payload))
          ? (unwrap(result.payload) as unknown[]).filter(isObject)
          : [],
      };
    };

    if (request.method === "GET" && frontendPath === "stock-levels") {
      if (!context.agencyId) {
        return NextResponse.json([], { status: 200 });
      }
      const productResult = await loadProducts();
      if (!productResult.response.ok) {
        return upstreamFailure(productResult.response, productResult.payload);
      }
      const balances = await Promise.all(
        productResult.products.map(async (product) => {
          const productId = String(product.id);
          const result = await callKernel(
            config.baseUrl,
            `/api/inventory/movements/balance?${orgQuery}&agencyId=${encodeURIComponent(context.agencyId!)}&productId=${encodeURIComponent(productId)}`,
            headers,
          );
          if (!result.response.ok) return null;
          const balance = unwrap(result.payload);
          if (!isObject(balance)) return null;
          return {
            id: `${context.agencyId}:${productId}`,
            productId,
            productName: product.name,
            productSku: product.sku,
            agencyId: context.agencyId,
            quantity: Number(balance.onHandQuantity || 0),
            availableQuantity: Number(balance.onHandQuantity || 0),
          };
        }),
      );
      return NextResponse.json(balances.filter(Boolean));
    }

    if (request.method === "GET" && frontendPath === "movements") {
      if (!context.agencyId) {
        return NextResponse.json([], { status: 200 });
      }
      const productResult = await loadProducts();
      if (!productResult.response.ok) {
        return upstreamFailure(productResult.response, productResult.payload);
      }
      const products = new Map(
        productResult.products.map((product) => [String(product.id), product]),
      );
      const movementGroups = await Promise.all(
        productResult.products.map(async (product) => {
          const result = await callKernel(
            config.baseUrl,
            `/api/inventory/movements?${orgQuery}&agencyId=${encodeURIComponent(context.agencyId!)}&productId=${encodeURIComponent(String(product.id))}`,
            headers,
          );
          if (!result.response.ok) return [];
          const movements = unwrap(result.payload);
          return Array.isArray(movements) ? movements : [];
        }),
      );
      return NextResponse.json(
        movementGroups.flat().map((movement) => mapMovement(movement, products)),
      );
    }

    if (request.method === "POST" && frontendPath === "movements") {
      const legacy = isObject(body) ? body : {};
      const items = Array.isArray(legacy.items)
        ? legacy.items.filter(isObject)
        : [];
      const type =
        typeof legacy.type === "string" ? legacy.type.toUpperCase() : "";
      const sourceAgencyId =
        typeof legacy.sourceAgencyId === "string"
          ? legacy.sourceAgencyId
          : context.agencyId;
      const destinationAgencyId =
        typeof legacy.destinationAgencyId === "string"
          ? legacy.destinationAgencyId
          : context.agencyId;
      const reference =
        typeof legacy.reference === "string" && legacy.reference.trim()
          ? legacy.reference.trim()
          : `YS-${Date.now()}`;

      if (!items.length || !["IN", "OUT", "TRANSFER"].includes(type)) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "A valid movement type and at least one item are required.",
            errorCode: "INVALID_MOVEMENT",
          },
          { status: 400 },
        );
      }

      const movements = items.flatMap((item) => {
        const base = {
          organizationId: context.organizationId,
          productId: item.productId,
          thirdPartyId: legacy.thirdPartyId,
          referenceNumber: reference,
          sourceDocumentType: type === "TRANSFER" ? "TRANSFER" : "YOWSPARE",
          sourceDocumentNumber: legacy.notes,
          quantity: item.quantity,
        };
        if (type === "TRANSFER") {
          return [
            {
              ...base,
              agencyId: sourceAgencyId,
              movementType: "OUTBOUND",
            },
            {
              ...base,
              agencyId: destinationAgencyId,
              movementType: "INBOUND",
            },
          ];
        }
        return [
          {
            ...base,
            agencyId: type === "IN" ? destinationAgencyId : sourceAgencyId,
            movementType: type === "IN" ? "INBOUND" : "OUTBOUND",
          },
        ];
      });

      if (movements.some((movement) => !movement.agencyId || !movement.productId)) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: "Movement agency and product are required.",
            errorCode: "INVALID_MOVEMENT_CONTEXT",
          },
          { status: 400 },
        );
      }

      const created = [];
      for (const movement of movements) {
        const result = await callKernel(
          config.baseUrl,
          "/api/inventory/movements",
          headers,
          "POST",
          movement,
        );
        if (!result.response.ok) {
          return upstreamFailure(result.response, result.payload);
        }
        const value = unwrap(result.payload);
        if (isObject(value)) created.push(value);
      }

      const ids = created
        .map((value) => value.id)
        .filter((value): value is string => typeof value === "string");
      const movementId =
        ids.length === 1
          ? ids[0]
          : `batch.${Buffer.from(JSON.stringify(ids)).toString("base64url")}`;
      return NextResponse.json(
        {
          id: movementId,
          organizationId: context.organizationId,
          reference,
          type,
          status: "DRAFT",
          sourceAgencyId,
          destinationAgencyId,
          thirdPartyId: legacy.thirdPartyId,
          notes: legacy.notes,
          items: legacy.items,
        },
        { status: 201 },
      );
    }

    const validationMatch = frontendPath.match(
      /^movements\/([^/]+)\/validate$/,
    );
    if (request.method === "POST" && validationMatch) {
      const encodedId = validationMatch[1];
      let movementIds = [encodedId];
      if (encodedId.startsWith("batch.")) {
        try {
          const decoded = JSON.parse(
            Buffer.from(encodedId.slice(6), "base64url").toString("utf8"),
          );
          if (Array.isArray(decoded) && decoded.every((id) => typeof id === "string")) {
            movementIds = decoded;
          }
        } catch {
          return NextResponse.json(
            {
              success: false,
              data: null,
              message: "Invalid movement batch identifier.",
              errorCode: "INVALID_MOVEMENT_BATCH",
            },
            { status: 400 },
          );
        }
      }

      let lastMovement: unknown = null;
      for (const movementId of movementIds) {
        const result = await callKernel(
          config.baseUrl,
          `/api/inventory/movements/${encodeURIComponent(movementId)}/validate`,
          headers,
          "POST",
        );
        if (!result.response.ok) {
          return upstreamFailure(result.response, result.payload);
        }
        lastMovement = unwrap(result.payload);
      }
      const mapped = mapMovement(lastMovement, new Map());
      return NextResponse.json(
        isObject(mapped)
          ? { ...mapped, id: encodedId, status: "VALIDATED" }
          : mapped,
      );
    }

    const directPath = frontendPath.startsWith("movements/")
      ? `/api/inventory/${frontendPath}`
      : `/api/${frontendPath}`;
    const requestUrl = new URL(request.url);
    const result = await callKernel(
      config.baseUrl,
      `${directPath}${requestUrl.search}`,
      headers,
      request.method,
      body,
    );
    if (!result.response.ok) {
      return upstreamFailure(result.response, result.payload);
    }
    return NextResponse.json(unwrap(result.payload), {
      status: result.response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "KernelCore stock proxy failed.",
        errorCode: "KERNEL_STOCK_PROXY_ERROR",
      },
      { status: 502 },
    );
  }
};
