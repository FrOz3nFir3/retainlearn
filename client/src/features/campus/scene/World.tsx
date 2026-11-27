// The 3D campus (the prototype's scene/Campus.jsx), its own chunk, loaded only for a signed-in player in 3D: your
// subjects' buildings round the quad, the clock tower in the middle, your coach's office, the fountain once you've won
// it, trees, lamps, the bus and hills, under the sky of your time of day; students about the quad, you, and your coach
// (People.tsx). The map: drag to move, pinch or scroll to zoom, right-drag or two fingers to turn; the HUD's map
// buttons send zoom, turn and home (command). A tap on the ground walks you there; a tap on a building walks you over
// and in. Labels are DOM, in a layer over the canvas, and the less important of two that land on each other fades
// until they're apart; each place's label is its link for the keyboard and screen readers. It pauses while the tab is
// hidden; phones get a lower resolution and smaller shadows. The models start loading as this chunk arrives (the
// campus's skeleton asks for it early).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MapControls } from "@react-three/drei";
import * as THREE from "three";
import type { Campus } from "@retainlearn/core";
import type { Coach as CoachLook } from "../coach.ts";
import type { MapCommand, WorldView } from "../view.ts";
import { Building, FreePlot } from "./Building.tsx";
import { floorsInside } from "./Interior.tsx";
import type { Inside } from "./Interior.tsx";
import { STOREY, preloadKit } from "./kit.tsx";
import { labelLayer } from "./labelLayer.ts";
import { layoutCampus, occupiedPoints, slug } from "./layout.ts";
import type { CampusBuilding } from "./layout.ts";
import { navFor } from "./nav.ts";
import { Coach, Students, You } from "./People.tsx";
import type { Door } from "./People.tsx";
import { OFFICE } from "./places.ts";
import { Bus, BusStop, ClockTower, CoachOffice, Fountain, Hills, Lamps, Trees } from "./Props.tsx";
import { Sky } from "./Sky.tsx";
import { COLORS, doorPoint, facingCenter, prefersReducedMotion, roundedRectShape } from "./util.ts";
import { you, walkTo } from "./you.ts";

// The coach, as the HUD has them (Coach.tsx's useCoach): who they are, whether they have news and are coming over
// with it, whether you're talking, and how to start a talk.
export type CoachState = { who: CoachLook; news: boolean; comes: boolean; talking: boolean; onTalk: () => void };
// A walk to a class's building before the class (the timetable's Start): its subject, and what follows (n: a new one).
export type ClassWalk = { category: string; then: () => void; n: number };

export type WorldProps = {
  campus: Campus;
  // What the world stands behind (view.ts): the campus, the subjects list, a subject's building or a set's room;
  // category: the building a room is in.
  view: WorldView;
  category: string | null;
  // Inside a building: the page of its classrooms on show, and what its rooms do (Interior.tsx).
  inside: Inside | null;
  coach: CoachState;
  hour: number;
  command: MapCommand | null;
  walk: ClassWalk | null;
  // A class just finished in this subject (its name): its building sparkles.
  celebrate: string | null;
  onEnter: (b: CampusBuilding) => void;
  onAddSubject: () => void;
  onReportCard: () => void;
  onTower: () => void;
  onRing: () => void;
  // The GPU gave up the canvas (a driver reset, or a phone short of memory): the campus goes 2D, offering 3D again.
  onLost: () => void;
};

preloadKit();

const UP = new THREE.Vector3(0, 1, 0);
const isNarrow = () => typeof window !== "undefined" && window.innerWidth < 768;
const HOME_TARGET = new THREE.Vector3(7, 0, 7);
// The campus grows a ring at a time: the view, its limits, the fog and the shadows grow with it. 42 is half the lot's
// width with the first two rings.
const grow = (half: number) => half / 42;
// Phones are tall and narrow: pull back so the whole campus fits the width.
const homeOffset = (half: number) => new THREE.Vector3(66, 64, 66).multiplyScalar((isNarrow() ? 1.75 : 1) * grow(half));

// A tap on the ground (not a drag): you walk there.
const onGround = (e: ThreeEvent<MouseEvent>) => {
  if (e.delta >= 6) return;
  e.stopPropagation();
  walkTo({ to: [e.point.x, e.point.z], mark: true });
};

