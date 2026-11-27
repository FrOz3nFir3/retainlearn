// How the campus shows: in 3D, or as the 2D page. Your pick once you've made one (the switch on the campus, kept on
// your account as view3d), and until then what the device suits: 3D where a graphics card draws WebGL 2 (three.js needs
// it) and you haven't asked for reduced motion. WebGL drawn in software only (no usable graphics card: a few frames a
// second) starts in 2D, though the switch still offers 3D; without WebGL at all, 2D whatever the pick. This browser
// keeps a copy of the answer, so the campus's skeleton, shown before the campus's data arrives, is the right one. Also
// which pages the 3D world stays behind (useWorld), and whether 3D broke on this device. No three.js here: the
// skeleton and the app's frame load it with the app.
import { useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import type { Campus } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { useGetStudySetQuery } from "#features/classroom/classroomApi.ts";
import { useCampus } from "./campusApi.ts";

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

// 3D that didn't start, or stopped, on this device (the GPU gave the canvas up): the 2D pages until you try 3D again,
// for this visit. Shared, as the world and the pages it stands behind both go by it.
let broken = false;
const brokenListeners = new Set<() => void>();
export function setBroken(value: boolean): void {
  if (broken === value) return;
  broken = value;
  brokenListeners.forEach((listener) => listener());
}
const onBroken = (listener: () => void) => {
  brokenListeners.add(listener);
  return () => void brokenListeners.delete(listener);
};
export const useBroken = (): boolean => useSyncExternalStore(onBroken, () => broken, () => broken);

// The pages the 3D world stays behind (D-20), by their address: the campus itself, the subjects list over it, a
// subject's page as the inside of its building, and a study set's page (its classroom, not its classes) over its room.
export type WorldView = { kind: "campus" } | { kind: "directory" } | { kind: "building"; category: string } | { kind: "room"; setId: string };
export function worldViewOf(pathname: string): WorldView | null {
  if (pathname === "/") return { kind: "campus" };
  if (pathname === "/subjects") return { kind: "directory" };
  const subject = /^\/subjects\/([^/]+)$/.exec(pathname)?.[1];
  if (subject) {
    try {
      return { kind: "building", category: decodeURIComponent(subject) };
    } catch {
      return null;
    }
  }
  const room = /^\/study-sets\/([0-9a-f]{24})$/.exec(pathname)?.[1];
  return room ? { kind: "room", setId: room } : null;
}

// Whether the 3D world shows behind this page, and as what: signed in, the campus in 3D (and not broken), and for a
// subject or a study set, only when the subject is on your campus (only then does it have a building, as in the
// prototype; otherwise its page stays the 2D page). The pages use it to show themselves as panels over the world.
// category: the building a room is in. kinds: the views built so far.
export type World = { shown: false } | { shown: true; view: WorldView; campus: Campus; category: string | null };
const BUILT: readonly WorldView["kind"][] = ["campus", "building"];
export function useWorld(): World {
  const { pathname } = useLocation();
  const session = useSession();
  const campus = useCampus(session !== "in");
  const isBroken = useBroken();
  const view = worldViewOf(pathname);
  const set = useGetStudySetQuery(view?.kind === "room" && session === "in" ? view.setId : skipToken);
  if (!view || !BUILT.includes(view.kind) || session !== "in" || !campus.data || isBroken || !shows3d(campus.data.player.settings.view3d)) return { shown: false };
  const category = view.kind === "building" ? view.category : view.kind === "room" ? (set.data?.category ?? null) : null;
  if ((view.kind === "building" || view.kind === "room") && !campus.data.subjects.some((s) => s.category === category)) return { shown: false };
  return { shown: true, view, campus: campus.data, category };
}
