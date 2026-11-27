// Your subjects as buildings on plots in rings around the quad (the prototype's data/campus.js, the kit look only).
// A subject keeps its plot (the campus's `plot`, kept on your player): taking one off leaves a free plot, and the next
// subject you add fills it. The campus grows a ring at a time as you add subjects, and the lot and the road round it
// grow with it. Plain TypeScript, tested in layout.test.ts.
import type { CampusSubject } from "@retainlearn/core";
import { pennantOf } from "../subjects.ts";

type XZ = readonly [number, number];
const polar = (deg: number, r: number): XZ => [Math.round(Math.cos((deg * Math.PI) / 180) * r * 10) / 10, Math.round(Math.sin((deg * Math.PI) / 180) * r * 10) / 10];
const spread = (w: number, r: number) => (Math.atan(w / r) * 180) / Math.PI; // the degrees a half-width covers at radius r

const BASE_HALF = 42; // half the lot's width while it has only the first two rings
// The first two rings are placed by hand (bigger plots inside). Rings further out are 13 m apart, so they can't overlap
// the ring inside (buildings are at most 9 m deep); each spaces only its own plots, so neighbours don't touch. A new
// ring fills from the front of the default view outwards, half a step off the ring inside, so new buildings show up
// rather than hide behind old ones.
const FRONT = 45; // the default camera looks at the campus from this side
type Ring = { r: number; maxW: number; half: number; angles: number[] };
const rings: Ring[] = [
  { r: 26, maxW: 16, half: BASE_HALF, angles: [-140, -45, 15, 163, 75, 124] },
  { r: 37, maxW: 11, half: BASE_HALF, angles: [-15, 45, 105, -170] },
];
function growTo(count: number) {
  while (rings.reduce((n, ring) => n + ring.angles.length, 0) < count) {
    const r = 37 + 13 * (rings.length - 1);
    const maxW = 12;
    const n = Math.floor(360 / (2 * spread(maxW / 2 + 2, r)));
    const step = 360 / n;
    const start = FRONT + (rings.length % 2 ? 0 : step / 2);
    const angles = Array.from({ length: n }, (_, i) => start + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * step).map((a) => ((((a + 180) % 360) + 360) % 360) - 180);
    const reach = Math.max(...angles.map((a) => Math.max(...polar(a, r).map(Math.abs))));
    rings.push({ r, maxW, angles, half: Math.ceil(reach + 7.5) });
  }
}

// Plot i, counting outwards ring by ring.
function slot(i: number): { pos: XZ; maxW: number; ring: number } {
  growTo(i + 1);
  let n = i;
  for (const [k, ring] of rings.entries()) {
    const angle = ring.angles[n];
    if (angle !== undefined) return { pos: polar(angle, ring.r), maxW: ring.maxW, ring: k };
    n -= ring.angles.length;
  }
  throw new Error(`No plot ${i}`);
}

// What a building holds, floor by floor: one rule for how it looks from outside and inside, so the two match. The
// ground floor is the lobby; above it the classrooms, 3 to a floor, for one page of study sets (9), counting the
// "+ New study set" room while the page has room for it. A subject with fewer sets stands shorter.
export const ROOMS_PER_FLOOR = 3;
export const PAGE_SIZE = 9;
export const classFloors = (rooms: number): number => Math.max(1, Math.ceil(rooms / ROOMS_PER_FLOOR));
export const storeys = (rooms: number): number => 1 + classFloors(rooms);

// The kit's modular cells (scene/kit.tsx) are one storey high, so a building is a whole number of cells: 3 wide where
// the plot allows it and the subject is big enough, else 2, and always 2 deep.
export const CELL = 5.12;
function kitSize(count: number, maxW: number) {
  const floors = storeys(Math.min(PAGE_SIZE, count + 1));
  const wide = count >= 4 && Math.min(count >= 10 ? 16 : 14, maxW) >= 14;
  const cols = wide ? 3 : 2;
  return { size: [cols * CELL, 2 * CELL] as const, floors, cells: [cols, 2] as const };
}

export type CampusBuilding = {
  id: string;
  name: string;
  pos: XZ;
  ring: number;
  size: readonly [number, number];
  floors: number;
  cells: readonly [number, number];
  roof: "gable" | "flat";
  pennant: string;
  subject: CampusSubject;
};
export type CampusLayout = { buildings: CampusBuilding[]; freePlot: { pos: XZ; ring: number; size: readonly [number, number] } | null; half: number };

// A subject's id in the scene: its name, safe for keys and lookups.
export const slug = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function layoutCampus(subjects: readonly CampusSubject[]): CampusLayout {
  const buildings = subjects.map((subject): CampusBuilding => {
    const plot = slot(subject.plot);
    return {
      id: slug(subject.category),
      name: subject.category,
      pos: plot.pos,
      ring: plot.ring,
      ...kitSize(subject.sets, plot.maxW),
      roof: subject.plot % 2 ? "gable" : "flat",
      pennant: pennantOf(subject.category),
      subject,
    };
  });
  const used = new Set(subjects.map((s) => s.plot));
  let free = 0;
  while (used.has(free)) free++;
  const freeSlot = slot(free);
  const outer = Math.max(0, ...buildings.map((b) => b.ring), freeSlot.ring);
  return { buildings, freePlot: { pos: freeSlot.pos, ring: freeSlot.ring, size: [11, 8] }, half: rings[outer]?.half ?? BASE_HALF };
}

// Points near which trees mustn't grow: the plots in use and the free one.
export const occupiedPoints = (layout: CampusLayout): XZ[] => [...layout.buildings.map((b) => b.pos), ...(layout.freePlot ? [layout.freePlot.pos] : [])];
