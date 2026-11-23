// A panel you keep working beside: a side panel on wide screens, a bottom sheet on phones. A non-modal dialog in the
// top layer (popover="manual"), so nothing on the page covers it and the page stays usable (guide: dialog, rule 2).
// Mount it to show it. Its Close button (SheetHeader), and Esc while focus is inside it, call onClose.
import { useLayoutEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { IconButton } from "./IconButton.tsx";

type Props = { label: string; onClose: () => void; wide?: boolean; children: ReactNode };

export function Sheet({ label, onClose, wide = false, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const sheet = ref.current;
    if (!sheet) return;
    sheet.showPopover();
    return () => {
      if (sheet.matches(":popover-open")) sheet.hidePopover();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      popover="manual"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        onClose();
      }}
      className="kit-sheet panel overflow-hidden"
      style={wide ? ({ "--kit-sheet-width": "440px" } as CSSProperties) : undefined}
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink/15 md:hidden" aria-hidden="true" />
      {children}
    </dialog>
  );
}

// A sheet's title, with an optional colour mark (a subject's), actions, and Close.
type HeaderProps = { title: string; subtitle?: string; accent?: string; onClose?: () => void; actions?: ReactNode };

export function SheetHeader({ title, subtitle, accent, onClose, actions }: HeaderProps) {
  return (
    <div className="flex items-start gap-3 border-b border-ink/[0.06] p-4">
      {accent && <span className="mt-1 h-9 w-2.5 shrink-0 rounded-full" style={{ background: accent }} aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 font-display text-[21px] leading-tight font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 line-clamp-2 text-xs text-ink/50">{subtitle}</p>}
      </div>
      {actions}
      {onClose && <IconButton icon="x" label="Close" size="sm" onClick={onClose} />}
    </div>
  );
}
