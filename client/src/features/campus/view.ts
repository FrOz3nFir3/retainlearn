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

// This browser's copy of the subjects on your campus (with the last view, above), so a subject's page opened straight
// from its address (a reload inside a building) shows the right frame before the campus's data arrives: the lobby's for
// a subject with a building, the list's for one without.
const SUBJECTS_KEY = "retainlearn:campus-subjects";
export function keepSubjects(names: readonly string[]): void {
  try {
    const value = JSON.stringify(names.toSorted());
    if (localStorage.getItem(SUBJECTS_KEY) !== value) localStorage.setItem(SUBJECTS_KEY, value);
  } catch {
    // Not kept: such a page shows its 2D skeleton first.
  }
}
export function keptSubjects(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SUBJECTS_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((name): name is string => typeof name === "string") : [];
  } catch {
    return [];
  }
}

// Whether the 3D world shows behind this page, and as what: signed in, the campus in 3D (and not broken). The pages use
// it to show themselves as panels over the world. A subject on your campus opens its building (its page is the lobby,
// its classrooms panels over their rooms); one off your campus has no building, so its page is a list over the campus,
// and its classrooms panels over the campus, as in the prototype. category: the subject of the page, or of a room's set
// (null until the set says, when no building did). campus: null while it's this browser's guess, before the campus's
// data arrives (a page opened straight from its address; the campus's own page guesses for itself). A study set that
// didn't load (gone, or a bad address) shows its page alone.
export type World = { shown: false } | { shown: true; view: WorldView; campus: Campus | null; category: string | null };
export function useWorld(): World {
  const { pathname, state } = useLocation();
  // A room opened from its building says which (the set itself says, once it's loaded).
  const building = (state as { building?: string } | null)?.building ?? null;
  const session = useSession();
  const campus = useCampus(session !== "in");
  const isBroken = useBroken();
  const view = worldViewOf(pathname);
  const set = useGetStudySetQuery(view?.kind === "room" && session === "in" ? view.setId : skipToken);
  if (!view || (view.kind === "room" && set.isError)) return { shown: false };
  if (view.kind !== "campus" && session !== "out" && !campus.data && !campus.isError && !isBroken && webglWorks() && lastView() === true) return { shown: true, view, campus: null, category: null };
  if (session !== "in" || !campus.data || isBroken || !shows3d(campus.data.player.settings.view3d)) return { shown: false };
  const category = view.kind === "building" ? view.category : view.kind === "room" ? (set.data?.category ?? building) : null;
  return { shown: true, view, campus: campus.data, category };
}

// Signing out: this browser's copies (the last view, your campus's subjects) go, so a visitor, or the next player on
// this browser, isn't shown your campus's frame while their session is checked.
export function forgetView(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SUBJECTS_KEY);
  } catch {
    // Nothing kept.
  }
}

// Whether you see your campus in 3D: from its data, or before it arrives, from this browser's copy (shown here before).
export const plays3d = (campus: Campus | undefined): boolean => (campus ? shows3d(campus.player.settings.view3d) : webglWorks() && lastView() === true);
