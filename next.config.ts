import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",

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
