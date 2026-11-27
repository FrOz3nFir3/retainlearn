// Where you can walk on the campus (the prototype's scene/nav.js): a 1 m grid over the lot, with the buildings, the
// clock tower, the fountain, the trees, the lamps and the coach's office blocked. A* finds a route on the grid; the
// route is then pulled straight wherever nothing is in the way, so you walk in lines and round corners instead of
// zig-zagging from cell to cell.
import * as THREE from "three";
import { occupiedPoints } from "./layout.ts";
import type { CampusLayout } from "./layout.ts";
import { FOUNTAIN, LAMPS, NOTICEBOARD, OFFICE, treeSpots } from "./places.ts";
import type { XZ } from "./places.ts";
import { facingCenter } from "./util.ts";

const BODY = 0.6; // how far a person keeps from things
const CORNER = 7; // the lot's rounded corners (Grounds in World.tsx)

// A box turned like its building (rotation-y): a point is moved into the box's frame to test it. Or a disc.
type Thing = { x: number; z: number; r?: number; c?: number; s?: number; hx?: number; hz?: number };
const box = ([x, z]: XZ, rot: number, hx: number, hz: number): Thing => ({ x, z, c: Math.cos(rot), s: Math.sin(rot), hx, hz });
const disc = ([x, z]: XZ, r: number): Thing => ({ x, z, r });
function hits(o: Thing, x: number, z: number): boolean {
  const dx = x - o.x;
  const dz = z - o.z;
  if (o.r) return dx * dx + dz * dz < o.r * o.r;
  const [c, s, hx, hz] = [o.c ?? 1, o.s ?? 0, o.hx ?? 0, o.hz ?? 0];
  return Math.abs(dx * c - dz * s) < hx && Math.abs(dx * s + dz * c) < hz;
}
function extent(o: Thing): [number, number] {
  if (o.r) return [o.r, o.r];
  const [c, s, hx, hz] = [Math.abs(o.c ?? 1), Math.abs(o.s ?? 0), o.hx ?? 0, o.hz ?? 0];
  return [c * hx + s * hz, s * hx + c * hz];
}
function onLot(x: number, z: number, half: number): boolean {
  const ax = Math.abs(x);
  const az = Math.abs(z);
  const k = half - CORNER;
  if (ax > half - BODY || az > half - BODY) return false;
  return ax <= k || az <= k || Math.hypot(ax - k, az - k) <= CORNER - BODY;
}

export type Nav = { half: number; n: number; blocked: Uint8Array; things: Thing[] };

function build(layout: CampusLayout, fountain: boolean): Nav {
  const { half } = layout;
  const things = [
    ...layout.buildings.map((b) => box(b.pos, facingCenter(b.pos), b.size[0] / 2 + 0.7 + BODY, b.size[1] / 2 + 0.7 + BODY)),
    box([0, 0], 0, 2.5 + BODY, 2.5 + BODY), // the clock tower
    ...(fountain ? [disc(FOUNTAIN, 2.2 + BODY)] : []),
    ...treeSpots(occupiedPoints(layout), half).map(([x, z, s = 1]) => disc([x, z], 1.1 * s + 0.3)),
    ...LAMPS.map((p) => disc(p, 0.2 + BODY)),
    box(OFFICE.pos, OFFICE.rot, 3.3 + BODY, 2.5 + BODY), // the coach's office, on its base
    box(NOTICEBOARD.pos, NOTICEBOARD.rot, 1.9 + BODY, 0.3 + BODY), // the paths' noticeboard
  ];
  const n = Math.ceil(half * 2);
  const blocked = new Uint8Array(n * n);
  for (let iz = 0; iz < n; iz++) {
    for (let ix = 0; ix < n; ix++) if (!onLot(ix - half + 0.5, iz - half + 0.5, half)) blocked[iz * n + ix] = 1;
  }
  for (const o of things) {
    const [ex, ez] = extent(o);
    for (let iz = Math.max(0, Math.floor(o.z - ez + half)); iz <= Math.min(n - 1, Math.floor(o.z + ez + half)); iz++) {
      for (let ix = Math.max(0, Math.floor(o.x - ex + half)); ix <= Math.min(n - 1, Math.floor(o.x + ex + half)); ix++) {
        if (hits(o, ix - half + 0.5, iz - half + 0.5)) blocked[iz * n + ix] = 1;
      }
    }
  }
  return { half, n, blocked, things };
}

// One grid per layout (and fountain), shared by everyone who walks.
const grids = new WeakMap<CampusLayout, Partial<Record<"with" | "without", Nav>>>();
export function navFor(layout: CampusLayout, fountain: boolean): Nav {
  let byFountain = grids.get(layout);
  if (!byFountain) grids.set(layout, (byFountain = {}));
  return (byFountain[fountain ? "with" : "without"] ??= build(layout, fountain));
}

// Can someone stand here? Exact shapes, for steering with the keys.
export const free = (nav: Nav, x: number, z: number): boolean => onLot(x, z, nav.half) && !nav.things.some((o) => hits(o, x, z));
// The grid's answer, for routes.
function open(nav: Nav, x: number, z: number): boolean {
  const ix = Math.floor(x + nav.half);
  const iz = Math.floor(z + nav.half);
  return ix >= 0 && iz >= 0 && ix < nav.n && iz < nav.n && !nav.blocked[iz * nav.n + ix];
}

