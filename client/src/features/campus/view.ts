// How the campus shows: in 3D, or as the 2D page. Your pick once you've made one (the switch on the campus, kept on
// your account as view3d), and until then what the device suits: 3D where a graphics card draws WebGL 2 (three.js needs
// it) and you haven't asked for reduced motion. WebGL drawn in software only (no usable graphics card: a few frames a
// second) starts in 2D, though the switch still offers 3D; without WebGL at all, 2D whatever the pick. This browser
// keeps a copy of the answer, so the campus's skeleton, shown before the campus's data arrives, is the right one. No
// three.js here: the skeleton loads with the app.
const KEY = "retainlearn:campus-3d";

// Whether WebGL 2 runs here, and whether without a major performance caveat (the browser's word for drawing it in
// software), checked once: each a context made and let go at once (a page gets only a few at a time).
let webgl: { works: boolean; fast: boolean } | undefined;
function probe(): { works: boolean; fast: boolean } {
  if (webgl) return webgl;
  const draws = (attributes?: WebGLContextAttributes) => {
    try {
      const gl = document.createElement("canvas").getContext("webgl2", attributes);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      return !!gl;
    } catch {
      return false;
    }
  };
  const fast = draws({ failIfMajorPerformanceCaveat: true });
  webgl = { works: fast || draws(), fast };
  return webgl;
}
export const webglWorks = (): boolean => probe().works;

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// The campus in 3D? view3d: the account's pick (null: none yet).
export const shows3d = (view3d: boolean | null | undefined): boolean => probe().works && (view3d ?? (probe().fast && !reducedMotion()));

// The copy kept in this browser: the last answer, or null before the campus has shown here.
export function lastView(): boolean | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === null ? null : value === "3d";
  } catch {
    return null;
  }
}

export function keepView(in3d: boolean): void {
  try {
    if (lastView() !== in3d) localStorage.setItem(KEY, in3d ? "3d" : "2d");
  } catch {
    // Not kept: the skeleton guesses from the device instead.
  }
}

// The skeleton's guess, before the campus's data arrives.
export const guessView = (): boolean => webglWorks() && (lastView() ?? shows3d(null));

// A press of one of the 3D campus's map buttons, for the world's camera (scene/World.tsx): n tells two presses of the
// same button apart.
export type MapCommand = { kind: "home" | "zoom" | "rotate"; value: number; n: number };
