// The people on your campus (the prototype's scene/People.jsx): students about the quad, more of them the more you've
// mastered; you; and your coach. With reduced motion, nobody walks: students stand about, you're simply where you
// asked to go, and your coach is simply beside you.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cx } from "#utils/cx.ts";
import type { Coach as CoachLook } from "../coach.ts";
import { pointer } from "./Building.tsx";
import { KitPerson, PEOPLE_COUNT } from "./kit.tsx";
import type { Dress, PersonApi } from "./kit.tsx";
import { Label } from "./Label.tsx";
import type { CampusBuilding } from "./layout.ts";
import { findPath, free, pathLength } from "./nav.ts";
import type { Nav } from "./nav.ts";
import { OFFICE } from "./places.ts";
import { COLORS, doorPoint, prefersReducedMotion } from "./util.ts";
import { you } from "./you.ts";

const turnTo = (a: number, b: number, t: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;

// ---------- students ----------

// A busier campus means more mastery: the crowd follows your average across your subjects (6 to 30). Most walk round
// the quad's path, some to and from a building's door.
const RING = 11.2;
export function Students({ buildings, mastery }: { buildings: readonly CampusBuilding[]; mastery: number }) {
  const still = useMemo(prefersReducedMotion, []);
  const count = Math.min(30, 6 + Math.round(mastery * 30));
  const walkers = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const b = buildings.length ? buildings[i % buildings.length] : null;
        const door = b ? doorPoint(b, 2.4) : new THREE.Vector3(Math.cos(i) * 20, 0, Math.sin(i) * 20);
        const r = RING - 0.6 + (i % 3) * 0.55;
        const speed = (0.09 + ((i * 37) % 10) / 160) * (i % 2 ? 1 : -1);
        return {
          spoke: !!b && i % 3 === 2 && b.ring < 2, // a straight spoke to an outer ring would cut through buildings
          r,
          speed,
          pace: Math.min(1.2, Math.max(0.6, (Math.abs(speed) * r) / 2)), // the walk cycle, matched to how fast they go
          phase: (i * 2.39996) % (Math.PI * 2),
          start: door.clone().normalize().multiplyScalar(RING + 1.2),
          end: door,
        };
      }),
    [buildings],
  );
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    if (still) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const w = walkers[i];
      const g = refs.current[i];
      if (!w || !g) continue;
      if (w.spoke) {
        const u = (Math.sin(t * 0.25 + w.phase) + 1) / 2;
        const dir = Math.cos(t * 0.25 + w.phase) >= 0 ? 1 : -1;
        g.position.lerpVectors(w.start, w.end, u);
        g.rotation.y = Math.atan2((w.end.x - w.start.x) * dir, (w.end.z - w.start.z) * dir);
      } else {
        const a = w.phase + t * w.speed;
        g.position.set(Math.cos(a) * w.r, 0, Math.sin(a) * w.r);
        g.rotation.y = Math.atan2(-Math.sin(a) * w.speed, Math.cos(a) * w.speed);
      }
    }
  });
  return walkers.slice(0, count).map((w, i) => (
    <group key={i} ref={(g) => void (refs.current[i] = g)} position={w.spoke ? w.start.toArray() : [Math.cos(w.phase) * w.r, 0, Math.sin(w.phase) * w.r]}>
      <Suspense fallback={null}>
        <KitPerson variant={(i * 5) % PEOPLE_COUNT} action={still ? "idle" : "walk"} speed={w.pace} offset={w.phase} scale={2.9} />
      </Suspense>
    </group>
  ));
}

// ---------- you ----------

// A place you can go into from its door: a subject's building, or the coach's office (your report card).
export type Door = { id: string; name: string; say?: string; at: THREE.Vector3; go: () => void };

