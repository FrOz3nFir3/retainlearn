// Subjects as buildings on plots: each keeps its plot, the next free plot is the one for adding a subject, the campus
// grows a ring at a time, and a subject's sets decide its building's size. Each test is a rule written as an example.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CampusSubject } from "@retainlearn/core";
import { CELL, layoutCampus } from "./layout.ts";

const subject = (category: string, plot: number, sets = 3): CampusSubject => ({ category, plot, sets, started: 1, mastery: 0.5, missed: 0, lastAt: null, status: "warm" });

test("a subject keeps its plot, and the first free plot is for adding one", () => {
  const layout = layoutCampus([subject("Programming", 0), subject("Biology", 2)]);
  const first = layoutCampus([subject("Programming", 0)]);
  assert.deepEqual(layout.buildings[0]?.pos, first.buildings[0]?.pos, "the same plot, whatever else is on the campus");
  assert.deepEqual(layout.freePlot?.pos, layoutCampus([subject("A", 0), subject("B", 2), subject("C", 1)]).buildings[2]?.pos, "plot 1 is the free one");
});

test("the campus grows a ring at a time", () => {
  const nine = Array.from({ length: 9 }, (_, i) => subject(`S${i}`, i));
  const ten = [...nine, subject("S9", 9)];
  assert.equal(layoutCampus(nine).half, 42, "nine subjects and the free plot: the first two rings");
  assert.ok(layoutCampus(ten).half > 42, "the tenth fills them, so the free plot opens a third ring");
});

test("a subject's sets decide its building: wider from 4 sets on a big plot, and a floor for each 3 rooms", () => {
  const [small] = layoutCampus([subject("Small", 0, 1)]).buildings;
  const [big] = layoutCampus([subject("Big", 0, 12)]).buildings;
  assert.deepEqual(small?.size, [2 * CELL, 2 * CELL]);
  assert.equal(small?.floors, 2, "a lobby and one classroom floor");
  assert.deepEqual(big?.size, [3 * CELL, 2 * CELL]);
  assert.equal(big?.floors, 4, "a lobby and three classroom floors: a page of 9");
});
