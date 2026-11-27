// The campus's other things (the prototype's scene/Props.jsx and their places from data/campus.js): trees round the
// plots and a belt of them beyond the road, street lamps that light up after dark, the school bus and its stop, the
// clock tower (your streak, and the bell once today's timetable is done), the fountain you unlock, your coach's office
// (your report card) and hills on the horizon. With reduced motion, flags hold still, the bell doesn't swing and the
// bus waits at its stop.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { pointer } from "./Building.tsx";
import { onSkyLight } from "./daylight.ts";
import { KitTrees } from "./kit.tsx";
import { Label, PlaceLink } from "./Label.tsx";
import { FOUNTAIN, LAMPS, NOTICEBOARD, OFFICE, beltSpots, busStop, treeSpots } from "./places.ts";
import type { XZ } from "./places.ts";
import { COLORS, prefersReducedMotion, useLabelTexture } from "./util.ts";

export function Trees({ avoid, half }: { avoid: readonly XZ[]; half: number }) {
  const spots = useMemo(() => [...treeSpots(avoid, half), ...beltSpots(half)], [avoid, half]);
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

// The school bus round the campus road (its centre line: curve). Each lap it pulls in at the bus stop and waits,
// slowing as it comes in and picking up speed as it pulls away; its headlights come on after dark, with the stop's
// poster. With reduced motion, it waits at the stop.
const HEADLIGHT = new THREE.MeshStandardMaterial({ color: "#FFF8E6", emissive: "#FFF1C9", emissiveIntensity: 0.15 });
const LAP = 48; // seconds driving round
const WAIT = 5; // seconds at the stop

export function Bus({ curve, half }: { curve: THREE.CatmullRomCurve3; half: number }) {
  const ref = useRef<THREE.Group>(null);
  const still = useMemo(prefersReducedMotion, []);
  useEffect(() => onSkyLight((_, lights) => void (HEADLIGHT.emissiveIntensity = 0.15 + lights * 2.4)), []);
  // Where the stop is round the loop (0 to 1).
  const stopAt = useMemo(() => {
    const [sx, sz] = busStop(half).road;
    let [best, near] = [0, Infinity];
    for (let i = 0; i < 400; i++) {
      const p = curve.getPointAt(i / 400);
      const d = (p.x - sx) ** 2 + (p.z - sz) ** 2;
      if (d < near) [best, near] = [i / 400, d];
    }
    return best;
  }, [curve, half]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const lap = still ? 0 : clock.elapsedTime % (LAP + WAIT);
    const u = lap < WAIT ? 0 : (lap - WAIT) / LAP;
    const t = (stopAt + u - (0.9 * Math.sin(2 * Math.PI * u)) / (2 * Math.PI) + 1) % 1; // slow near the stop
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    ref.current.position.set(p.x, 0, p.z);
    ref.current.rotation.y = Math.atan2(tan.x, tan.z);
  });
  return (
    <group ref={ref}>
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 0.78, 3.12]} material={HEADLIGHT}>
          <boxGeometry args={[0.42, 0.22, 0.04]} />
        </mesh>
      ))}
      <mesh position-y={1.45} castShadow>
        <boxGeometry args={[2.4, 2.1, 6.2]} />
        <meshStandardMaterial color="#F6B73C" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.95, -0.3]}>
        <boxGeometry args={[2.45, 0.7, 4.9]} />
        <meshStandardMaterial color="#2F3466" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.95, 3.11]}>
        <boxGeometry args={[2, 0.75, 0.04]} />
        <meshStandardMaterial color="#2F3466" roughness={0.3} />
      </mesh>
      <mesh position-y={2.6} castShadow>
        <boxGeometry args={[2.3, 0.18, 6]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1.9, 1.9].map((z) => (
          <mesh key={`${sx}${z}`} position={[sx * 1.2, 0.45, z]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.45, 0.45, 0.3, 16]} />
            <meshStandardMaterial color="#2B2D42" />
          </mesh>
        )),
      )}
    </group>
  );
}

