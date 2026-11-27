// A subject's building (the prototype's scene/Building.jsx), from outside, or opened up while you're in it (Interior.tsx):
// the kit's walls, with a window lit for each share of your mastery, one at a time as it changes; its sign and its
// pennant in the subject's colour; scaffolding while it has no study sets; a cloud raining on it once it's gone cold;
// sparkles from its roof when you come back from a class finished here.
// Its label: its name, always, and a status when it needs you (what you missed first, else cooling, cold or new); it's
// also the building's link for the keyboard and screen readers (PlaceLink). A tap goes in (onEnter). With reduced
// motion, the pennant and the rain hold still.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KitShell, BASE, STOREY, kitWindows, roofHeight } from "./kit.tsx";
import { subjectPath } from "../subjects.ts";
import { Interior } from "./Interior.tsx";
import type { Inside } from "./Interior.tsx";
import { Label, PlaceLink } from "./Label.tsx";
import type { CampusBuilding } from "./layout.ts";
import { COLORS, facingCenter, prefersReducedMotion, roundedRectShape, useLabelTexture } from "./util.ts";

const mat = {
  plinth: new THREE.MeshStandardMaterial({ color: "#DCE0F2", roughness: 1 }),
  cloud: new THREE.MeshStandardMaterial({ color: "#C5C8DC", roughness: 1 }),
  rain: new THREE.MeshBasicMaterial({ color: "#8E9AD8" }),
  scaffold: new THREE.MeshStandardMaterial({ color: "#F59E0B", roughness: 0.6 }),
};

// A count that steps towards its target one at a time, so windows light up one by one (at once with reduced motion).
function useSteppedCount(target: number, stepMs = 110): number {
  const [n, setN] = useState(target);
  useEffect(() => {
    if (n === target) return;
    if (prefersReducedMotion()) return setN(target);
    const t = setTimeout(() => setN((v) => v + Math.sign(target - v)), stepMs);
    return () => clearTimeout(t);
  }, [n, target, stepMs]);
  return n;
}

// The pointer over something you can tap: the hand cursor.
export const pointer = {
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "";
  },
};

const STATUS: Record<string, { label: string; tag: string }> = {
  cooling: { label: "Cooling", tag: "bg-orange-wash text-orange-ink" },
  cold: { label: "Cold", tag: "bg-cold-wash text-cold-ink" },
  new: { label: "Not started", tag: "bg-brand/10 text-brand" },
  empty: { label: "Needs content", tag: "bg-ink/5 text-ink/60" },
};

// onEnter: straight in (its label, a link); onTap: a tap on the building itself (on your campus, you walk over first).
// celebrate: a class here has just finished, so sparkles burst from its roof. inside: you're in it (its subject's page
// is open over the world): the building opens up to show its classrooms (Interior.tsx).
type BuildingProps = {
  b: CampusBuilding;
  labels?: boolean;
  celebrate?: boolean;
  inside?: Inside | null;
  onEnter: (b: CampusBuilding) => void;
  onTap?: (b: CampusBuilding) => void;
  onFocus?: (at: readonly [number, number]) => void;
};

