// Your character's live state (the prototype's scene/you.js), shared by the camera, the coach and the world's taps
// without re-rendering React, and kept while you're away from the campus, so you're where you were when you come back:
// - pos: where you stand; moving: on the move this frame;
// - follow: the camera keeps you in view (on while you walk, off once you drag the map yourself);
// - lookAt: someone you're talking to (the coach), so you turn to face them;
// - inside: the place you went into, so you come back out of its door;
// - intent: a walk asked for (walkTo), picked up by your character at its next frame.
import * as THREE from "three";

// A walk: to a point (to, with a ring where you tapped: mark), or to a place's door (door: a building's id, or
// "office"), then what happens there (then: going in). locked: a walk to a class, which a tap elsewhere doesn't cancel.
export type Walk = { to?: readonly [number, number]; door?: string; then?: () => void; mark?: boolean; locked?: boolean };

export const HOME = new THREE.Vector3(0, 0, 6.6);
export const you: {
  pos: THREE.Vector3;
  moving: boolean;
  follow: boolean;
  lookAt: THREE.Vector3 | null;
  inside: string | null;
  intent: Walk | null;
  locked: boolean;
} = {
  pos: HOME.clone(),
  moving: false,
  follow: false,
  lookAt: null,
  inside: null,
  intent: null,
  locked: false,
};

// Asks your character to walk (it plans the route at its next frame). A walk to a class can't be cut short.
export function walkTo(walk: Walk): void {
  if (you.locked) return;
  you.intent = walk;
}