// The open cell nearest a point (a tap on a tree or past the road still gets you as close as you can).
function nearestOpen(nav: Nav, x: number, z: number): number {
  const { n, blocked, half } = nav;
  const cx = Math.min(n - 1, Math.max(0, Math.floor(x + half)));
  const cz = Math.min(n - 1, Math.max(0, Math.floor(z + half)));
  for (let r = 0; r < n; r++) {
    let best = -1;
    let bestD = Infinity;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const ix = cx + dx;
        const iz = cz + dz;
        if (ix < 0 || iz < 0 || ix >= n || iz >= n || blocked[iz * n + ix]) continue;
        const d = (ix - half + 0.5 - x) ** 2 + (iz - half + 0.5 - z) ** 2;
        if (d < bestD) {
          bestD = d;
          best = iz * n + ix;
        }
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}

// A binary heap of [cost, cell], cheapest first.
type Entry = [number, number];
function push(heap: Entry[], item: Entry): void {
  heap.push(item);
  for (let i = heap.length - 1; i > 0; ) {
    const p = (i - 1) >> 1;
    if (heap[p]![0] <= heap[i]![0]) break;
    [heap[p], heap[i]] = [heap[i]!, heap[p]!];
    i = p;
  }
}
function pop(heap: Entry[]): Entry {
  const top = heap[0]!;
  const last = heap.pop()!;
  if (heap.length) {
    heap[0] = last;
    for (let i = 0; ; ) {
      const l = 2 * i + 1;
      let m = i;
      if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l;
      if (l + 1 < heap.length && heap[l + 1]![0] < heap[m]![0]) m = l + 1;
      if (m === i) break;
      [heap[m], heap[i]] = [heap[i]!, heap[m]!];
      i = m;
    }
  }
  return top;
}

const STEPS: readonly (readonly [number, number, number])[] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

// A walkable route from one point to another, as a few straight legs. The last point is where you asked to go, or the
// nearest place you can stand to it.
export function findPath(nav: Nav, from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  const { n, blocked, half } = nav;
  const start = nearestOpen(nav, from.x, from.z);
  const goal = nearestOpen(nav, to.x, to.z);
  if (start < 0 || goal < 0) return [from.clone()];
  const gx = goal % n;
  const gz = (goal - gx) / n;
  const guess = (i: number) => {
    const dx = Math.abs((i % n) - gx);
    const dz = Math.abs(Math.floor(i / n) - gz);
    return dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz);
  };
  const cost = new Float32Array(n * n).fill(Infinity);
  const came = new Int32Array(n * n).fill(-1);
  const done = new Uint8Array(n * n);
  const heap: Entry[] = [[guess(start), start]];
  cost[start] = 0;
  while (heap.length) {
    const [, cur] = pop(heap);
    if (cur === goal) break;
    if (done[cur]) continue;
    done[cur] = 1;
    const cx = cur % n;
    const cz = (cur - cx) / n;
    for (const [dx, dz, step] of STEPS) {
      const x = cx + dx;
      const z = cz + dz;
      if (x < 0 || z < 0 || x >= n || z >= n) continue;
      const i = z * n + x;
      if (blocked[i] || done[i]) continue;
      if (dx && dz && (blocked[cz * n + x] || blocked[z * n + cx])) continue; // no cutting corners
      const c = cost[cur]! + step;
      if (c < cost[i]!) {
        cost[i] = c;
        came[i] = cur;
        push(heap, [c + guess(i), i]);
      }
    }
  }
  if (goal !== start && came[goal]! < 0) return [from.clone()];
  const cells = [goal];
  while (cells[cells.length - 1] !== start) cells.push(came[cells[cells.length - 1]!]!);
  cells.reverse();
  const pts = cells.map((i) => new THREE.Vector3((i % n) - half + 0.5, 0, Math.floor(i / n) - half + 0.5));
  pts[0] = from.clone().setY(0);
  if (open(nav, to.x, to.z)) pts.push(to.clone().setY(0));
  if (pts.length === 1) pts.push(pts[0].clone());
  // Pulled straight: from each point, on to the furthest point in sight.
  const out = [pts[0]];
  for (let i = 0; i < pts.length - 1; ) {
    let j = pts.length - 1;
    while (j > i + 1 && !clear(nav, pts[i]!, pts[j]!)) j--;
    out.push(pts[j]!);
    i = j;
  }
  return out;
}
function clear(nav: Nav, a: THREE.Vector3, b: THREE.Vector3): boolean {
  const steps = Math.ceil(a.distanceTo(b) / 0.3);
  for (let k = 1; k < steps; k++) {
    const t = k / steps;
    if (!open(nav, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

export const pathLength = (pts: readonly THREE.Vector3[]): number => pts.reduce((sum, p, i) => (i ? sum + p.distanceTo(pts[i - 1]!) : 0), 0);
