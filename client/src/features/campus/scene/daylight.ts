// The campus sky through the day, by the time where you are (the prototype's scene/daylight.js): keyframes by hour,
// blended so the light changes gradually.
// bg: the sky, which is also the fog the far ground fades into. hemi: sky light, ground light, strength. sun: colour,
// strength, height and direction in degrees (it rises on the right of the default view and sets on the left; after
// dark it's the moon, from the front left). selfLit: how much kit walls light themselves (keeps shaded walls white by
// day). lights: windows and street lamps on, 0 to 1.
import * as THREE from "three";

export type SkyState = { bg: THREE.Color; hemi: [THREE.Color, THREE.Color, number]; sun: [THREE.Color, number, number, number]; selfLit: number; lights: number };
type Key = { h: number; bg: string; hemi: [string, string, number]; sun: [string, number, number, number]; selfLit: number; lights: number };

const NIGHT: Omit<Key, "h"> = { bg: "#1D1F48", hemi: ["#6971B8", "#2B2D5C", 0.95], sun: ["#A8B6FF", 0.7, 55, 160], selfLit: 0.12, lights: 1 };
const KEYS: (SkyState & { h: number })[] = (
  [
    { h: 0, ...NIGHT },
    { h: 4.5, ...NIGHT },
    { h: 5.5, bg: "#3C3B78", hemi: ["#8A86C9", "#3A3A72", 1.1], sun: ["#C8A8E8", 0.7, 5, -80], selfLit: 0.25, lights: 1 },
    { h: 6.5, bg: "#F2D3D2", hemi: ["#FFDCCB", "#C4BDE4", 1.5], sun: ["#FFAE76", 1.7, 12, -60], selfLit: 0.7, lights: 0.35 },
    { h: 8.5, bg: "#E4E9F8", hemi: ["#FFFFFF", "#C3C8E8", 1.8], sun: ["#FFF4E4", 2.2, 38, -15], selfLit: 1, lights: 0 },
    { h: 13, bg: "#E6E9F6", hemi: ["#FFFFFF", "#C3C8E8", 1.9], sun: ["#FFFFFF", 2.3, 59, 36], selfLit: 1, lights: 0 }, // the campus's usual look
    { h: 16.5, bg: "#E9E6F4", hemi: ["#FFF9F2", "#C6C3E6", 1.85], sun: ["#FFEFD8", 2.2, 33, 85], selfLit: 1, lights: 0 },
    { h: 18.4, bg: "#F4CFC4", hemi: ["#FFD6BF", "#B8ACD9", 1.45], sun: ["#FF985C", 1.8, 10, 115], selfLit: 0.55, lights: 0.45 },
    { h: 19.6, bg: "#4C4A8A", hemi: ["#8F90D8", "#3B3A72", 1.05], sun: ["#A9B6FF", 0.65, 35, 165], selfLit: 0.18, lights: 1 },
    { h: 21.5, ...NIGHT },
    { h: 24, ...NIGHT },
  ] satisfies Key[]
).map((k) => ({
  h: k.h,
  bg: new THREE.Color(k.bg),
  hemi: [new THREE.Color(k.hemi[0]), new THREE.Color(k.hemi[1]), k.hemi[2]],
  sun: [new THREE.Color(k.sun[0]), k.sun[1], k.sun[2], k.sun[3]],
  selfLit: k.selfLit,
  lights: k.lights,
}));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const blankSky = (): SkyState => ({ bg: new THREE.Color(), hemi: [new THREE.Color(), new THREE.Color(), 0], sun: [new THREE.Color(), 0, 0, 0], selfLit: 1, lights: 0 });

// a and b blended (t 0 to 1) into out.
export function mixSky(a: SkyState, b: SkyState, t: number, out: SkyState = blankSky()): SkyState {
  out.bg.copy(a.bg).lerp(b.bg, t);
  out.hemi[0].copy(a.hemi[0]).lerp(b.hemi[0], t);
  out.hemi[1].copy(a.hemi[1]).lerp(b.hemi[1], t);
  out.hemi[2] = lerp(a.hemi[2], b.hemi[2], t);
  out.sun[0].copy(a.sun[0]).lerp(b.sun[0], t);
  out.sun[1] = lerp(a.sun[1], b.sun[1], t);
  out.sun[2] = lerp(a.sun[2], b.sun[2], t);
  out.sun[3] = lerp(a.sun[3], b.sun[3], t);
  out.selfLit = lerp(a.selfLit, b.selfLit, t);
  out.lights = lerp(a.lights, b.lights, t);
  return out;
}

// The sky at an hour (0 to 24), blended between the keyframes either side.
export function skyAt(hour: number, out: SkyState = blankSky()): SkyState {
  const h = ((hour % 24) + 24) % 24;
  const i = KEYS.findIndex((k) => k.h > h);
  const a = KEYS[i - 1] ?? KEYS[0]!;
  const b = KEYS[i] ?? KEYS[KEYS.length - 1]!;
  return mixSky(a, b, b.h === a.h ? 0 : (h - a.h) / (b.h - a.h), out);
}

// Where the sun (or the moon) shines from, `distance` away.
export const sunPosition = (sky: SkyState, distance: number, out = new THREE.Vector3()): THREE.Vector3 => {
  const el = THREE.MathUtils.degToRad(sky.sun[2]);
  const az = THREE.MathUtils.degToRad(sky.sun[3]);
  return out.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)).multiplyScalar(distance);
};

// How the time of day lights the campus's things, for the materials that care (the kit's walls and windows, the street
// lamps): Sky.tsx sets it as the light changes, and each listener is told at once and on every change.
type SkyLightListener = (selfLit: number, lights: number) => void;
const listeners = new Set<SkyLightListener>();
let current = { selfLit: 1, lights: 0 };
export function onSkyLight(listener: SkyLightListener): () => void {
  listeners.add(listener);
  listener(current.selfLit, current.lights);
  return () => void listeners.delete(listener);
}
export function setSkyLight(selfLit: number, lights: number): void {
  current = { selfLit, lights };
  for (const listener of listeners) listener(selfLit, lights);
}
