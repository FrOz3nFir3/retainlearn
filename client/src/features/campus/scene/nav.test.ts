// Where you can walk (nav.ts): round a building, never through it; the clock tower, the fountain once it's up and the
// coach's office are in the way; a tap off the lot still gets you as close as you can stand. Each test is a rule
// written as an example.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import type { CampusSubject } from "@retainlearn/core";
import { layoutCampus } from "./layout.ts";
import { findPath, free, navFor, pathLength } from "./nav.ts";
import { FOUNTAIN, OFFICE } from "./places.ts";
import { doorPoint, facingCenter } from "./util.ts";

const subject = (category: string, plot: number): CampusSubject => ({ category, plot, sets: 3, started: 1, mastery: 0.5, missed: 0, lastAt: null, status: "warm" });
const layout = layoutCampus([subject("Programming", 0), subject("Biology", 1)]);
const at = (x: number, z: number) => new THREE.Vector3(x, 0, z);
// Every point along a route, a step at a time, outside every building (its walls and plinth) and the clock tower. The
// route keeps a body's width from them, give or take a few centimetres where a straight leg cuts a corner of the grid.
const throughNothing = (pts: THREE.Vector3[]) =>
  pts.every((p, i) => {
    if (!i) return true;
    const from = pts[i - 1]!;
    const steps = Math.ceil(from.distanceTo(p) / 0.25);
    return Array.from({ length: steps }, (_, k) => from.clone().lerp(p, (k + 1) / steps)).every((q) => {
      if (Math.abs(q.x) < 2.5 && Math.abs(q.z) < 2.5) return false; // the tower
      return layout.buildings.every((b) => {
        const rot = facingCenter(b.pos);
        const [dx, dz] = [q.x - b.pos[0], q.z - b.pos[1]];
        const [lx, lz] = [dx * Math.cos(rot) - dz * Math.sin(rot), dx * Math.sin(rot) + dz * Math.cos(rot)];
        return Math.abs(lx) >= b.size[0] / 2 + 0.7 || Math.abs(lz) >= b.size[1] / 2 + 0.7;
      });
    });
  });

test("the buildings, the clock tower and the coach's office are in the way; the open quad isn't", () => {
  const nav = navFor(layout, false);
  const [b] = layout.buildings;
  assert.ok(b);
  assert.equal(free(nav, b.pos[0], b.pos[1]), false, "inside a building");
  assert.equal(free(nav, 0, 0), false, "the clock tower");
  assert.equal(free(nav, OFFICE.pos[0], OFFICE.pos[1]), false, "the coach's office");
  assert.equal(free(nav, 0, 6.6), true, "the quad, where you start");
});

test("the fountain is in the way only once it's up", () => {
  assert.equal(free(navFor(layout, false), FOUNTAIN[0], FOUNTAIN[1]), true);
  assert.equal(free(navFor(layout, true), FOUNTAIN[0], FOUNTAIN[1]), false);
});

test("a route to a building's door goes round things, in a few straight legs", () => {
  const nav = navFor(layout, false);
  const [b] = layout.buildings;
  assert.ok(b);
  const door = doorPoint(b, 1.9);
  const route = findPath(nav, at(0, 6.6), door);
  const end = route[route.length - 1]!;
  assert.ok(end.distanceTo(door) < 0.01, "it ends at the door");
  assert.ok(throughNothing(route), "never through a building or the tower");
  assert.ok(route.length <= 8, `pulled straight: ${route.length} points`);
  assert.ok(pathLength(route) < door.distanceTo(at(0, 6.6)) * 1.6, "not a long way round");
});

test("a tap off the lot gets you as close as you can stand", () => {
  const nav = navFor(layout, false);
  const route = findPath(nav, at(0, 6.6), at(500, 500));
  const end = route[route.length - 1]!;
  assert.ok(free(nav, end.x, end.z), "you end up somewhere you can stand");
  assert.ok(end.x > nav.half - 4 && end.z > nav.half - 4, "in the lot's nearest corner");
});
