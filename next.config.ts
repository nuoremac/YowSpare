import withPWA from "@ducanh2912/next-pwa";

const normalizeBasePath = (value?: string) => {
  const raw = (value || "").trim();
  if (!raw || raw === "/") return "";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.replace(/\/+$/, "");
};

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

const appBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_APP_BASE_PATH);
const integrationMode = process.env.NEXT_PUBLIC_INTEGRATION_MODE === "true";
const nextConfig = {
  reactStrictMode: true,
  ...(appBasePath ? { basePath: appBasePath } : {}),
  async rewrites() {
    const kernelDest = normalizeUrl(
      process.env.KERNEL_CORE_DEST ||
        process.env.KERNEL_CORE_API_DEST ||
        process.env.SPARE_API_DEST ||
        "https://yowspare-backend.onrender.com",
    );
    const coreDest = normalizeUrl(process.env.CORE_API_DEST || kernelDest);
    const corePathPrefix = normalizeBasePath(process.env.CORE_API_PATH_PREFIX || "/api");
    const billingDest = normalizeUrl(process.env.BILLING_API_DEST || kernelDest);
    const accountingDest = normalizeUrl(process.env.ACCOUNTING_API_DEST || kernelDest);
    return [
      {
        source: "/api/core/actuator/:path*",
        destination: `${coreDest}/actuator/:path*`,
      },
      {
        source: "/api/core/:path*",
        destination: `${coreDest}${corePathPrefix}/:path*`,
      },
      {
        source: "/api/billing/:path*",
        destination: `${billingDest}/:path*`,
      },
      {
        source: "/api/accounting/:path*",
        destination: `${accountingDest}/:path*`,
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development" || integrationMode,

  // keep default caching + add yours
  extendDefaultRuntimeCaching: true,

  //  put runtimeCaching here
  workboxOptions: {
    runtimeCaching: [
      {
        // Cache Next.js pages + assets (good default)
        urlPattern: ({ request }) =>
          request.destination === "document" ||
          request.destination === "script" ||
          request.destination === "style",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-assets",
          expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        // Cache images
        urlPattern: ({ request }) => request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        // Cache API calls (if you have any)
        urlPattern: /\/api\/.*$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api",
          expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 },
        },
      },
    ],
  },
})(nextConfig);
