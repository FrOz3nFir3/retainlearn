// A popup menu (guide: menu): a button that opens a list of links and commands in the top layer (popover="auto"),
// placed under the button by CSS anchor positioning and flipped where it would overflow (styles/kit.css).
// - The browser opens and closes it (the button's command="toggle-popover"), closes it on Esc or a tap outside, and
//   puts focus back on the button.
// - Arrow keys move between items: the browser's own focusgroup where it has one (Chrome 150 on), else a small
//   fallback with the roles focusgroup would have inferred. Home and End go to the first and last item.
// - Opened by keyboard, focus moves to the first item; opened by pointer, it stays on the button. Choosing an item
//   closes it. Tab leaves it: focus moves on past the menu first, then the menu closes as focus has left it, so focus
//   never lands in a menu that's fading out. Shift+Tab goes back to the button. The items are one tab stop (the
//   focusgroup's, or tabindex -1 in the fallback), so Tab doesn't step through them.
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Icon.tsx";
import type { IconName } from "./Icon.tsx";

const nativeFocusgroup = typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype;
const itemRole = nativeFocusgroup ? undefined : "menuitem";
const itemTabIndex = nativeFocusgroup ? undefined : -1;
const Close = createContext<() => void>(() => {});

type Props = { label: string; trigger: ReactNode; triggerClassName?: string; children: ReactNode };

export function Menu({ label, trigger, triggerClassName, children }: Props) {
  const triggerId = useId();
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const enter = useRef(false); // opened by keyboard: focus goes to the first item
  const [open, setOpen] = useState(false);
  const items = () => [...(menu.current?.querySelectorAll<HTMLElement>("[data-menu-item]") ?? [])];
  const close = () => {
    if (menu.current?.matches(":popover-open")) menu.current.hidePopover();
  };

  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    const toggled = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      setOpen(isOpen);
      if (isOpen && enter.current) items()[0]?.focus();
      enter.current = false;
    };
    el.addEventListener("toggle", toggled);
    return () => el.removeEventListener("toggle", toggled);
  }, []);

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    if (open) items()[0]?.focus();
    else button.current?.click(); // the one way it opens; a click from script counts as the keyboard (detail 0)
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      // Shift+Tab: back to the button, where closing puts focus. Tab: the browser moves focus on past the menu, then
      // it closes: onBlur closes it when focus lands on the page, and this when focus leaves the page altogether (the
      // menu was the last thing to tab to).
      if (e.shiftKey) {
        e.preventDefault();
        close();
      } else {
        setTimeout(() => {
          if (!menu.current?.contains(document.activeElement)) close();
        });
      }
      return;
    }
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const arrows = !nativeFocusgroup && (e.key === "ArrowDown" || e.key === "ArrowUp");
    if (at < 0 || !(arrows || e.key === "Home" || e.key === "End")) return;
    const next = e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : (at + (e.key === "ArrowUp" ? -1 : 1) + list.length) % list.length;
    e.preventDefault();
    list[next]?.focus();
  };

  return (
    <>
      <button
        ref={button}
        id={triggerId}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        {...({ commandfor: menuId, command: "toggle-popover" } as Record<string, string>)}
        onClick={(e) => void (enter.current = e.detail === 0)}
        onKeyDown={onButtonKey}
        className={triggerClassName}
      >
        {trigger}
      </button>
      <div
        ref={menu}
        id={menuId}
        popover="auto"
        className="kit-menu"
        onKeyDown={onMenuKey}
        onBlur={(e) => {
          const to = e.relatedTarget as Node | null;
          if (to && !menu.current?.contains(to) && to !== button.current) close();
        }}
      >
        <div {...({ focusgroup: "menu nomemory" } as Record<string, string>)} role={nativeFocusgroup ? undefined : "menu"} aria-labelledby={triggerId} className="flex flex-col">
          <Close value={close}>{children}</Close>
        </div>
      </div>
    </>
  );
}

const ITEM =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm outline-none pointer-coarse:py-3 focus:bg-ink/6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand";
// The item under the pointer takes focus, so hovering and the keyboard move the same highlight: only while the menu is
// open, not while it fades out (focus would be lost with it).
const focusOnHover = (e: PointerEvent<HTMLElement>) => {
  if (document.activeElement !== e.currentTarget && e.currentTarget.closest(":popover-open")) e.currentTarget.focus({ preventScroll: true });
};

export function MenuLink({ to, icon, children }: { to: string; icon: IconName; children: ReactNode }) {
  const close = useContext(Close);
  return (
    <Link to={to} data-menu-item role={itemRole} tabIndex={itemTabIndex} onClick={close} onPointerMove={focusOnHover} className={ITEM}>
      <Icon name={icon} className="size-4 shrink-0 text-ink/55" />
      {children}
    </Link>
  );
}

export function MenuButton({ icon, onSelect, children }: { icon: IconName; onSelect: () => void; children: ReactNode }) {
  const close = useContext(Close);
  return (
    <button
      type="button"
      data-menu-item
      role={itemRole}
      tabIndex={itemTabIndex}
      onPointerMove={focusOnHover}
      onClick={() => {
        close();
        onSelect();
      }}
      className={ITEM}
    >
      <Icon name={icon} className="size-4 shrink-0 text-ink/55" />
      {children}
    </button>
  );
}

// One of a set (guide: menu): its check mark is drawn by CSS from aria-checked (styles/kit.css).
export function MenuRadio({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: ReactNode }) {
  const close = useContext(Close);
  return (
    <button
      type="button"
      data-menu-item
      role="menuitemradio"
      tabIndex={itemTabIndex}
      aria-checked={checked}
      onPointerMove={focusOnHover}
      onClick={() => {
        onSelect();
        close();
      }}
      className={ITEM}
    >
      {children}
    </button>
  );
}

// A set of radio items, named by its visible label.
export function MenuGroup({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="px-3 pt-2 pb-1 text-[11px] font-semibold text-ink/50">
        {label}
      </p>
      {children}
    </div>
  );
}

export const MenuSeparator = () => <hr className="my-1.5 border-ink/8" />;
