import { test } from "node:test";
import assert from "node:assert/strict";
import { INTERVALS, effectiveLevel, isFading, isPlayerCard } from "@retainlearn/core";
import { IST, noon } from "./helpers.ts";

const on = (today: string) => ({ today, timeZone: IST });
const card = (level: number, day: string) => ({ level, refreshedAt: noon(day) });

test("a player card stays fresh for 1, 3, 7, 16 and 35 days at levels 1 to 5", () => {
  assert.deepEqual(INTERVALS, [1, 3, 7, 16, 35]);
});

test("a card fades once more days than its level's interval have passed since you last remembered it", () => {
  assert.equal(isFading(card(1, "2026-11-20"), on("2026-11-21")), false); // 1 day at level 1: still fresh
  assert.equal(isFading(card(1, "2026-11-20"), on("2026-11-22")), true);
  assert.equal(isFading(card(3, "2026-11-01"), on("2026-11-08")), false); // 7 days at level 3
  assert.equal(isFading(card(3, "2026-11-01"), on("2026-11-09")), true);
  assert.equal(isFading(card(5, "2026-10-01"), on("2026-11-05")), false); // 35 days at level 5
  assert.equal(isFading(card(5, "2026-10-01"), on("2026-11-06")), true);
});

test("only player cards fade, and a card with no date counts as fading", () => {
  assert.equal(isPlayerCard(undefined), false);
  assert.equal(isPlayerCard({ level: 0, wrong: 2 }), false, "answered, but never got right");
  assert.equal(isPlayerCard({ level: 1 }), true);
  assert.equal(isFading(undefined, on("2026-11-21")), false);
  assert.equal(isFading({ level: 0, wrong: 2, missedOn: "2026-11-01" }, on("2026-11-21")), false);
  assert.equal(isFading({ level: 2 }, on("2026-11-21")), true);
});

test("a fading card plays a level lower, but never below 1", () => {
  assert.equal(effectiveLevel(card(3, "2026-11-19"), on("2026-11-21")), 3);
  assert.equal(effectiveLevel(card(3, "2026-11-01"), on("2026-11-21")), 2);
  assert.equal(effectiveLevel(card(1, "2026-11-01"), on("2026-11-21")), 1);
  assert.equal(effectiveLevel(undefined, on("2026-11-21")), 0);
});
