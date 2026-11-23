// Asks before an action. Cancel starts with focus, so a quick Enter can't do what you didn't mean (guide: dialog).
import type { ReactNode } from "react";
import { Button } from "./Button.tsx";
import { Dialog } from "./Dialog.tsx";

type Props = { title: string; body: ReactNode; confirmLabel: string; tone?: "primary" | "danger"; onConfirm: () => void; onClose: () => void };

export function Confirm({ title, body, confirmLabel, tone = "primary", onConfirm, onClose }: Props) {
  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button data-autofocus onClick={onClose}>
            Cancel
          </Button>
          <Button
            tone={tone}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-ink/70">{body}</div>
    </Dialog>
  );
}
