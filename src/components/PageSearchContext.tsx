"use client";

import { createContext, useContext } from "react";

type PageSearchContextValue = {
  query: string;
  setQuery: (next: string) => void;
};

const PageSearchContext = createContext<PageSearchContextValue | null>(null);

export function PageSearchProvider({
  value,
  children,
}: {
  value: PageSearchContextValue;
  children: React.ReactNode;
}) {
  return (
    <PageSearchContext.Provider value={value}>
      {children}
    </PageSearchContext.Provider>
  );
}

export function usePageSearch() {
  const ctx = useContext(PageSearchContext);
  if (!ctx) {
    throw new Error("usePageSearch must be used within PageSearchProvider");
  }
  return ctx;
}
