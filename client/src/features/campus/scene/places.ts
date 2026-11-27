// Where the campus's fixed things stand (the prototype's data/campus.js), for the props that draw them (Props.tsx) and
// the paths you walk round them (nav.ts): the coach's office, the street lamps, the fountain, the trees and the bus
// stop. x and z in metres from the clock tower, in the middle.
export type XZ = readonly [number, number];
const polar = (deg: number, r: number): XZ => [Math.round(Math.cos((deg * Math.PI) / 180) * r * 10) / 10, Math.round(Math.sin((deg * Math.PI) / 180) * r * 10) / 10];
const BASE_HALF = 42; // half the lot's width with the first two rings

// Your coach's office, just off the quad on the left as you come in: door, where you stand to go in; coach, where they
// wait beside it. Plots never come closer than 21 m from the middle, so it stays clear of any subject added later.
export const OFFICE = { pos: [-6.4, 15.2] as XZ, rot: Math.PI / 2, door: [-2.6, 15.2] as XZ, coach: [-2.9, 17.6] as XZ };
export const LAMPS = [20, 100, 200, 250, 290, 330].map((deg) => polar(deg, 13.2));
// On the quad's lawn, once you've unlocked it.
export const FOUNTAIN: XZ = [-5.4, 5.4];
// The bus stop, just outside the road on the far side, and the point of the road it serves.
export const busStop = (half: number) => ({ pos: [14, -(half + 7.6)] as XZ, road: [14, -(half + 3.5)] as XZ });

const TREES: (readonly [number, number, number?])[] = [
  [5, 5, 0.9], [5, -5, 0.85], [-5, -5, 0.9],
  [0, -25], [-4, -31, 1.1], [6, -31], [33, -8, 1.1], [-35, -6], [-33, 21, 1.1], [23, 23], [-4, 34],
  [34, 24, 1.2], [-35, -25, 1.1], [34, -29], [-24, -34, 1.2], [16, 36], [-26, 34], [36, 3, 0.9],
  [14.9, -4, 0.8], [11, 11, 0.85], [-12.7, 8.9, 0.8], [-15.3, -2.7, 0.85], [3, -15.5, 0.8],
]; // prettier-ignore

// The trees on the lot: everywhere but near the plots in use (avoid) and the office; a bigger lot gets trees in its
// new outer band too. Each spot is [x, z, scale].
export function treeSpots(avoid: readonly XZ[], half: number): (readonly [number, number, number?])[] {
  const keepClear = [...avoid, OFFICE.pos];
  const extra: (readonly [number, number, number])[] = [];
  for (let x = -half + 5; x <= half - 5; x += 9) {
    for (let z = -half + 5; z <= half - 5; z += 9) {
      if (Math.max(Math.abs(x), Math.abs(z)) < BASE_HALF + 4) continue;
      const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      const f = h - Math.floor(h);
      if (f < 0.45) continue;
      extra.push([x + (f - 0.7) * 5, z + (0.7 - f) * 5, 0.85 + f * 0.3]);
    }
  }
  return [...TREES, ...extra].filter(([x, z]) => keepClear.every(([ax, az]) => Math.hypot(x - ax, z - az) > 10.5));
}

// A belt of trees just outside the road, thick near it and thinning out, so the campus sits in a clearing. The same
// every visit (each spot's chance comes from where it is).
export function beltSpots(half: number): (readonly [number, number, number])[] {
  const [inner, outer] = [half + 8.5, half + 34];
  const spots: (readonly [number, number, number])[] = [];
  for (let x = -outer; x <= outer; x += 6) {
    for (let z = -outer; z <= outer; z += 6) {
      const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      const f = h - Math.floor(h);
      const [px, pz] = [x + (f - 0.5) * 4, z + (((f * 7.13) % 1) - 0.5) * 4];
      const edge = Math.max(Math.abs(px), Math.abs(pz));
      if (edge < inner || edge > outer) continue;
      if (f < ((edge - inner) / (outer - inner)) * 0.75) continue; // fewer further out
      spots.push([px, pz, 0.9 + f * 0.5]);
    }
  }
  return spots;
}