export function Building({ b, labels = true, celebrate = false, inside = null, onEnter, onTap = onEnter, onFocus }: BuildingProps) {
  const { subject } = b;
  const empty = subject.sets === 0;
  const status = empty ? "empty" : subject.status;
  const cold = status === "cold";
  const tag = subject.missed > 0 ? { label: `${subject.missed} missed`, tag: "bg-bell-wash text-bell-ink" } : STATUS[status];
  const [w, d] = b.size;
  const roofTop = BASE + b.floors * STOREY + roofHeight;
  const rot = facingCenter(b.pos);
  const windows = kitWindows(b.cells[0], b.floors);
  const lit = useSteppedCount(empty ? 0 : Math.round(subject.mastery * windows));
  const sign = useLabelTexture(b.name);
  const style = useMemo(() => [...b.id].reduce((n, ch) => n + ch.charCodeAt(0), 0), [b.id]);
  const tap = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta >= 6) return; // a drag of the map, not a tap
    onTap(b);
  };
  const state = cold ? "cold" : status === "cooling" ? "cooling" : "warm";
  if (inside) {
    // People studying in the lobby: busier the more alive the subject is for you.
    const lobby = empty ? 0 : status === "cold" ? 1 : status === "cooling" ? 2 : 3;
    const pennant = (top: number) => <Pennant color={cold ? COLORS.cold : b.pennant} position={[w / 2 - 0.9, top, -d / 2 + 0.9]} />;
    return <Interior b={b} rot={rot} shell={{ cols: b.cells[0], lit, state, style }} lobby={lobby} sign={sign} inside={inside} pennant={pennant} />;
  }
  return (
    <group position={[b.pos[0], 0, b.pos[1]]}>
      <group rotation-y={rot} onClick={tap} {...pointer}>
        <mesh position-y={BASE / 2} receiveShadow material={mat.plinth}>
          <boxGeometry args={[w + 1.4, BASE, d + 1.4]} />
        </mesh>
        <Suspense fallback={null}>
          <KitShell cols={b.cells[0]} floors={b.floors} lit={lit} state={state} style={style} />
        </Suspense>
        {sign && (
          <mesh position={[0, BASE + 2.92, d / 2 + 0.22]}>
            <planeGeometry args={[Math.min(w - 2.5, 4.8), 0.62]} />
            <meshBasicMaterial map={sign} toneMapped={false} />
          </mesh>
        )}
        <Pennant color={cold ? COLORS.cold : b.pennant} position={[w / 2 - 0.9, roofTop, -d / 2 + 0.9]} />
        {empty && <Scaffold w={w} d={d} h={b.floors * STOREY} />}
      </group>
      {labels && (
        <Label position={[0, roofTop + 1.4, 0]}>
          {/* Named as it reads, with a comma (the chip's parts are flex items, which would be read with odd spaces). */}
          <PlaceLink href={subjectPath(b.name)} label={tag ? `${b.name}, ${tag.label}` : b.name} go={() => onEnter(b)} onFocus={() => onFocus?.(b.pos)} className="opacity-90">
            <span className="font-semibold">{b.name}</span>
            {tag && <span className={`scene-chip-tag ${tag.tag}`}>{tag.label}</span>}
          </PlaceLink>
        </Label>
      )}
      {cold && (
        <group position={[-Math.sin(rot) * d * 0.25, 0, -Math.cos(rot) * d * 0.25]} scale={0.8}>
          <RainCloud y={(roofTop + 3.6) / 0.8} />
        </group>
      )}
      {celebrate && <Sparkles y={roofTop} />}
    </group>
  );
}

// A burst of sparkles from the roof, for a class just finished here: up, out and down, shrinking away in two seconds.
// Not with reduced motion (the class's end said it all).
const SPARKLE = new THREE.OctahedronGeometry(0.4);
const SPARKLE_COLOURS = [COLORS.amber, COLORS.indigo, "#FFFFFF", "#34B27D"].map((color) => new THREE.MeshBasicMaterial({ color }));
function Sparkles({ y }: { y: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const start = useRef<number | null>(null);
  const [done, setDone] = useState(prefersReducedMotion);
  const parts = useMemo(() => Array.from({ length: 30 }, () => ({ vx: (Math.random() - 0.5) * 10, vy: 5 + Math.random() * 4, vz: (Math.random() - 0.5) * 10, spin: Math.random() * 6 })), []);
  useFrame(({ clock }) => {
    if (done) return;
    start.current ??= clock.elapsedTime;
    const t = clock.elapsedTime - start.current;
    if (t > 2.2) return setDone(true);
    refs.current.forEach((m, i) => {
      const p = parts[i];
      if (!m || !p) return;
      m.position.set(p.vx * t, y + p.vy * t - 8 * t * t, p.vz * t);
      m.rotation.set(t * p.spin, t * p.spin, 0);
      m.scale.setScalar(Math.max(0.001, 1 - t / 2.2));
    });
  });
  if (done) return null;
  return parts.map((_, i) => <mesh key={i} ref={(m) => void (refs.current[i] = m)} position-y={y} geometry={SPARKLE} material={SPARKLE_COLOURS[i % 4]} />);
}

function Scaffold({ w, d, h }: { w: number; d: number; h: number }) {
  const poles = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -w / 2 - 0.6; x <= w / 2 + 0.7; x += 2.4) out.push([x, d / 2 + 0.6], [x, -d / 2 - 0.6]);
    return out;
  }, [w, d]);
  return (
    <group>
      {poles.map(([x, z], i) => (
        <mesh key={i} position={[x, BASE + h / 2 + 0.4, z]} material={mat.scaffold}>
          <boxGeometry args={[0.12, h + 0.8, 0.12]} />
        </mesh>
      ))}
      {[0.4, 0.75].map((t) =>
        [-1, 1].map((sz) => (
          <mesh key={`${t}${sz}`} position={[0, BASE + h * t + 0.4, sz * (d / 2 + 0.6)]} material={mat.scaffold}>
            <boxGeometry args={[w + 1.6, 0.12, 0.5]} />
          </mesh>
        )),
      )}
      <mesh position={[w / 2 + 2.2, BASE + h + 3, -d / 2]} material={mat.scaffold}>
        <boxGeometry args={[0.35, 2 * h + 6, 0.35]} />
      </mesh>
      <mesh position={[w / 2 - 1, BASE + 2 * h + 5.6, -d / 2]} material={mat.scaffold}>
        <boxGeometry args={[7, 0.3, 0.3]} />
      </mesh>
    </group>
  );
}