const YOU_VARIANT = 2; // which of the kit's characters is you
const WALK = 6.5; // metres a second on foot
// A trip longer than RUN_FROM is a run, at one pace every time (a far building doesn't come at a zoom).
const RUN = 10;
const RUN_FROM = 12;
const DOOR_REACH = 2.4; // how close to a door "Go into" shows
// Keys steer as the camera sees it: [right, forward].
const KEYS: Record<string, readonly [number, number]> = { w: [0, 1], arrowup: [0, 1], s: [0, -1], arrowdown: [0, -1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
type Plan = { pts: THREE.Vector3[]; i: number; top: number; v: number; left: number; then?: () => void; mark: boolean };

// You, on your campus:
// - a tap on the ground and you walk there, round buildings and trees (nav.ts);
// - a tap on a building, or the coach's office, and you walk over and go in;
// - on a computer, WASD or the arrow keys steer you, while nothing on the page has focus (or a place's label does);
// - at a door, "Go into …" (or Enter) takes you in;
// - Start on the timetable walks you to its building first (a walk nothing else cuts short).
// Coming back to the campus, you come out of the door of the place you went into.
export function You({ nav, doors, steerable }: { nav: Nav; doors: readonly Door[]; steerable: () => boolean }) {
  const ref = useRef<THREE.Group>(null);
  const person = useRef<PersonApi>(null);
  const marker = useRef<THREE.Mesh>(null);
  const plan = useRef<Plan | null>(null);
  const keys = useRef(new Set<string>());
  const nearRef = useRef<Door | null>(null);
  const [near, setNear] = useState<Door | null>(null);
  const justOut = useRef(false); // just came out of a door: it isn't offered again until you move
  const still = useMemo(prefersReducedMotion, []);
  const live = useRef({ nav, doors, steerable });
  live.current = { nav, doors, steerable };

  // Back on the campus: out of the door of the place you went into, with no walk left over from before you went.
  useEffect(() => {
    const inside = you.inside;
    you.inside = null;
    you.intent = null;
    you.locked = false;
    const at = inside ? live.current.doors.find((d) => d.id === inside)?.at : null;
    if (!at) return;
    you.pos.copy(at);
    justOut.current = true;
    if (ref.current) ref.current.rotation.y = Math.atan2(-at.x, -at.z);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || you.locked || !live.current.steerable()) return;
      const k = e.key.toLowerCase();
      if (KEYS[k]) {
        keys.current.add(k);
        e.preventDefault();
      } else if (k === "enter" && nearRef.current && !/^(BUTTON|A)$/.test(document.activeElement?.tagName ?? "")) {
        e.preventDefault();
        nearRef.current.go();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clearKeys = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clearKeys);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clearKeys);
    };
  }, []);

  const v = useMemo(() => ({ fwd: new THREE.Vector3(), dir: new THREE.Vector3(), before: new THREE.Vector3() }), []);
  useFrame(({ camera, clock }, delta) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1); // a slow phone still arrives on time; a tab coming back doesn't teleport you
    const { nav: grid, doors: places } = live.current;

    // 1. A walk asked for since the last frame: its route, at a walk, or a run if it's far; with reduced motion you're
    // simply there.
    const intent = you.intent;
    if (intent) {
      you.intent = null;
      const door = intent.door ? places.find((d) => d.id === intent.door) : null;
      const target = intent.to ? new THREE.Vector3(intent.to[0], 0, intent.to[1]) : (door?.at.clone() ?? null);
      you.locked = !!intent.locked;
      if (!target) {
        you.locked = false;
        intent.then?.();
      } else {
        const pts = findPath(grid, you.pos, target);
        const end = pts[pts.length - 1] ?? target;
        if (still) {
          you.pos.copy(end);
          plan.current = null;
          you.locked = false;
          intent.then?.();
        } else {
          const length = pathLength(pts);
          plan.current = { pts, i: 1, top: length > RUN_FROM ? RUN : WALK, v: WALK, left: length, then: intent.then, mark: !!intent.mark };
          marker.current?.position.set(end.x, 0.06, end.z);
          you.follow = true;
        }
      }
    }

    // 2. Steering with the keys takes over from a tapped walk.
    let moved = 0;
    let heading: number | null = null;
    if (keys.current.size && !you.locked) {
      let ix = 0;
      let iz = 0;
      for (const k of keys.current) {
        ix += KEYS[k]?.[0] ?? 0;
        iz += KEYS[k]?.[1] ?? 0;
      }
      if (ix || iz) {
        camera.getWorldDirection(v.fwd);
        v.fwd.setY(0).normalize();
        v.dir.set(-v.fwd.z, 0, v.fwd.x).multiplyScalar(ix).addScaledVector(v.fwd, iz).normalize();
        plan.current = null;
        you.follow = true;
        const d = WALK * dt;
        const x = you.pos.x + v.dir.x * d;
        const z = you.pos.z + v.dir.z * d;
        v.before.copy(you.pos);
        // Slide along whatever's in the way; standing inside something, any way out is fine.
        const ok = (px: number, pz: number) => free(grid, px, pz) || !free(grid, v.before.x, v.before.z);
        if (ok(x, z)) you.pos.set(x, 0, z);
        else if (ok(x, you.pos.z)) you.pos.x = x;
        else if (ok(you.pos.x, z)) you.pos.z = z;
        moved = you.pos.distanceTo(v.before);
        heading = Math.atan2(v.dir.x, v.dir.z);
      }
    }

    // 3. Following a route: up to the trip's pace in about a fifth of a second, and back to a walk over the last few
    // metres, so a run never starts or stops dead.
    const p = plan.current;
    if (p) {
      p.v = Math.min(p.top, p.v + (RUN - WALK) * 5 * dt);
      const pace = Math.max(WALK, Math.min(p.v, WALK + (p.top - WALK) * (p.left / 2.5)));
      let budget = pace * dt;
      const was = moved;
      while (budget > 0 && p.i < p.pts.length) {
        const t = p.pts[p.i]!;
        const dx = t.x - you.pos.x;
        const dz = t.z - you.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > 1e-3) heading = Math.atan2(dx, dz);
        if (d <= budget) {
          you.pos.set(t.x, 0, t.z);
          budget -= d;
          moved += d;
          p.i++;
        } else {
          you.pos.x += (dx / d) * budget;
          you.pos.z += (dz / d) * budget;
          moved += budget;
          budget = 0;
        }
      }
      p.left -= moved - was;
      if (p.i >= p.pts.length) {
        plan.current = null;
        you.locked = false;
        p.then?.();
      }
    }
    you.moving = moved > 1e-4;

    // 4. Facing the way you go (standing in a conversation, the one talking to you), in the kit's own walk or sprint,
    // paced to the speed.
    if (heading == null && you.lookAt) heading = Math.atan2(you.lookAt.x - you.pos.x, you.lookAt.z - you.pos.z);
    if (heading != null) g.rotation.y = turnTo(g.rotation.y, heading, 1 - Math.exp(-dt * 14));
    const speed = moved / dt;
    if (!you.moving) person.current?.play("idle");
    else if (speed > 9) person.current?.play("sprint", Math.min(1.6, speed / 11));
    else person.current?.play("walk", Math.min(1.8, Math.max(0.8, speed / 4.5)));
    g.position.set(you.pos.x, 0, you.pos.z);

    // 5. Standing at a door (or steering past one): the offer to go in.
    if (you.moving) justOut.current = false;
    let at: Door | null = null;
    if (!plan.current && !justOut.current) {
      let best = DOOR_REACH;
      for (const door of places) {
        const d = Math.hypot(door.at.x - you.pos.x, door.at.z - you.pos.z);
        if (d < best) {
          best = d;
          at = door;
        }
      }
    }
    if (at?.id !== nearRef.current?.id) {
      nearRef.current = at;
      setNear(at);
    }

    // 6. Where you tapped: a ring that pulses until you get there.
    if (marker.current) {
      marker.current.visible = !!plan.current?.mark;
      marker.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 7) * 0.12);
    }
  });

  return (
    <>
      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.75, 1, 40]} />
        <meshBasicMaterial color={COLORS.indigo} transparent opacity={0.75} depthWrite={false} />
      </mesh>
      <group ref={ref} position={you.pos.toArray()} scale={1.35} name="you">
        <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color={COLORS.indigo} transparent opacity={0.55} />
        </mesh>
        <Suspense fallback={null}>
          <KitPerson ref={person} variant={YOU_VARIANT} action="idle" scale={2.5} />
        </Suspense>
        {/* Above the places' labels (0 to 20), so none covers them. At a door, its "Go into …" takes the place of
            "You" (stacked, they overlapped). */}
        <Label position={[0, 2.2, 0]} zIndexRange={[24, 21]}>
          <div className={near ? "hidden" : "scene-chip scene-chip-you"} data-rank={near ? undefined : 3} aria-hidden="true">
            You
          </div>
        </Label>
        <Label position={[0, 2.2, 0]} zIndexRange={[29, 25]}>
          {near ? (
            <button type="button" onClick={near.go} data-rank="5" className="scene-chip pointer-events-auto cursor-pointer gap-2 border-transparent! bg-night! text-white! ring-2 ring-white/85 hover:bg-brand!">
              {near.say ?? `Go into ${near.name}`}
              <kbd className="hidden rounded-md bg-white/15 px-1.5 py-0.5 font-sans text-[10px] font-semibold sm:inline">Enter</kbd>
            </button>
          ) : (
            <span />
          )}
        </Label>
      </group>
    </>
  );
}