// The bus stop, facing the road: a shelter with a bench, a poster that lights up after dark, and the stop's sign.
export function BusStop({ half }: { half: number }) {
  const { pos } = busStop(half);
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh position={[0, 1.25, -0.7]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 2.2, 0.08]} />
        <meshStandardMaterial color="#DCE1F4" roughness={0.4} />
      </mesh>
      <mesh position={[-0.9, 1.45, -0.64]} material={HEADLIGHT}>
        <planeGeometry args={[1.3, 0.95]} />
      </mesh>
      <mesh position={[0, 2.42, -0.1]} castShadow>
        <boxGeometry args={[4, 0.14, 1.8]} />
        <meshStandardMaterial color={COLORS.indigo} roughness={0.7} />
      </mesh>
      {[-1.85, 1.85].map((x) => (
        <mesh key={x} position={[x, 1.2, 0.6]} castShadow>
          <boxGeometry args={[0.1, 2.4, 0.1]} />
          <meshStandardMaterial color="#5B5F8F" />
        </mesh>
      ))}
      <mesh position={[0.6, 0.5, -0.4]} castShadow>
        <boxGeometry args={[2.2, 0.12, 0.45]} />
        <meshStandardMaterial color={COLORS.amber} roughness={0.6} />
      </mesh>
      <mesh position={[2.5, 1.4, 0.7]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2.8, 6]} />
        <meshStandardMaterial color="#5B5F8F" />
      </mesh>
      <mesh position={[2.5, 2.85, 0.7]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.36, 0.36, 0.06, 20]} />
        <meshStandardMaterial color={COLORS.amber} />
      </mesh>
    </group>
  );
}

