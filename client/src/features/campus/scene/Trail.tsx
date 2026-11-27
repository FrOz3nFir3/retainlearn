// The path you follow, drawn on the ground (the prototype's Trail): a walkable route from where you stand to the door of
// your current step's building, as pulsing amber dots, gone while you walk and back from where you stop; at its end a
// label, "{path}: step n of N", which steps aside while you stand there (the door's own "Go into …" takes over). Only
// on your campus, when your current step's subject has its building there. It follows your character only as you start
// and stop walking, not every frame; the dots hold still for those who ask for reduced motion.
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CampusPath } from "@retainlearn/core";
import { Label } from "./Label.tsx";
import type { CampusBuilding } from "./layout.ts";
import { findPath } from "./nav.ts";
import type { Nav } from "./nav.ts";
import { doorPoint, prefersReducedMotion } from "./util.ts";
import { you } from "./you.ts";

export function Trail({ path, building, nav }: { path: CampusPath; building: CampusBuilding; nav: Nav }) {
  const [moving, setMoving] = useState(you.moving);
  const [rest, setRest] = useState(() => you.pos.clone());
  useFrame(() => {
    if (you.moving === moving) return;
    setMoving(you.moving);
    if (!you.moving) setRest(you.pos.clone());
  });

  const route = useMemo(() => {
    const door = doorPoint(building, 2.6);
    const pts = findPath(nav, new THREE.Vector3(rest.x, 0, rest.z), door);
    const end = pts.at(-1) ?? door;
    const curve = pts.length > 1 ? new THREE.CatmullRomCurve3(pts, false, "centripetal") : null;
    const n = curve ? Math.round(curve.getLength() / 1.1) : 0;
    // The first stretch left clear, so the dots don't start under your feet.
    const dots = curve && n > 3 ? Array.from({ length: n }, (_, i) => curve.getPointAt(i / (n - 1))).slice(2) : [];
    return { dots, end };
  }, [building, nav, rest]);

  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const still = useMemo(() => prefersReducedMotion(), []);
  useFrame(({ clock }) => {
    if (still) return;
    const t = clock.elapsedTime * 2.2;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const pulse = (Math.sin(t - i * 0.45) + 1) / 2;
      m.scale.setScalar(0.7 + pulse * 0.5);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.35 + pulse * 0.55;
    });
  });

  const there = !moving && Math.hypot(rest.x - route.end.x, rest.z - route.end.z) < 2.6;
  return (
    <group>
      {!moving &&
        route.dots.map((p, i) => (
          <mesh
            key={i}
            ref={(m) => {
              refs.current[i] = m;
            }}
            position={[p.x, 0.07, p.z]}
            rotation-x={-Math.PI / 2}
          >
            <circleGeometry args={[0.32, 16]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.8} depthWrite={false} />
          </mesh>
        ))}
      {!there && path.current && (
        <Label position={[route.end.x, 2.2, route.end.z]}>
          <div className="scene-chip scene-chip-bell" data-rank="2">
            {`${path.title}: step ${path.current.n} of ${path.total}`}
          </div>
        </Label>
      )}
    </group>
  );
}