// ---------- the coach ----------

// Your coach: a person in their training top who brings you what's new (what they say is the HUD's, Coach.tsx). With
// something you haven't heard (comes), they walk over and stand beside you, a little toward the camera (as a TV
// two-shot frames a conversation), then talk; the camera closes in on the two of you, and goes back to your view after,
// as they go back to their office's door. Tap them, or their name, to talk any time. They don't walk up while you're on
// your way somewhere; with reduced motion they're simply beside you. At their office with nothing new, their name tag
// rests (the sign over the door says whose office it is); it shows when they're out, have news, or you point at them.
const COACH_PACE = 3.6; // metres a second: a brisk walk over
const COACH_POST = new THREE.Vector3(OFFICE.coach[0], 0, OFFICE.coach[1]);
const COACH_NEAR = 3.2; // close enough to talk
const COACH_CLOSE_UP = 26; // the camera's distance while they talk: the two of you fill the middle of the screen
type CoachProps = {
  who: CoachLook;
  nav: Nav;
  comes: boolean;
  news: boolean;
  talking: boolean;
  onTalk: () => void;
  onFrame: (at: readonly [number, number], distance: number) => void;
};
export function Coach({ who, nav, comes, news, talking, onTalk, onFrame }: CoachProps) {
  const dress = useMemo<Dress>(() => ({ shirt: who.top, shorts: COLORS.ink, socks: "#FFFFFF", boots: COLORS.ink }), [who.top]);
  const still = useMemo(prefersReducedMotion, []);
  const g = useRef<THREE.Group>(null);
  const person = useRef<PersonApi>(null);
  const pos = useRef(COACH_POST.clone());
  const plan = useRef<{ pts: THREE.Vector3[]; i: number; home?: boolean } | null>(null);
  const tried = useRef(-9); // when they last set off (a walk that falls short isn't retried every frame)
  const goHome = useRef(false); // a talk just ended: back to their post, rather than standing on top of you
  const camView = useRef<{ target: [number, number]; distance: number } | null>(null); // your view, to go back to
  const before = useRef<{ target: [number, number]; distance: number } | null>(null);
  const live = useRef({ comes, talking, nav, onTalk });
  live.current = { comes, talking, nav, onTalk };
  const [home, setHome] = useState(true);
  const homeRef = useRef(true);
  const [pointed, setPointed] = useState(false);
  const named = !home || (news && !talking) || talking || pointed;
  const talk = (e?: { stopPropagation: () => void }) => {
    e?.stopPropagation(); // not also a tap on the ground (a walk)
    onTalk();
  };

  // A conversation, framed as a game frames one: the camera closes in, and goes back to your view when it's over.
  useEffect(() => {
    if (talking) {
      goHome.current = false;
      before.current = camView.current;
      const c = pos.current;
      const at: [number, number] = c.distanceTo(you.pos) > 6 ? [c.x, c.z] : [(c.x + you.pos.x) / 2, (c.z + you.pos.z) / 2];
      onFrame(at, COACH_CLOSE_UP);
    } else if (before.current) {
      const back = before.current;
      before.current = null;
      goHome.current = true;
      if (!you.locked) onFrame(back.target, back.distance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once each time a talk starts or ends
  }, [talking]);

  const v = useMemo(() => ({ right: new THREE.Vector3(), front: new THREE.Vector3(), to: new THREE.Vector3() }), []);
  useFrame((state, delta) => {
    const o = g.current;
    if (!o) return;
    const dt = Math.min(delta, 0.1);
    const L = live.current;
    const controls = state.controls as unknown as { target: THREE.Vector3 } | null;
    if (!L.talking && controls) camView.current = { target: [controls.target.x, controls.target.z], distance: state.camera.position.distanceTo(controls.target) };
    // 0. A talk just ended: back to their post (never in the middle of one).
    if (goHome.current && !L.comes && !L.talking && !plan.current) {
      goHome.current = false;
      if (pos.current.distanceTo(COACH_POST) > 1) plan.current = { pts: findPath(L.nav, pos.current, COACH_POST.clone()), i: 1, home: true };
    }
    // 1. News, and you've stopped (and aren't off to a class): over to beside you.
    if (L.comes && !L.talking && !plan.current && !you.moving && !you.locked && state.clock.elapsedTime - tried.current > 1.5) {
      tried.current = state.clock.elapsedTime;
      v.right.setFromMatrixColumn(state.camera.matrixWorld, 0).setY(0).normalize();
      v.front.copy(state.camera.position).sub(you.pos).setY(0).normalize();
      const spot = (side: number) => v.to.copy(you.pos).addScaledVector(v.right, 1.7 * side).addScaledVector(v.front, 0.9);
      if (!free(L.nav, spot(1).x, v.to.z)) spot(-1);
      if (still || pos.current.distanceTo(v.to) < 0.6) {
        pos.current.copy(v.to);
        L.onTalk();
      } else plan.current = { pts: findPath(L.nav, pos.current, v.to.clone()), i: 1 };
    }
    // 2. On the way (if you've walked off meanwhile, they wait for you to stop, then come again).
    let heading: number | null = null;
    const p = plan.current;
    if (p) {
      let budget = COACH_PACE * dt;
      while (budget > 0 && p.i < p.pts.length) {
        const t = p.pts[p.i]!;
        const dx = t.x - pos.current.x;
        const dz = t.z - pos.current.z;
        const d = Math.hypot(dx, dz);
        if (d > 1e-3) heading = Math.atan2(dx, dz);
        if (d <= budget) {
          pos.current.set(t.x, 0, t.z);
          budget -= d;
          p.i++;
        } else {
          pos.current.x += (dx / d) * budget;
          pos.current.z += (dz / d) * budget;
          budget = 0;
        }
      }
      if (p.i >= p.pts.length) {
        plan.current = null;
        if (!p.home && L.comes && pos.current.distanceTo(you.pos) <= COACH_NEAR) L.onTalk();
      }
    }
    // 3. Facing the way they walk, or you when they're close (and you them, while you talk).
    const moving = !!plan.current;
    you.lookAt = L.talking && pos.current.distanceTo(you.pos) < 6 ? pos.current : null;
    if (heading == null && pos.current.distanceTo(you.pos) < 8) heading = Math.atan2(you.pos.x - pos.current.x, you.pos.z - pos.current.z);
    if (heading != null) o.rotation.y = turnTo(o.rotation.y, heading, 1 - Math.exp(-dt * 10));
    o.position.set(pos.current.x, 0, pos.current.z);
    person.current?.play(moving ? "walk" : "idle", moving ? 1.15 : 1);
    const atHome = !moving && pos.current.distanceTo(COACH_POST) < 1;
    if (atHome !== homeRef.current) {
      homeRef.current = atHome;
      setHome(atHome);
    }
  });

  return (
    <group
      ref={g}
      position={pos.current.toArray()}
      onClick={(e: ThreeEvent<MouseEvent>) => e.delta < 6 && talk(e)}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        pointer.onPointerOver(e);
        setPointed(true);
      }}
      onPointerOut={() => {
        pointer.onPointerOut();
        setPointed(false);
      }}
      name="coach"
    >
      <Suspense fallback={null}>
        {/* Clothes are put on once per character: another coach is another one. */}
        <KitPerson key={`${who.variant}-${who.top}`} ref={person} variant={who.variant} dress={dress} action="idle" scale={3.2} />
      </Suspense>
      {/* Their name, with a "!" when they have news; a tap on it talks too. At rest it's out of sight, but still there
          for the keyboard. */}
      <Label position={[0, 2.75, 0]} zIndexRange={[28, 25]}>
        <button
          type="button"
          onClick={() => talk()}
          data-rank={named ? 4 : undefined}
          aria-label={news ? `Coach ${who.name} has news: talk` : `Talk to Coach ${who.name}`}
          className={cx("scene-chip pointer-events-auto cursor-pointer gap-1.5 hover:border-brand!", !named && "scene-chip-rest")}
        >
          Coach {who.name}
          {news && !talking && <span className="grid size-4 place-items-center rounded-full bg-bell text-[10px] font-bold text-night">!</span>}
        </button>
      </Label>
    </group>
  );
}
