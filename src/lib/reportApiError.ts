type ApiErrorDetails = {
  status?: unknown;
  statusText?: unknown;
  url?: unknown;
  message?: unknown;
  body?: unknown;
};

export function reportHandledApiError(context: string, error: unknown) {
  const details = (error && typeof error === "object" ? error : {}) as ApiErrorDetails;

  console.warn(context, {
    status: details.status,
    statusText: details.statusText,
    url: details.url,
    message: typeof details.message === "string" ? details.message : String(error),
    body: details.body,
  });
}
