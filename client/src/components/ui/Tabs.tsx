// Tabs over panels (guide: tabs). The tabs are buttons in a tablist, the selected one marked (aria-selected) by an
// underline as well as its colour. One tab stop: arrow keys, Home and End move between the tabs (the browser's
// focusgroup where it has one, else the same keys here), and Enter, Space or a click picks one. Picking isn't on focus:
// a tab here changes the address (selection by activation). Tabs that don't fit stay on one row, which scrolls
// sideways with its edges faded (.kit-tabs, styles/kit.css), and the picked tab is scrolled into view.
// TabPanel holds the picked tab's content, named by its tab; only the picked panel is rendered, since each loads its
// own data.
import { useId, useLayoutEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "#utils/cx.ts";

const nativeFocusgroup = typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype;

export type TabItem<T extends string> = { value: T; label: string; count?: number };

type Props<T extends string> = { label: string; tabs: readonly TabItem<T>[]; value: T; onChange: (value: T) => void; idBase: string };

export const tabId = (idBase: string, value: string) => `${idBase}-tab-${value}`;

// The row's and each tab's look, shared with skeletons. The picked tab: the brand colour and a 3px underline (a border,
// so it shows in forced colours too), the same size as the others.
export const TABLIST_CLASS = "kit-tabs flex border-b border-ink/10";
export const tabClass = (selected: boolean): string =>
  cx(
    "relative flex flex-none items-center gap-1.5 px-3 py-2.5 text-sm font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
    selected ? "text-brand after:absolute after:inset-x-2 after:bottom-0 after:border-b-[3px] after:border-brand after:content-['']" : "text-ink/55 hover:text-ink",
  );
export const countClass = (selected: boolean): string => cx("rounded-full px-1.5 text-xs tabular-nums", selected ? "bg-brand/10" : "bg-ink/[0.06]");

export function Tabs<T extends string>({ label, tabs, value, onChange, idBase }: Props<T>) {
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", container: "nearest" } as ScrollIntoViewOptions);
  }, [value]);

  // Without the browser's focusgroup: arrow keys, Home and End move focus between the tabs (not the pick).
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : step ? (at + step + buttons.length) % buttons.length : -1;
    if (at < 0 || to < 0) return;
    e.preventDefault();
    buttons[to]?.focus();
  };

  return (
    <div
      ref={list}
      role={nativeFocusgroup ? undefined : "tablist"}
      aria-label={label}
      {...({ focusgroup: "tablist nomemory" } as Record<string, string>)}
      onKeyDown={nativeFocusgroup ? undefined : onKey}
      className={TABLIST_CLASS}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            id={tabId(idBase, tab.value)}
            type="button"
            role={nativeFocusgroup ? undefined : "tab"}
            aria-selected={selected}
            tabIndex={nativeFocusgroup ? undefined : selected ? 0 : -1}
            {...(selected ? { focusgroupstart: "" } : {})}
            onClick={() => onChange(tab.value)}
            className={tabClass(selected)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={countClass(selected)}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idBase, value, children }: { idBase: string; value: string; children: ReactNode }) {
  return (
    <div role="tabpanel" aria-labelledby={tabId(idBase, value)}>
      {children}
    </div>
  );
}

// A stable id base for one set of tabs and its panel.
export const useTabsId = (): string => useId().replace(/:/g, "");
