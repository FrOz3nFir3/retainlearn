// A short message that comes and goes (guide: persistent-toast-notifications), for small moments: the clock tower's
// bell, say. Each is a popover="manual" in the top layer under the top bar, read out by screen readers as it shows
// (ariaNotify), with a Close button; it goes by itself after a few seconds, but not while focus is in it. What a toast
// says is always on the page somewhere too, so a missed one loses nothing. toast(text) from anywhere; <Toasts />, once
// in the app's layout, is their region, the same place every time.
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { cx } from "#utils/cx.ts";
import { Icon } from "./Icon.tsx";

export type ToastTone = "night" | "bell";
type Item = { id: number; text: string; tone: ToastTone };

let items: Item[] = [];
let lastId = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
const remove = (id: number) => {
  items = items.filter((t) => t.id !== id);
  notify();
};

// Shows a toast; the same text again replaces the one showing. At most three at once.
export function toast(text: string, tone: ToastTone = "night"): void {
  items = [...items.filter((t) => t.text !== text).slice(-2), { id: ++lastId, text, tone }];
  notify();
}

const TONE: Record<ToastTone, string> = { night: "bg-night text-white", bell: "bg-bell text-night" };
const SHOWN_MS = 4500;

export function Toasts() {
  const list = useSyncExternalStore(subscribe, () => items, () => items);
  return (
    <div role="region" aria-label="Notifications">
      {list.map((item, i) => (
        <ToastItem key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}

function ToastItem({ item, index }: { item: Item; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `toast-${item.id}`;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showPopover();
    (document as Document & { ariaNotify?: (text: string) => void }).ariaNotify?.(item.text);
    let timer = 0;
    const hide = () => {
      if (!el.matches(":focus-within") && el.matches(":popover-open")) el.hidePopover();
    };
    const later = (ms: number) => {
      clearTimeout(timer);
      timer = window.setTimeout(hide, ms);
    };
    const onFocusOut = () => later(1500);
    // Closed (by its timer or its button): gone once its fade-out has played.
    const onToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === "closed") window.setTimeout(() => remove(item.id), 250);
    };
    el.addEventListener("focusout", onFocusOut);
    el.addEventListener("toggle", onToggle);
    later(SHOWN_MS);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("focusout", onFocusOut);
      el.removeEventListener("toggle", onToggle);
      if (el.matches(":popover-open")) el.hidePopover();
    };
  }, [item]);
  return (
    <div ref={ref} id={id} popover="manual" className={cx("kit-toast", TONE[item.tone])} style={{ "--toast-index": index } as CSSProperties}>
      <p className="min-w-0 flex-1 text-pretty">{item.text}</p>
      <button
        type="button"
        popoverTarget={id}
        popoverTargetAction="hide"
        aria-label="Close"
        className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
      >
        <Icon name="x" className="size-3.5" />
      </button>
    </div>
  );
}