function Pennant({ color, position }: { color: string; position: [number, number, number] }) {
  const flag = useRef<THREE.Group>(null);
  const still = useMemo(prefersReducedMotion, []);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(1.7, -0.45);
    s.lineTo(0, -0.9);
    s.closePath();
    return s;
  }, []);
  useFrame(({ clock }) => {
    if (flag.current && !still) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2.2 + position[0]) * 0.28;
  });
  return (
    <group position={position}>
      <mesh position-y={1.6} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 3.2, 6]} />
        <meshStandardMaterial color="#C9CCE0" />
      </mesh>
      <group ref={flag} position-y={3.1}>
        <mesh castShadow>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function RainCloud({ y }: { y: number }) {
  const group = useRef<THREE.Group>(null);
  const drops = useRef<(THREE.Mesh | null)[]>([]);
  const still = useMemo(prefersReducedMotion, []);
  const seeds = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: (((i * 7919) % 100) / 100 - 0.5) * 4.4, z: (((i * 104729) % 100) / 100 - 0.5) * 2.4, o: ((i * 31) % 100) / 100 })), []);
  useFrame(({ clock }) => {
    if (still || !group.current) return;
    const t = clock.elapsedTime;
    group.current.position.x = Math.sin(t * 0.4) * 0.6;
    drops.current.forEach((m, i) => {
      if (m) m.position.y = -0.9 - ((t * 1.4 + (seeds[i]?.o ?? 0)) % 1) * 4.6;
    });
  });
  return (
    <group ref={group} position-y={y}>
      {(
        [
          [-1.6, 0, 0, 1.2],
          [0, 0.45, 0, 1.6],
          [1.5, 0.05, 0.1, 1.2],
          [0.6, -0.2, 0.9, 1],
          [-0.7, -0.25, -0.8, 1],
        ] as const
      ).map(([x, yy, z, r], i) => (
        <mesh key={i} position={[x, yy, z]} castShadow material={mat.cloud}>
          <sphereGeometry args={[r, 22, 16]} />
        </mesh>
      ))}
      {seeds.map((s, i) => (
        <mesh key={i} ref={(m) => void (drops.current[i] = m)} position={[s.x, -1 - s.o * 4.6, s.z]} material={mat.rain}>
          <boxGeometry args={[0.06, 0.6, 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

// The free plot: where your next subject goes, with the way to add one.
type FreePlotProps = { plot: { pos: readonly [number, number]; size: readonly [number, number] }; onAdd: () => void; onFocus?: (at: readonly [number, number]) => void };
export function FreePlot({ plot, onAdd, onFocus }: FreePlotProps) {
  const pad = useMemo(() => roundedRectShape(plot.size[0] + 1.4, plot.size[1] + 1.4, 0.8), [plot]);
  const dashes = useMemo(() => {
    const out: [number, number, number][] = [];
    const W = plot.size[0] + 1.4;
    const D = plot.size[1] + 1.4;
    for (let x = -W / 2 + 0.7; x < W / 2; x += 1.5) out.push([x, D / 2, 0], [x, -D / 2, 0]);
    for (let z = -D / 2 + 0.7; z < D / 2; z += 1.5) out.push([W / 2, z, Math.PI / 2], [-W / 2, z, Math.PI / 2]);
    return out;
  }, [plot]);
  return (
    <group
      position={[plot.pos[0], 0, plot.pos[1]]}
      rotation-y={facingCenter(plot.pos)}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta < 6) onAdd();
      }}
      {...pointer}
    >
      <mesh rotation-x={-Math.PI / 2} position-y={0.05} receiveShadow>
        <shapeGeometry args={[pad]} />
        <meshStandardMaterial color="#ECEEFA" />
      </mesh>
      {dashes.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.09, z]} rotation-y={r}>
          <boxGeometry args={[0.8, 0.06, 0.22]} />
          <meshBasicMaterial color="#A9ADE6" />
        </mesh>
      ))}
      <Label position={[0, 1.4, 0]}>
        <PlaceLink href="/subjects" go={onAdd} onFocus={() => onFocus?.(plot.pos)} rank={0} className="scene-chip-ghost">
          Add a subject
        </PlaceLink>
      </Label>
    </group>
  );
}
