// What a list or a panel shows when there's nothing in it yet: what it is, why it's empty, and the way on.
import type { ReactNode } from "react";
import { Icon } from "./Icon.tsx";
import type { IconName } from "./Icon.tsx";

type Props = { icon?: IconName; title: string; body?: ReactNode; action?: ReactNode };

export function Empty({ icon = "sparkle", title, body, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/15 bg-surface/60 px-5 py-8 text-center">
      <Icon name={icon} className="mx-auto size-7 text-brand/60" />
      <h3 className="mt-2 font-semibold">{title}</h3>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-ink/60">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
