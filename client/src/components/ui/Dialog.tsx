// A modal dialog: the browser's own <dialog>, opened with showModal() when it mounts (guide: dialog). The browser
// makes the page behind it inert, keeps focus inside, closes it on Esc or the back gesture, and puts focus back where
// it was. A tap on the backdrop closes it too (closedby="any"), with the guide's fallback where that isn't supported
// yet (Safari). No focus trap or key handler of our own.
// Mount it to open it. However it closes, it calls onClose, and the parent unmounts it. Focus starts on the element
// marked data-autofocus (Cancel, in a confirmation), else the first field, else the dialog itself, never the Close
// button. onCloseRequest: asked before Esc, the back gesture, a tap outside or Close closes it; false keeps it open (a
// dialog with work not saved asks first, in its own footer). Its own buttons close it by unmounting it.
import { useId, useLayoutEffect, useRef } from "react";
import type { PointerEvent, ReactNode } from "react";
import { cx } from "#utils/cx.ts";
import { Icon } from "./Icon.tsx";
import { IconButton } from "./IconButton.tsx";

type Props = { title: string; eyebrow?: string; onClose: () => void; onCloseRequest?: () => boolean; children: ReactNode; footer?: ReactNode; wide?: boolean };

// The light-dismiss fallback compares the pointer with the dialog's box: the dialog is also the target for its own
// padding, so checking the target alone would close it on those taps. Pressed and released outside, so a text
// selection dragged onto the backdrop doesn't close it.
const lightDismissIsNative = typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype;
const isOutside = (e: PointerEvent<HTMLDialogElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
};

export function Dialog({ title, eyebrow, onClose, onCloseRequest, children, footer, wide = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pressedOutside = useRef(false);
  const latestOnClose = useRef(onClose);
  const latestRequest = useRef(onCloseRequest);
  useLayoutEffect(() => {
    latestOnClose.current = onClose;
    latestRequest.current = onCloseRequest;
  });
  const mayClose = () => latestRequest.current?.() ?? true;

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const closed = () => latestOnClose.current();
    const cancel = (e: Event) => {
      if (!(latestRequest.current?.() ?? true)) e.preventDefault();
    };
    dialog.addEventListener("close", closed);
    dialog.addEventListener("cancel", cancel);
    dialog.showModal();
    (dialog.querySelector<HTMLElement>("[data-autofocus], input, textarea, select, [contenteditable='true']") ?? dialog).focus();
    return () => {
      dialog.removeEventListener("close", closed);
      dialog.removeEventListener("cancel", cancel);
      if (dialog.open) dialog.close(); // unmounted by the parent: closing first puts focus back where it was
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      tabIndex={-1}
      {...({ closedby: "any" } as Record<string, string>)}
      onPointerDown={lightDismissIsNative ? undefined : (e) => void (pressedOutside.current = isOutside(e))}
      onPointerUp={lightDismissIsNative ? undefined : (e) => pressedOutside.current && isOutside(e) && mayClose() && e.currentTarget.close()}
      className={cx("kit-dialog panel w-[calc(100%-1.5rem)] outline-none", wide ? "max-w-3xl" : "max-w-lg")}
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex items-start gap-3 border-b border-ink/[0.06] px-5 py-4">
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="text-xs text-ink/50">{eyebrow}</p>}
            <h1 id={titleId} className="font-display text-xl font-semibold">
              {title}
            </h1>
          </div>
          <IconButton icon="x" label="Close" size="sm" onClick={() => mayClose() && ref.current?.close()} />
        </header>
        <div className="kit-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
          {/* Shown while there's more below (kit.css): a way on for a pointer; the keys scroll the content itself. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={(e) => {
              const box = e.currentTarget.parentElement;
              box?.scrollBy({ top: box.clientHeight * 0.7, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
            }}
            className="kit-more cursor-pointer items-center gap-1 rounded-full bg-night/85 px-3 text-xs font-semibold text-white shadow-lg ring-1 ring-white/20 hover:bg-night"
          >
            More below <Icon name="arrowDown" className="size-3.5" />
          </button>
        </div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-ink/[0.06] px-5 py-3">{footer}</footer>}
      </div>
    </dialog>
  );
}