// The road's centre line, just outside the lot: the bus drives it, and its dashes are drawn along it.
function roadLine(half: number): THREE.CatmullRomCurve3 {
  const line = half * 2 + 7;
  const pts = roundedRectShape(line, line, 9.5)
    .getSpacedPoints(Math.round(160 * grow(half)))
    .slice(0, -1)
    .map((v) => new THREE.Vector3(v.x, 0, -v.y));
  return new THREE.CatmullRomCurve3(pts, true);
}

const DASH = new THREE.PlaneGeometry(0.28, 1.8).rotateX(-Math.PI / 2);
function Grounds({ half, curve }: { half: number; curve: THREE.CatmullRomCurve3 }) {
  const lot = useMemo(() => roundedRectShape(half * 2, half * 2, 7), [half]);
  const road = useMemo(() => {
    const s = roundedRectShape(half * 2 + 12, half * 2 + 12, 12);
    s.holes.push(roundedRectShape(half * 2 + 2, half * 2 + 2, 7));
    return s;
  }, [half]);
  // The centre line's dashes: one instanced mesh for them all, lit like the road (so it darkens at night).
  const dashes = useRef<THREE.InstancedMesh>(null);
  const count = Math.round(70 * grow(half));
  useLayoutEffect(() => {
    const mesh = dashes.current;
    if (!mesh) return;
    const at = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const p = curve.getPointAt(i / count);
      const tan = curve.getTangentAt(i / count);
      at.position.set(p.x, 0.03, p.z);
      at.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
      at.updateMatrix();
      mesh.setMatrixAt(i, at.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [curve, count]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow onClick={onGround}>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color={COLORS.meadow} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01} receiveShadow onClick={onGround}>
        <shapeGeometry args={[lot]} />
        <meshStandardMaterial color={COLORS.lot} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.015} receiveShadow onClick={onGround}>
        <shapeGeometry args={[road]} />
        <meshStandardMaterial color={COLORS.road} />
      </mesh>
      <instancedMesh key={count} ref={dashes} args={[DASH, undefined, count]} receiveShadow>
        <meshStandardMaterial color="#FFFFFF" />
      </instancedMesh>
    </group>
  );
}

