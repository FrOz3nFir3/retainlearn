// A label in the 3D campus (drei's Html), drawn into the labels' DOM layer (labelLayer.ts) rather than into the canvas,
// so it's text, sharp at any size. A stable target from the first render stops drei re-mounting every label once the
// canvas connects its events.
import { Html } from "@react-three/drei";
import type { ComponentProps } from "react";
import { labelLayer } from "./labelLayer.ts";

export function Label({ children, ...props }: ComponentProps<typeof Html>) {
  return (
    <Html portal={labelLayer as React.RefObject<HTMLElement>} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }} {...props}>
      {children}
    </Html>
  );
}
