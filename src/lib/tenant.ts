export function getTenantSlugFromHost(host?: string | null) {
  // Supports: oilco.yowspare.com or localhost:3000?tenant=oilco
  if (!host) return "demo";
  const clean = host.split(":")[0];
  const parts = clean.split(".");
  if (parts.length >= 3) return parts[0]; // subdomain
  return "demo";
}
