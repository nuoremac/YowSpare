export type Theme = "light" | "dark";

export const THEME_CHANGE_EVENT = "yowspare:theme-change";
const THEME_STORAGE_KEY = "yowspare:theme";

const isBrowser = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

const applyThemeToDom = (theme: Theme): void => {
  if (!isBrowser()) return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
};

const dispatchThemeChange = (theme: Theme): void => {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } }));
};

const resolveSystemTheme = (): Theme => {
  if (!isBrowser()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const readThemeFromDom = (): Theme => {
  if (!isBrowser()) return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export const initTheme = (): Theme => {
  if (!isBrowser()) return "light";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  const theme: Theme = stored === "dark" || stored === "light" ? stored : resolveSystemTheme();
  applyThemeToDom(theme);
  return theme;
};

export const setTheme = (theme: Theme): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyThemeToDom(theme);
  dispatchThemeChange(theme);
};
