"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { translations, type Lang } from "./translation";

type TFunc = (key: keyof typeof translations.en, vars?: Record<string, string | number>) => string;

export type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunc;
};

export const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "yowspare-lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "fr") {
      setLangState(stored);
      return;
    }
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("fr")) {
      setLangState("fr");
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback<TFunc>(
    (key, vars) => {
      const dict = translations[lang] ?? translations.en;
      let value: string = dict[key] ?? translations.en[key] ?? String(key);
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replaceAll(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
