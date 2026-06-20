"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isApiError = error.name === "ApiError";
  const is500 = isApiError && error.message === "Internal Server Error";

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900/40 dark:bg-rose-950/30">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          {is500 ? "Service temporarily unavailable" : "Something went wrong"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {is500
            ? "The server returned an error. Please check the backend is running and try again."
            : error.message || "An unexpected error occurred."}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="ys-btn-secondary text-sm"
      >
        Try again
      </button>
    </main>
  );
}
