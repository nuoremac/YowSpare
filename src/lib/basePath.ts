const normalizeBasePath = (value?: string): string => {
  const raw = (value || "").trim();
  if (!raw || raw === "/") return "";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

const APP_BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_APP_BASE_PATH);

const isAbsoluteUrl = (value: string): boolean => /^([a-z][a-z\d+\-.]*:)?\/\//i.test(value);

export const withAppBasePath = (path: string): string => {
  if (!path) return APP_BASE_PATH || "/";
  if (isAbsoluteUrl(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!APP_BASE_PATH) return normalizedPath;
  if (normalizedPath === APP_BASE_PATH || normalizedPath.startsWith(`${APP_BASE_PATH}/`)) {
    return normalizedPath;
  }
  if (normalizedPath === "/") return APP_BASE_PATH;

  return `${APP_BASE_PATH}${normalizedPath}`;
};
