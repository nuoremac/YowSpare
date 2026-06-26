import { getDefaultHeaders } from "@/lib/api";
import { withAppBasePath } from "@/lib/basePath";

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

type UserWithProfilePhoto = {
  onboardingPayload?: unknown;
  profilePhotoFileId?: string;
};

export const imageFileUrl = (fileId?: string | null) =>
  fileId ? `/api/tiers/files/${encodeURIComponent(fileId)}` : "";

const blobUrlCache = new Map<string, string>();

export const isImageFile = (file: File | null | undefined) =>
  !!file && file.type.toLowerCase().startsWith("image/");

export const parseJsonObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

export const userProfilePhotoFileId = (user: UserWithProfilePhoto | null | undefined) => {
  if (user?.profilePhotoFileId) return user.profilePhotoFileId;
  const payload = parseJsonObject(user?.onboardingPayload);
  return typeof payload.profilePhotoFileId === "string" ? payload.profilePhotoFileId : "";
};

export const extractFileIdFromUrl = (value?: string | null) => {
  const match = (value || "").match(/\/files\/([^/?#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
};

export const getFileBlobUrl = async (fileId: string) => {
  const cleanId = fileId.trim();
  if (!cleanId) return "";
  const headers = getDefaultHeaders();
  const cacheKey = `${cleanId}::${headers.Authorization || ""}::${headers["X-Tenant-Id"] || ""}::${headers["X-Organization-Id"] || ""}`;
  const cached = blobUrlCache.get(cacheKey);
  if (cached) return cached;

  const response = await fetch(withAppBasePath(imageFileUrl(cleanId)), {
    method: "GET",
    headers,
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch file ${cleanId}`);
  }
  const objectUrl = URL.createObjectURL(await response.blob());
  blobUrlCache.set(cacheKey, objectUrl);
  return objectUrl;
};