// The quad: a lawn in the middle with a path round it and across it, and a path out to each building's door (the first
// two rings; further out a short front path, since a long one would run under the buildings between).
function Quad({ buildings }: { buildings: readonly CampusBuilding[] }) {
  const spokes = useMemo(
    () =>
      buildings.map((b) => {
        const door = doorPoint(b, 0.7);
        const dir = door.clone().normalize();
        const start = b.ring >= 2 ? door.clone().addScaledVector(dir, -5) : dir.clone().multiplyScalar(12);
        return { mid: start.clone().add(door).multiplyScalar(0.5), len: Math.max(0.1, door.distanceTo(start)), rot: Math.atan2(dir.x, dir.z) };
      }),
    [buildings],
  );
  return (
    <group onClick={onGround}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial color={COLORS.lawn} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.035} receiveShadow>
        <ringGeometry args={[10, 12.4, 72]} />
        <meshStandardMaterial color={COLORS.path} />
      </mesh>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, r]} position-y={0.04} receiveShadow>
          <planeGeometry args={[1.8, 20]} />
          <meshStandardMaterial color={COLORS.path} />
        </mesh>
      ))}
      {spokes.map((s, i) => (
        <group key={i} position={[s.mid.x, 0.036, s.mid.z]} rotation-y={s.rot}>
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[2.6, s.len]} />
            <meshStandardMaterial color={COLORS.path} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// While you walk, the camera keeps you on screen (until you drag the map yourself).
const onScreen = new THREE.Vector3();
function keepInView(camera: THREE.Camera, target: THREE.Vector3, dt: number) {
  onScreen.copy(you.pos).setY(1.5).project(camera);
  const [xMax, yMin, yMax] = isNarrow() ? [0.6, -0.2, 0.62] : [0.55, -0.45, 0.6];
  if (Math.abs(onScreen.x) <= xMax && onScreen.y >= yMin && onScreen.y <= yMax) return;
  const k = 1 - Math.exp(-dt * 2.5);
  const dx = (you.pos.x - target.x) * k;
  const dz = (you.pos.z - target.z) * k;
  target.x += dx;
  target.z += dz;
  camera.position.x += dx;
  camera.position.z += dz;
}

// The camera: the HUD's map buttons (home, zoom, turn) move it smoothly to a goal (at once with reduced motion), and so
// does a look: a place whose label takes keyboard focus, or the coach's talk (the camera comes to it, from where it is,
// at most that far away). While you walk it keeps you on screen. A drag of your own cancels all that. The point it
// looks at stays on the lot.
// exact: at that distance (the coach's close-up, and your view back after it), else at most that far (a focused label).
// Inside a building (shot), the camera frames its cutaway, and back out on the campus it steps back from that building.
export type Look = { at: readonly [number, number]; distance: number; exact?: boolean; n: number };
type Shot = { b: CampusBuilding; floors: number; roomOpen: boolean };
// Framing for the cutaway: in front of the building, low and nearly level (so each floor's slab doesn't hide the boards
// on the back walls below it), a little to one side so the panels don't cover it. Wide screens: the lobby panel is on
// the left (the building right of centre); a classroom's panel is on the right (the building left of centre). Phones:
// the lobby sits on top and sheets come up from the bottom, so the aim is above the building (it lands mid-screen).
function interiorGoal({ b, floors, roomOpen }: Shot) {
  const rot = facingCenter(b.pos);
  const n = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot));
  const right = new THREE.Vector3(n.z, 0, -n.x);
  const narrow = isNarrow();
  const H = floors * STOREY + 0.3;
  const target = new THREE.Vector3(b.pos[0], H / 2 + (narrow ? (roomOpen ? 9 : 4.5) : 0.2), b.pos[1]).add(right.multiplyScalar(narrow ? 0 : roomOpen ? 4.6 : -3.4));
  const dist = 20 + b.size[0] * 1.15 + floors * 2.4 + (narrow ? 30 : 0);
  return { target, position: target.clone().add(n.multiplyScalar(dist)).add(new THREE.Vector3(0, 2.5 + floors * 0.7, 0)) };
}
function CameraRig({ half, command, look, shot }: { half: number; command: MapCommand | null; look: Look | null; shot: Shot | null }) {
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void } | null;
  const camera = useThree((s) => s.camera);
  const goal = useRef<{ target: THREE.Vector3; position: THREE.Vector3 } | null>(null);
  const instant = useMemo(prefersReducedMotion, []);

  // Into a building (or a room in it, or another page of its floors), and back out of it.
  const lastInside = useRef<CampusBuilding | null>(null);
  const shotKey = shot ? `${shot.b.id}:${shot.floors}:${shot.roomOpen}` : null;
  useEffect(() => {
    if (!controls) return;
    if (shot) {
      goal.current = interiorGoal(shot);
      lastInside.current = shot.b;
      return;
    }
    const was = lastInside.current;
    if (!was) return;
    lastInside.current = null;
    const target = new THREE.Vector3(was.pos[0], 0, was.pos[1]);
    const offset = camera.position.clone().sub(controls.target);
    offset.y = Math.max(offset.y, offset.length() * 0.62);
    goal.current = { target, position: target.clone().add(offset.setLength(64)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- by the shot's key, not each render's object
  }, [shotKey, controls]);

  useEffect(() => {
    if (!controls) return;
    controls.target.copy(HOME_TARGET);
    controls.update();
    const stop = () => {
      goal.current = null;
      you.follow = false;
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useEffect(() => {
    if (!controls || !look) return;
    const target = new THREE.Vector3(look.at[0], 0, look.at[1]);
    const offset = camera.position.clone().sub(controls.target);
    const distance = look.exact ? look.distance : Math.min(offset.length(), look.distance);
    offset.setLength(distance);
    offset.y = Math.max(offset.y, distance * 0.6);
    goal.current = { target, position: target.clone().add(offset) };
  }, [look, controls, camera]);

  useEffect(() => {
    if (!controls || !command) return;
    if (command.kind === "home") {
      goal.current = { target: HOME_TARGET.clone(), position: HOME_TARGET.clone().add(homeOffset(half)) };
      return;
    }
    const base = goal.current ?? { target: controls.target.clone(), position: camera.position.clone() };
    const offset = base.position.clone().sub(base.target);
    if (command.kind === "zoom") offset.setLength(THREE.MathUtils.clamp(offset.length() * command.value, 20, (isNarrow() ? 230 : 140) * grow(half)));
    if (command.kind === "rotate") offset.applyAxisAngle(UP, command.value);
    goal.current = { target: base.target.clone(), position: base.target.clone().add(offset) };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a command runs once, with the layout of the moment
  }, [command, controls, camera]);

  useFrame((_, dt) => {
    if (!controls) return;
    const g = goal.current;
    if (g) {
      const k = instant ? 1 : 1 - Math.exp(-dt * 3.4);
      controls.target.lerp(g.target, k);
      camera.position.lerp(g.position, k);
      if (camera.position.distanceToSquared(g.position) < 0.004) goal.current = null;
    } else if (you.follow && you.moving) {
      keepInView(camera, controls.target, instant ? 1 : dt);
    }
    const t = controls.target;
    const edge = half + 2;
    const cx = THREE.MathUtils.clamp(t.x, -edge, edge);
    const cz = THREE.MathUtils.clamp(t.z, -edge, edge);
    if (cx !== t.x || cz !== t.z) {
      camera.position.x += cx - t.x;
      camera.position.z += cz - t.z;
      t.set(cx, t.y, cz);
    }
  });
  return null;
}

// Labels that land on each other on screen fade out, the less important first, until they're apart again, as games do
// with overlapping name tags. By data-rank: a door's "Go into …" 5, the coach 4, you 3, places (your subjects, the
// report card) 1, and 0 for the free plot and the clock tower's streak (the top bar has it too). Checked every few
// frames: a handful of labels.
type Box = { left: number; right: number; top: number; bottom: number };
const overlap = (a: Box, b: Box) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
function Declutter() {
  const tick = useRef(0);
  useFrame(() => {
    if (++tick.current % 4 || !labelLayer.current) return;
    const items = [...labelLayer.current.querySelectorAll<HTMLElement>("[data-rank]")]
      .filter((e) => e.offsetParent)
      .map((e, i) => ({ e, i, k: Number(e.dataset.rank), r: e.getBoundingClientRect() }))
      .sort((a, b) => b.k - a.k || a.i - b.i);
    const kept: typeof items = [];
    for (const it of items) {
      const culled = kept.some((o) => overlap(o.r, it.r));
      if ((it.e.dataset.culled === "true") !== culled) it.e.dataset.culled = String(culled);
      if (!culled) kept.push(it);
    }
  });
  return null;
}

// Whether the page can be seen: a hidden tab draws nothing.
function useVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || document.visibilityState === "visible");
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return visible;
}

export default function World({ campus, view, category, inside, coach, hour, command, walk, celebrate, onEnter, onAddSubject, onReportCard, onTower, onRing, onLost }: WorldProps) {
  const layout = useMemo(() => layoutCampus(campus.subjects), [campus.subjects]);
  const onCampus = view.kind === "campus";
  // The building you're in, behind its subject's page or one of its classrooms, and the camera's shot of it.
  const insideId = inside ? slug(view.kind === "building" ? view.category : (category ?? "")) : null;
  const insideOf = layout.buildings.find((b) => b.id === insideId) ?? null;
  const shot = insideOf && inside ? { b: insideOf, floors: floorsInside(inside.page), roomOpen: view.kind === "room" } : null;
  // Inside a building, the view into its cutaway stays clear: no trees between it and the quad.
  const avoid = useMemo(() => {
    const points = occupiedPoints(layout);
    if (!insideOf) return points;
    const front = doorPoint(insideOf, 9);
    return [...points, [front.x, front.z] as const, [front.x * 0.55, front.z * 0.55] as const];
  }, [layout, insideOf]);
  const fountain = campus.player.unlocks.includes("fountain");
  const nav = navFor(layout, fountain);
  const visible = useVisible();
  const narrow = isNarrow();
  const g = grow(layout.half);
  const root = useRef<HTMLDivElement>(null);
  // The GPU giving the canvas up while the world is open; not the canvas let go as the world closes (three.js gives up
  // its own context then, which raises the same event).
  const open = useRef(true);
  useLayoutEffect(() => {
    open.current = true;
    return () => void (open.current = false);
  }, []);
  const [look, setLook] = useState<Look | null>(null);
  const lookAt = (at: readonly [number, number], distance = 64, exact = false) => setLook({ at, distance, exact, n: performance.now() });
  const road = useMemo(() => roadLine(layout.half), [layout.half]);
  const rung = campus.timetable.length > 0 && campus.timetable.every((p) => p.done);
  const mastery = campus.subjects.length ? campus.subjects.reduce((sum, s) => sum + s.mastery, 0) / campus.subjects.length : 0;

  // Going in: you come back out of this door.
  const enter = (b: CampusBuilding) => {
    you.inside = b.id;
    onEnter(b);
  };
  const openOffice = () => {
    you.inside = "office";
    onReportCard();
  };
  const doors: Door[] = [
    ...layout.buildings.map((b) => ({ id: b.id, name: b.name, at: doorPoint(b, 1.9), go: () => enter(b) })),
    { id: "office", name: "the coach's office", say: "See your report card", at: new THREE.Vector3(OFFICE.door[0], 0, OFFICE.door[1]), go: openOffice },
  ];
  // The keys steer you while nothing else has focus, or one of the world's own labels does.
  const steerable = () => {
    const el = document.activeElement;
    return !el || el === document.body || !!root.current?.contains(el);
  };

  // A class's Start: you walk to its building first (straight to the class if it isn't on your campus).
  useEffect(() => {
    if (!walk) return;
    const b = layout.buildings.find((x) => x.id === slug(walk.category));
    if (!b) return walk.then();
    walkTo({
      door: b.id,
      locked: true,
      then: () => {
        you.inside = b.id;
        walk.then();
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per Start
  }, [walk?.n]);

  return (
    <div ref={root} className="absolute inset-0 isolate overflow-clip motion-safe:transition-opacity motion-safe:duration-500 motion-safe:starting:opacity-0">
      <Canvas
        shadows="percentage"
        flat
        dpr={narrow ? [1, 1.5] : [1, 2]}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: 30, position: HOME_TARGET.clone().add(homeOffset(layout.half)).toArray(), near: 1, far: 700 * g }}
        onPointerMissed={() => (document.body.style.cursor = "")}
        onCreated={({ gl, scene, camera }) => {
          gl.domElement.addEventListener("webglcontextlost", () => open.current && onLost(), { once: true });
          // In development only: the browser checks find things on screen and read draw calls.
          if (import.meta.env.DEV) Object.assign(window, { __gl: gl, __scene: scene, __camera: camera });
        }}
        aria-hidden="true"
      >
        <Sky hour={hour} g={g} narrow={narrow} shadows />
        <Grounds half={layout.half} curve={road} />
        <Quad buildings={layout.buildings} />
        {layout.buildings.map((b) => (
          <Building
            key={b.id}
            b={b}
            labels={!insideId}
            inside={b.id === insideId ? inside : null}
            celebrate={b.name === celebrate}
            onEnter={enter}
            onTap={onCampus ? (x) => walkTo({ door: x.id, then: () => enter(x) }) : enter}
            onFocus={lookAt}
          />
        ))}
        {/* Inside a building, the campus's own things step aside: the tower would stand between the camera and the
            cutaway (and catch its taps), and their labels would crowd the rooms'. */}
        {!insideId && layout.freePlot && <FreePlot plot={layout.freePlot} onAdd={onAddSubject} onFocus={lookAt} />}
        {!insideId && <ClockTower streak={campus.player.streak.count} kept={campus.player.streak.keptToday} rung={rung} onTap={onTower} onRing={onRing} />}
        {fountain && <Fountain />}
        {!insideId && <CoachOffice who={coach.who} onOpen={openOffice} onTap={onCampus ? () => walkTo({ door: "office", then: openOffice }) : openOffice} onFocus={lookAt} />}
        <Trees avoid={avoid} half={layout.half} />
        {!insideId && <Lamps />}
        <Bus curve={road} half={layout.half} />
        <BusStop half={layout.half} />
        <Hills half={layout.half} />
        {!insideId && <Students buildings={layout.buildings} mastery={mastery} />}
        <You nav={nav} doors={doors} steerable={steerable} active={onCampus} />
        {onCampus && <Coach who={coach.who} nav={nav} comes={coach.comes} news={coach.news} talking={coach.talking} onTalk={coach.onTalk} onFrame={(at, distance) => lookAt(at, distance, true)} />}
        <Declutter />
        <MapControls makeDefault enableDamping dampingFactor={0.08} minDistance={18} maxDistance={(narrow ? 230 : 140) * g} minPolarAngle={0.5} maxPolarAngle={insideId ? 1.42 : 1.1} />
        <CameraRig half={layout.half} command={command} look={look} shot={shot} />
      </Canvas>
      {/* The places' labels, and their links (overflow: clip, so focusing one never scrolls the layer). */}
      <div ref={labelLayer} role="group" aria-label="Places on your campus" className="pointer-events-none absolute inset-0 overflow-clip" />
    </div>
  );
}
