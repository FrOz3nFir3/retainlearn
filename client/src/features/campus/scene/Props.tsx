// The campus's other things (the prototype's scene/Props.jsx and their places from data/campus.js): trees round the
// plots and a belt of them beyond the road, street lamps that light up after dark, the clock tower (your streak, and
// the bell once today's timetable is done), your coach's office (your report card) and hills on the horizon. With
// reduced motion, flags hold still and the bell doesn't swing.
import { Suspense, useEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { pointer } from "./Building.tsx";
import { onSkyLight } from "./daylight.ts";
import { KitTrees } from "./kit.tsx";
import { Label } from "./Label.tsx";
import { COLORS, prefersReducedMotion, useLabelTexture } from "./util.ts";

type XZ = readonly [number, number];
const polar = (deg: number, r: number): XZ => [Math.round(Math.cos((deg * Math.PI) / 180) * r * 10) / 10, Math.round(Math.sin((deg * Math.PI) / 180) * r * 10) / 10];
const BASE_HALF = 42;

// Your coach's office, just off the quad on the left as you come in: door, where you stand to go in; coach, where they
// wait beside it. Plots never come closer than 21 m from the middle, so it stays clear of any subject added later.
export const OFFICE = { pos: [-6.4, 15.2] as XZ, rot: Math.PI / 2, door: [-2.6, 15.2] as XZ, coach: [-2.9, 17.6] as XZ };
const LAMPS = [20, 100, 200, 250, 290, 330].map((deg) => polar(deg, 13.2));
const TREES: (readonly [number, number, number?])[] = [
  [5, 5, 0.9], [5, -5, 0.85], [-5, -5, 0.9],
  [0, -25], [-4, -31, 1.1], [6, -31], [33, -8, 1.1], [-35, -6], [-33, 21, 1.1], [23, 23], [-4, 34],
  [34, 24, 1.2], [-35, -25, 1.1], [34, -29], [-24, -34, 1.2], [16, 36], [-26, 34], [36, 3, 0.9],
  [14.9, -4, 0.8], [11, 11, 0.85], [-12.7, 8.9, 0.8], [-15.3, -2.7, 0.85], [3, -15.5, 0.8],
]; // prettier-ignore

// Trees grow everywhere but near the plots in use; a bigger lot gets trees in its new outer band too.
function treeSpots(avoid: readonly XZ[], half: number) {
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
  return [...TREES, ...extra].filter(([x, z]) => avoid.every(([ax, az]) => Math.hypot(x - ax, z - az) > 10.5));
}
// A belt of trees just outside the road, thick near it and thinning out, so the campus sits in a clearing. The same
// every visit (each spot's chance comes from where it is).
function beltSpots(half: number) {
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

export function Trees({ avoid, half }: { avoid: readonly XZ[]; half: number }) {
  const spots = useMemo(() => [...treeSpots([...avoid, OFFICE.pos], half), ...beltSpots(half)], [avoid, half]);
  return (
    <Suspense fallback={null}>
      <KitTrees spots={spots} />
    </Suspense>
  );
}

// Street lamps round the quad. After dark they light up and throw a warm pool of light on the ground: a glow drawn on,
// not a real light, so the night costs nothing extra to draw.
const LAMP_HEAD = new THREE.MeshStandardMaterial({ color: "#FFF4D6", emissive: "#FFE2A0", emissiveIntensity: 0.4 });
const POOL = new THREE.MeshBasicMaterial({ color: "#FFD58A", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, visible: false });
// A soft round spot, bright in the middle and fading to nothing at the edge.
function poolTexture() {
  const canvas = Object.assign(document.createElement("canvas"), { width: 64, height: 64 });
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "#FFFFFF");
    g.addColorStop(0.45, "#8A8A8A");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}
export function Lamps() {
  useEffect(
    () =>
      onSkyLight((_, lights) => {
        LAMP_HEAD.emissiveIntensity = 0.4 + lights * 2;
        POOL.opacity = lights * 0.55;
        POOL.visible = lights > 0.02;
        if (!POOL.alphaMap) {
          POOL.alphaMap = poolTexture();
          POOL.needsUpdate = true;
        }
      }),
    [],
  );
  return (
    <>
      {LAMPS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position-y={1.4} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 2.8, 8]} />
            <meshStandardMaterial color="#5B5F8F" />
          </mesh>
          <mesh position-y={2.9} material={LAMP_HEAD}>
            <sphereGeometry args={[0.28, 16, 12]} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={0.06} material={POOL}>
            <circleGeometry args={[3.4, 32]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function ClockFace({ rotation }: { rotation: number }) {
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  useFrame(() => {
    const now = new Date();
    if (minute.current) minute.current.rotation.z = -(now.getMinutes() / 60) * Math.PI * 2;
    if (hour.current) hour.current.rotation.z = -(((now.getHours() % 12) + now.getMinutes() / 60) / 12) * Math.PI * 2;
  });
  return (
    <group rotation-y={rotation}>
      <group position={[0, 0, 1.47]}>
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.95, 0.95, 0.1, 32]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position-z={0.03}>
          <torusGeometry args={[0.95, 0.09, 8, 32]} />
          <meshStandardMaterial color={COLORS.indigo} />
        </mesh>
        <group ref={hour} position-z={0.08}>
          <mesh position-y={0.25}>
            <boxGeometry args={[0.11, 0.5, 0.04]} />
            <meshBasicMaterial color={COLORS.ink} />
          </mesh>
        </group>
        <group ref={minute} position-z={0.1}>
          <mesh position-y={0.35}>
            <boxGeometry args={[0.07, 0.72, 0.04]} />
            <meshBasicMaterial color={COLORS.ink} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// Today, in the middle of the campus: four clock faces with your time, its flag amber while your streak is alive, and
// the bell (the top swings) once today's timetable is done, rung once a day when you come back to see it. A tap says
// where the bell stands (onTap).
export function ClockTower({ streak, kept, rung, onTap }: { streak: number; kept: boolean; rung: boolean; onTap: () => void }) {
  const top = useRef<THREE.Group>(null);
  const flag = useRef<THREE.Group>(null);
  const still = useMemo(prefersReducedMotion, []);
  const bellAt = useBellAt(rung);
  const flagShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(1.9, -0.5);
    s.lineTo(0, -1);
    s.closePath();
    return s;
  }, []);
  useFrame(({ clock }) => {
    if (still) return;
    const t = (performance.now() - bellAt) / 1000;
    if (top.current) top.current.rotation.z = bellAt && t < 2.6 ? Math.sin(t * 16) * 0.07 * (1 - t / 2.6) : 0;
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2) * 0.3;
  });
  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta < 6) onTap();
      }}
      {...pointer}
    >
      <mesh position-y={0.25} receiveShadow>
        <boxGeometry args={[5, 0.5, 5]} />
        <meshStandardMaterial color="#DCE0F2" />
      </mesh>
      <mesh position-y={5.5} castShadow receiveShadow>
        <boxGeometry args={[2.8, 10, 2.8]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
      </mesh>
      {[3.6, 7.2].map((y) => (
        <mesh key={y} position-y={y}>
          <boxGeometry args={[2.95, 0.18, 2.95]} />
          <meshStandardMaterial color={COLORS.band} />
        </mesh>
      ))}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r) => (
        <group key={r} position-y={8.8}>
          <ClockFace rotation={r} />
        </group>
      ))}
      <mesh position-y={10.7} castShadow>
        <boxGeometry args={[3.3, 0.45, 3.3]} />
        <meshStandardMaterial color={COLORS.indigoDeep} />
      </mesh>
      <group ref={top} position-y={10.9}>
        <mesh position-y={1.6} rotation-y={Math.PI / 4} castShadow>
          <coneGeometry args={[2.35, 3.2, 4]} />
          <meshStandardMaterial color={COLORS.indigo} roughness={0.7} />
        </mesh>
        <mesh position-y={4.1} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.4, 6]} />
          <meshStandardMaterial color="#C9CCE0" />
        </mesh>
        <group ref={flag} position-y={5.2}>
          <mesh castShadow>
            <shapeGeometry args={[flagShape]} />
            <meshStandardMaterial color={streak > 0 ? COLORS.amber : COLORS.cold} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      <Label position={[0, 17.2, 0]}>
        {/* Ranked lowest for the declutter: the top bar shows your streak too. */}
        <div className={`scene-chip ${kept ? "scene-chip-bell" : ""}`} data-rank="0">
          {streak > 0 ? `${streak}-day streak` : "No streak yet"}
        </div>
      </Label>
    </group>
  );
}

