// A label in the 3D campus (drei's Html), drawn into the labels' DOM layer (labelLayer.ts) rather than into the canvas,
// so it's text, sharp at any size. A stable target from the first render stops drei re-mounting every label once the
// canvas connects its events. drei renders a label in a React root of its own: no router or other context in here.
import { Html } from "@react-three/drei";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { cx } from "#utils/cx.ts";
import { labelLayer } from "./labelLayer.ts";

export function Label({ children, ...props }: ComponentProps<typeof Html>) {
  return (
    <Html portal={labelLayer as React.RefObject<HTMLElement>} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }} {...props}>
      {children}
    </Html>
  );
}

// A place's label as a link to it: its way in for the keyboard and screen readers (Tab reaches every place; focus brings
// it into view, onFocus). A pointer goes through the label to the place itself, which takes the tap. go: the app's
// navigation (no router in here); a modified click or Enter still opens a new tab, from href.
// rank: for the declutter (null: never faded, as inside a building); chip: the scene's chip look (else className's own).
type PlaceLinkProps = { href: string; label?: string; go: () => void; onFocus?: () => void; rank?: number | null; chip?: boolean; className?: string; children: ReactNode };
export function PlaceLink({ href, label, go, onFocus, rank = 1, chip = true, className, children }: PlaceLinkProps) {
  const follow = (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go();
  };
  return (
    <a href={href} aria-label={label} onClick={follow} onFocus={onFocus} data-rank={rank ?? undefined} className={cx(chip && "scene-chip", className)}>
      {children}
    </a>
  );
}
