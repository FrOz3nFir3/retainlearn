// Your colour scheme (guide: dark-mode-toggle): the device's ("system", the default), or light or dark, picked in the
// account menu. The pick is kept in this browser and is the <meta name="color-scheme">'s content, which the CSS
// follows (styles/kit.css); the script beside that meta in index.html applies it before the page paints. Going back to
// the device's forgets the pick, so a device that changes scheme by the time of day is followed again. A pick made in
// another tab follows here too. If the browser won't keep it (site data blocked), it still applies to this page.
import { useSyncExternalStore } from "react";

export type SchemeChoice = "system" | "light" | "dark";

const KEY = "color-scheme";
const stored = (): SchemeChoice => {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
};
const apply = (choice: SchemeChoice) => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) meta.content = choice === "system" ? "light dark" : choice;
};

let current: SchemeChoice = typeof window === "undefined" ? "system" : stored();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const darkQuery = typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");

export function setColorScheme(choice: SchemeChoice): void {
  try {
    if (choice === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    // Not kept, but still applied below.
  }
  current = choice;
  apply(choice);
  notify();
}

const onStorage = (event: StorageEvent) => {
  if (event.key !== KEY && event.key !== null) return;
  current = stored();
  apply(current);
  notify();
};

function subscribe(listener: () => void): () => void {
  if (!listeners.size) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  darkQuery?.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    darkQuery?.removeEventListener("change", listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}

// The pick, and whether the device is dark now (for "System (now dark)").
export function useColorScheme(): { choice: SchemeChoice; deviceDark: boolean } {
  const choice = useSyncExternalStore(subscribe, () => current, (): SchemeChoice => "system");
  const deviceDark = useSyncExternalStore(subscribe, () => darkQuery?.matches ?? false, () => false);
  return { choice, deviceDark };
}