// When the bell rang: once a day, the first time you see the campus with today's timetable done.
function useBellAt(rung: boolean): number {
  const at = useRef(0);
  if (rung && !at.current) {
    const key = `retainlearn:bell:${new Date().toDateString()}`;
    try {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        at.current = performance.now() + 900; // after the campus has drawn
      }
    } catch {
      // Storage blocked: no bell, rather than one on every visit.
    }
  }
  return at.current;
}

// Your coach's office, by the quad: your report card is kept here, and the coach waits by its door between talks. The
// sign over the door has their name, and the roof is their training top's colour, so it's theirs. A tap opens it.
export function CoachOffice({ who, onOpen }: { who: { name: string; top: string }; onOpen: () => void }) {
  const sign = useLabelTexture(`COACH ${who.name.toUpperCase()}`, { bg: who.top, fg: COLORS.ink, width: 768, height: 150 });
  const roof = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-2.5, 0);
    s.lineTo(2.5, 0);
    s.lineTo(0, 1.5);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 6.6, bevelEnabled: false }).translate(0, 0, -3.3);
  }, []);
  useEffect(() => () => roof.dispose(), [roof]);
  return (
    <group position={[OFFICE.pos[0], 0, OFFICE.pos[1]]}>
      <group
        rotation-y={OFFICE.rot}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta < 6) onOpen();
        }}
        {...pointer}
      >
        <mesh position-y={0.15} receiveShadow>
          <boxGeometry args={[6.6, 0.3, 5]} />
          <meshStandardMaterial color="#DCE0F2" />
        </mesh>
        <mesh position-y={1.8} castShadow receiveShadow>
          <boxGeometry args={[6, 3, 4.4]} />
          <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
        </mesh>
        <mesh position-y={0.5}>
          <boxGeometry args={[6.04, 0.3, 4.44]} />
          <meshStandardMaterial color={COLORS.band} />
        </mesh>
        <mesh geometry={roof} position-y={3.3} rotation-y={Math.PI / 2} castShadow>
          <meshStandardMaterial color={who.top} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.22, 2.22]}>
          <boxGeometry args={[1.1, 1.84, 0.08]} />
          <meshStandardMaterial color={COLORS.indigoDeep} roughness={0.6} />
        </mesh>
        {sign && (
          <mesh position={[0, 2.5, 2.23]}>
            <planeGeometry args={[2.6, 0.5]} />
            <meshBasicMaterial map={sign} toneMapped={false} />
          </mesh>
        )}
        {[-1.95, 1.95].map((x) => (
          <mesh key={x} position={[x, 1.85, 2.21]}>
            <planeGeometry args={[1.05, 0.95]} />
            <meshStandardMaterial color={COLORS.glass} roughness={0.3} />
          </mesh>
        ))}
        {[-1.1, 1.1].map((z) => (
          <mesh key={z} position={[-3.01, 1.85, z]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[1.05, 0.95]} />
            <meshStandardMaterial color={COLORS.glass} roughness={0.3} />
          </mesh>
        ))}
      </group>
      <Label position={[0, 6.3, 0]}>
        <div className="scene-chip" data-rank="1">
          <span className="font-semibold">Report card</span>
        </div>
      </Label>
    </group>
  );
}

// Low hills on the horizon, all one mesh: faceted, in a soft green the fog turns to the sky's colour with distance.
function hillSpots(half: number) {
  return Array.from({ length: 13 }, (_, i) => {
    const g = Math.abs((Math.sin(i * 91.7 + 3.1) * 43758.5453) % 1);
    const a = (i / 13) * Math.PI * 2 + g * 0.35;
    const r = half + 78 + g * 30;
    return [Math.cos(a) * r, Math.sin(a) * r, 26 + g * 18, 9 + ((g * 5.3) % 1) * 14, 16 + ((g * 2.9) % 1) * 10, -a - Math.PI / 2] as const;
  });
}
export function Hills({ half }: { half: number }) {
  const geometry = useMemo(
    () =>
      mergeGeometries(
        hillSpots(half).map(([x, z, w, h, d, turn]) =>
          new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2)
            .scale(w / 2, h, d / 2)
            .rotateY(turn)
            .translate(x, -0.5, z),
        ),
      ),
    [half],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={COLORS.hill} roughness={1} flatShading />
    </mesh>
  );
}
