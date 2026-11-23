// A modal dialog: the browser's own <dialog>, opened with showModal() when it mounts (guide: dialog). The browser
// makes the page behind it inert, keeps focus inside, closes it on Esc or the back gesture, and puts focus back where
// it was. A tap on the backdrop closes it too (closedby="any"), with the guide's fallback where that isn't supported
// yet (Safari). No focus trap or key handler of our own.
// Mount it to open it. However it closes, it calls onClose, and the parent unmounts it. Focus starts on the element
// marked data-autofocus (Cancel, in a confirmation), else the first field, else the dialog itself, never the Close
// button.
import { useId, useLayoutEffect, useRef } from "react";
import type { PointerEvent, ReactNode } from "react";
import { cx } from "#utils/cx.ts";
import { IconButton } from "./IconButton.tsx";

type Props = { title: string; eyebrow?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean };

// The light-dismiss fallback compares the pointer with the dialog's box: the dialog is also the target for its own
// padding, so checking the target alone would close it on those taps. Pressed and released outside, so a text
// selection dragged onto the backdrop doesn't close it.
const lightDismissIsNative = typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype;
const isOutside = (e: PointerEvent<HTMLDialogElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
};

export function Dialog({ title, eyebrow, onClose, children, footer, wide = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pressedOutside = useRef(false);
  const latestOnClose = useRef(onClose);
  useLayoutEffect(() => {
    latestOnClose.current = onClose;
  });

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const closed = () => latestOnClose.current();
    dialog.addEventListener("close", closed);
    dialog.showModal();
    (dialog.querySelector<HTMLElement>("[data-autofocus], input, textarea, select, [contenteditable='true']") ?? dialog).focus();
    return () => {
      dialog.removeEventListener("close", closed);
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
      onPointerUp={lightDismissIsNative ? undefined : (e) => pressedOutside.current && isOutside(e) && e.currentTarget.close()}
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
          <IconButton icon="x" label="Close" size="sm" onClick={() => ref.current?.close()} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-ink/[0.06] px-5 py-3">{footer}</footer>}
      </div>
    </dialog>
  );
}
