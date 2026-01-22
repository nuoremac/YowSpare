"use client";

import { useContext } from "react";
import { LangContext } from "./LangProvider";

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useT must be used within LangProvider");
  }
  return ctx;
}
