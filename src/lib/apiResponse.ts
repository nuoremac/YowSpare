type ApiEnvelope = {
  success: boolean;
  data: unknown;
};

const isApiEnvelope = (value: unknown): value is ApiEnvelope =>
  typeof value === "object" &&
  value !== null &&
  "success" in value &&
  typeof (value as { success?: unknown }).success === "boolean" &&
  "data" in value;

export const unwrapApiResponse = <T>(value: T): T =>
  (isApiEnvelope(value) ? value.data : value) as T;
