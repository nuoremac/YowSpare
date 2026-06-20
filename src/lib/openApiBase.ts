const normalizeBasePath = (value?: string): string => {
  const raw = (value || "").trim();
  if (!raw || raw === "/") return "";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

const isAbsoluteUrl = (value: string): boolean => /^([a-z][a-z\d+\-.]*:)?\/\//i.test(value);

export const resolveOpenApiBase = (envValue: string | undefined, fallback: string): string => {
  const rawBase = (envValue || fallback).trim();
  const base = rawBase.replace(/\/+$/, "");

  if (isAbsoluteUrl(base)) return base;

  const normalizedBase = normalizeBasePath(base);
  const appBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_APP_BASE_PATH);

  if (!appBasePath) return normalizedBase;
  if (!normalizedBase) return appBasePath;
  if (normalizedBase === appBasePath || normalizedBase.startsWith(`${appBasePath}/`)) {
    return normalizedBase;
  }

  return `${appBasePath}${normalizedBase}`;
};