// The fountain on the quad's lawn: there for good once you've finished a whole day's timetable (the player's unlocks).
// It springs up as the campus opens, and its water plays; with reduced motion, it's simply there.
const easeOutBack = (x: number) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
export function Fountain() {
  const group = useRef<THREE.Group>(null);
  const water = useRef<THREE.Mesh>(null);
  const since = useRef<number | null>(null);
  const still = useMemo(prefersReducedMotion, []);
  useFrame(({ clock }) => {
    if (still || !group.current || !water.current) return;
    since.current ??= clock.elapsedTime;
    const t = Math.min(1, (clock.elapsedTime - since.current) / 0.9);
    group.current.scale.setScalar(Math.max(0.001, easeOutBack(t)));
    water.current.scale.y = 1 + Math.sin(clock.elapsedTime * 6) * 0.15;
  });
  return (
    <group ref={group} position={[FOUNTAIN[0], 0, FOUNTAIN[1]]} scale={still ? 1 : 0.001}>
      <mesh position-y={0.35} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2.2, 0.7, 32]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position-y={0.71}>
        <cylinderGeometry args={[1.75, 1.75, 0.04, 32]} />
        <meshStandardMaterial color="#8FD0F2" />
      </mesh>
      <mesh position-y={1.25} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 1.2, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh ref={water} position-y={2.2}>
        <coneGeometry args={[0.55, 1.4, 16, 1, true]} />
        <meshStandardMaterial color="#B5E2F8" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
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
// the bell (the top swings) once today's timetable is done, rung once a day when you come back to see it (onRing, as it
// rings). A tap says where the bell stands (onTap).
type TowerProps = { streak: number; kept: boolean; rung: boolean; onTap: () => void; onRing?: () => void };
export function ClockTower({ streak, kept, rung, onTap, onRing }: TowerProps) {
  const top = useRef<THREE.Group>(null);
  const flag = useRef<THREE.Group>(null);
  const still = useMemo(prefersReducedMotion, []);
  const bellAt = useBellAt(rung);
  useEffect(() => {
    if (!bellAt || !onRing) return;
    const timer = setTimeout(onRing, Math.max(0, bellAt - performance.now()));
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the bell rings
  }, [bellAt]);
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
        {/* Ranked lowest for the declutter, and not read out: the top bar shows your streak too. */}
        <div className={`scene-chip ${kept ? "scene-chip-bell" : ""}`} data-rank="0" aria-hidden="true">
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
// onOpen: straight in (its label, a link); onTap: a tap on the office itself (you walk over first).
type OfficeProps = { who: { name: string; top: string }; onOpen: () => void; onTap?: () => void; onFocus?: (at: readonly [number, number]) => void };
export function CoachOffice({ who, onOpen, onTap = onOpen, onFocus }: OfficeProps) {
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
          if (e.delta < 6) onTap();
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
        <PlaceLink href="/report-card" go={onOpen} onFocus={() => onFocus?.(OFFICE.pos)}>
          <span className="font-semibold">Report card</span>
        </PlaceLink>
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

// The noticeboard of skill paths (the prototype's), where the quad's west path meets the ring: notices pinned to a board
// say "pick one here", as a school's noticeboard does, and a game's quest board. A path's own home is its subject's
// building; this is where you browse them across every subject. A tap (onTap) walks you over on your campus, and opens
// the paths there; its label is the link straight to them. A ring round it while it's pointed at.
const NOTICES: readonly (readonly [number, number, number, number, number, string])[] = [
  // x, y, width, height, tilt and colour, on the board's face
  [-0.86, 1.84, 0.66, 0.78, 0.05, "#FFFFFF"],
  [-0.05, 1.8, 0.62, 0.86, -0.04, "#FDE68A"],
  [0.8, 1.86, 0.68, 0.74, 0.06, "#CCFBF1"],
];
type NoticeboardProps = { onOpen: () => void; onTap?: () => void; onFocus?: (at: readonly [number, number]) => void };
export function Noticeboard({ onOpen, onTap = onOpen, onFocus }: NoticeboardProps) {
  const word = useLabelTexture("PATHS", { bg: COLORS.indigo, width: 512, height: 128 });
  const [lit, setLit] = useState(false);
  return (
    <group position={[NOTICEBOARD.pos[0], 0, NOTICEBOARD.pos[1]]}>
      <group
        rotation-y={NOTICEBOARD.rot}
        scale={1.25}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta < 6) onTap();
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          pointer.onPointerOver(e);
          setLit(true);
        }}
        onPointerOut={() => {
          pointer.onPointerOut();
          setLit(false);
        }}
      >
        {/* Two posts, the board in its frame with "PATHS" across the top, a little roof, and three notices pinned up. */}
        {[-1.4, 1.4].map((px) => (
          <mesh key={px} position={[px, 1.5, -0.02]} castShadow>
            <boxGeometry args={[0.16, 3, 0.16]} />
            <meshStandardMaterial color={COLORS.trunk} roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 2, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[2.9, 1.75, 0.12]} />
          <meshStandardMaterial color={COLORS.indigo} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.865, 0.05]} receiveShadow>
          <planeGeometry args={[2.64, 1.23]} />
          <meshStandardMaterial color="#E9D8B8" roughness={0.95} />
        </mesh>
        {word && (
          <mesh position={[0, 2.66, 0.05]}>
            <planeGeometry args={[1.1, 0.27]} />
            <meshBasicMaterial map={word} toneMapped={false} />
          </mesh>
        )}
        <mesh position={[0, 3.02, 0.04]} castShadow>
          <boxGeometry args={[3.3, 0.14, 0.56]} />
          <meshStandardMaterial color={COLORS.indigoDeep} roughness={0.7} />
        </mesh>
        {NOTICES.map(([nx, ny, w, h, tilt, color]) => (
          <group key={nx} position={[nx, ny, 0.08]} rotation-z={tilt}>
            <mesh>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {[0.16, 0.04, -0.08, -0.2].map((ly, i) => (
              <mesh key={ly} position={[i ? 0 : -w * 0.08, ly, 0.008]}>
                <planeGeometry args={[w * (i ? 0.66 : 0.5), i ? 0.035 : 0.06]} />
                <meshBasicMaterial color={i ? "#A3A8C3" : COLORS.ink} />
              </mesh>
            ))}
            <mesh position={[0, h / 2 - 0.07, 0.03]}>
              <sphereGeometry args={[0.05, 10, 8]} />
              <meshStandardMaterial color="#E11D48" roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>
      {lit && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.05}>
          <ringGeometry args={[2.2, 2.45, 48]} />
          <meshBasicMaterial color={COLORS.indigo} />
        </mesh>
      )}
      <Label position={[0, 4.7, 0]}>
        <PlaceLink href="/paths" label="Paths: step-by-step routes through a subject" go={onOpen} onFocus={() => onFocus?.(NOTICEBOARD.pos)}>
          <span className="font-semibold">Paths</span>
        </PlaceLink>
      </Label>
    </group>
  );
}
