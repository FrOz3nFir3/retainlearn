// The campus's light by the time of day (daylight.ts, the prototype's scene/Sky.jsx): the sky and fog colour, the sky
// and ground light, and the sun, which moves across the sky and casts the shadows (the moon after dark). After dark
// the windows glow, the street lamps come on, and walls stop lighting themselves (setSkyLight). A new hour (a part
// of the day you chose) eases in over a moment; with reduced motion it's there at once. g: the campus's size, which
// sets how far the fog starts and how big the sun's shadow box is.
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { blankSky, mixSky, setSkyLight, skyAt, sunPosition } from "./daylight.ts";
import type { SkyState } from "./daylight.ts";
import { prefersReducedMotion } from "./util.ts";

const EASE = 1.6; // seconds to move to a new sky

export function Sky({ hour, g, narrow, shadows }: { hour: number; g: number; narrow: boolean; shadows: boolean }) {
  const scene = useThree((s) => s.scene);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const fog = useRef<THREE.Fog>(null);
  const blend = useRef<{ from: SkyState; to: SkyState; at: number; done: boolean } | null>(null);
  const now = useMemo(blankSky, []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const size = Math.round(78 * g); // the shadow box covers the lot and the tree belt beyond the road

  useLayoutEffect(() => {
    const target = skyAt(hour);
    blend.current = { from: blend.current ? mixSky(now, now, 0) : target, to: target, at: prefersReducedMotion() ? 0 : performance.now(), done: false };
  }, [hour, now, g]);
  useLayoutEffect(() => {
    scene.background = new THREE.Color();
    return () => {
      scene.background = null;
    };
  }, [scene]);

  useFrame(() => {
    const b = blend.current;
    if (!b || b.done || !hemi.current || !sun.current || !fog.current) return;
    const t = Math.min(1, (performance.now() - b.at) / 1000 / EASE);
    mixSky(b.from, b.to, t * t * (3 - 2 * t), now);
    (scene.background as THREE.Color).copy(now.bg);
    fog.current.color.copy(now.bg);
    hemi.current.color.copy(now.hemi[0]);
    hemi.current.groundColor.copy(now.hemi[1]);
    hemi.current.intensity = now.hemi[2];
    sun.current.color.copy(now.sun[0]);
    sun.current.intensity = now.sun[1];
    sun.current.position.copy(sunPosition(now, 72 * g, pos));
    setSkyLight(now.selfLit, now.lights);
    b.done = t >= 1;
  });

  return (
    <>
      <fog ref={fog} attach="fog" args={narrow ? ["#E6E9F6", 210 * g, 380 * g] : ["#E6E9F6", 130 * g, 260 * g]} />
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} castShadow={shadows} shadow-mapSize={narrow ? [1024, 1024] : [2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.04}>
        <orthographicCamera key={size} attach="shadow-camera" args={[-size, size, size, -size, 1, 180 * g]} />
      </directionalLight>
    </>
  );
}
