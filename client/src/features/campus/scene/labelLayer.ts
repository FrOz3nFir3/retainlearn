// The DOM layer the 3D campus's labels render into (Label.tsx), over the canvas. Kept free of three.js and drei, so
// the page that holds it doesn't pull the 3D code in.
import { createRef } from "react";

export const labelLayer = createRef<HTMLDivElement>();
