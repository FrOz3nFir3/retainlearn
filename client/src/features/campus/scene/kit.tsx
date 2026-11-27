// The campus's look (the prototype's scene/kit.jsx, "kit" look): Kenney's CC0 kits (kenney.nl), Modular Buildings for
// walls, Nature Kit for trees and Mini Characters for people, in public/models (README there). No Draco or Meshopt:
// their decoders need WebAssembly, which the site's CSP doesn't allow. The people use KHR_mesh_quantization instead,
// which three reads natively, and textures stay separate files because the CSP also blocks blob: images.
// The stadium's crowds and team kits come with the stadium.
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { onSkyLight } from "./daylight.ts";
import { CELL } from "./layout.ts";

const PIECES = "/models/buildings/pieces.gltf";
const NATURE = "/models/nature/nature.gltf";
const VARIANTS = ["a", "b", "c", "d", "e", "f"].flatMap((v) => [`female-${v}`, `male-${v}`]);
const PEOPLE = VARIANTS.map((v) => `/models/people/character-${v}.gltf`);
const ANIMS = "/models/people/character-male-a.gltf"; // the one file that keeps the animations; every character shares its bones
export const PEOPLE_COUNT = PEOPLE.length;
const useModel = (url: string) => useGLTF(url, false, false);

export function preloadKit(): void {
  useGLTF.preload(PIECES, false, false);
  useGLTF.preload(NATURE, false, false);
  for (const url of PEOPLE) useGLTF.preload(url, false, false);
}

const UP = new THREE.Vector3(0, 1, 0);
const isMesh = (o: THREE.Object3D): o is THREE.Mesh => (o as THREE.Mesh).isMesh === true;
const isSkinned = (o: THREE.Object3D): o is THREE.SkinnedMesh => (o as THREE.SkinnedMesh).isSkinnedMesh === true;

// ---------- trees ----------

const TREE_KINDS = ["tree_default", "tree_oak", "tree_fat"];
const TREE_SCALE = 2.8; // the kit's trees are about 1.7 m tall and slim
const LEAVES = ["#7CC99D", "#95D6AE", "#6BBE90"]; // the campus greens
type TreePartData = { geometry: THREE.BufferGeometry; material: THREE.MeshStandardMaterial; leafy: boolean };

// The trees, three kinds in turn. Each kind's bark and leaves are one instanced mesh apiece, so all the campus's trees
// cost six draw calls. Leaves keep the campus greens, varied per tree. spots: [x, z, scale?].
export function KitTrees({ spots }: { spots: readonly (readonly [number, number, number?])[] }) {
  const gltf = useModel(NATURE);
  const kinds = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    return TREE_KINDS.map((name) => {
      const root = gltf.scene.getObjectByName(name);
      if (!root) return [];
      const toRoot = root.matrixWorld.clone().invert();
      const parts: TreePartData[] = [];
      root.traverse((o) => {
        if (!isMesh(o)) return;
        const geometry = o.geometry.clone().applyMatrix4(toRoot.clone().multiply(o.matrixWorld));
        const source = o.material as THREE.MeshStandardMaterial;
        const leafy = /leaf/i.test(source.name);
        const material = source.clone();
        // glTF materials are fully metallic unless they say otherwise, which renders dark with no environment.
        material.metalness = 0;
        material.roughness = 0.9;
        if (leafy) material.color.set("#FFFFFF");
        parts.push({ geometry, material, leafy });
      });
      return parts;
    });
  }, [gltf]);
  return (
    <>
      {kinds.flatMap((parts, k) => {
        const mine = spots.filter((_, i) => i % TREE_KINDS.length === k);
        return parts.map((part, j) => <TreePart key={`${k}-${j}-${mine.length}`} part={part} spots={mine} />);
      })}
    </>
  );
}

function TreePart({ part, spots }: { part: TreePartData; spots: readonly (readonly [number, number, number?])[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    spots.forEach(([x, z, s = 1], i) => {
      q.setFromAxisAngle(UP, (x * 12.9898 + z * 78.233) % (Math.PI * 2));
      mesh.setMatrixAt(i, m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3().setScalar(s * TREE_SCALE)));
      if (part.leafy) mesh.setColorAt(i, c.set(LEAVES[i % LEAVES.length] ?? "#7CC99D"));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [spots, part]);
  return <instancedMesh ref={ref} args={[part.geometry, part.material, spots.length]} castShadow />;
}

// ---------- buildings ----------

// Kenney's buildings take every colour from one palette texture: 16 swatch columns, in two rows. The campus look is a
// recoloured copy: white walls, indigo roofs, amber awnings. Lit windows are the same palette with the glass swatch
// warm yellow and glowing, so a building's windows light up cell by cell at no extra cost.
type Swatch = readonly ["top" | "bottom", number];
const SWATCH = { glass: ["top", 11], awning: ["top", 1], walls: ["bottom", 15], trim: ["bottom", 14], roof: ["bottom", 13], wood: ["bottom", 10], woodDark: ["bottom", 11] } as const satisfies Record<string, Swatch>;
type Colours = Record<keyof typeof SWATCH, string>;
const BASE_COLOURS: Colours = { walls: "#F6F6FC", trim: "#FFFFFF", glass: "#C9CDEB", awning: "#F59E0B", roof: "#4F46E5", wood: "#3B33C4", woodDark: "#2E2A6B" };
const COLD_COLOURS: Colours = { walls: "#E4E5EF", trim: "#EEEFF5", glass: "#C5C8DC", awning: "#B8B9CC", roof: "#8E92B6", wood: "#6E7196", woodDark: "#5B5F8F" };
// glow: the lit windows' colour, and how brightly they glow by day and after dark (the sky turns the lights on).
type Palette = { colours: Colours; glow?: readonly [string, number, number] };
const PALETTES = {
  base: { colours: BASE_COLOURS },
  lit: { colours: { ...BASE_COLOURS, glass: "#FFD36A" }, glow: ["#FFB12E", 0.45, 1.15] },
  cooling: { colours: { ...BASE_COLOURS, glass: "#F1D9A0" }, glow: ["#E8B860", 0.15, 0.5] },
  cold: { colours: COLD_COLOURS },
  coldLit: { colours: { ...COLD_COLOURS, glass: "#E4DBC0" } },
} as const satisfies Record<string, Palette>;
type PaletteName = keyof typeof PALETTES;
const SIZE = 128; // the palette drawn small: flat colours need few pixels

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const swatchRect = ([row, col]: Swatch): [number, number, number, number] => [col * (SIZE / 16), row === "top" ? SIZE / 2 : (SIZE * 3) / 4, SIZE / 16, SIZE / 4];

function texture(canvas: HTMLCanvasElement, like: THREE.Texture): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  t.wrapS = like.wrapS;
  t.wrapT = like.wrapT;
  t.magFilter = like.magFilter;
  t.minFilter = like.minFilter;
  t.rotation = like.rotation;
  t.offset.copy(like.offset);
  t.repeat.copy(like.repeat);
  t.center.copy(like.center);
  return t;
}

// The palette with some swatches recoloured, keeping each swatch's shading (its brightness relative to its average).
function recolour(image: CanvasImageSource, like: THREE.Texture, colours: Colours): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return texture(canvas, like);
  ctx.drawImage(image, 0, 0, SIZE, SIZE);
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = img.data;
  const lum = (i: number) => (d[i] ?? 0) * 0.3 + (d[i + 1] ?? 0) * 0.59 + (d[i + 2] ?? 0) * 0.11;
  for (const [key, hex] of Object.entries(colours) as [keyof Colours, string][]) {
    const [x0, y0, w, h] = swatchRect(SWATCH[key]);
    let sum = 0;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) sum += lum((y * SIZE + x) * 4);
    const avg = sum / (w * h) || 1;
    const [r, g, b] = rgb(hex);
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const i = (y * SIZE + x) * 4;
        const k = lum(i) / avg;
        d[i] = Math.min(255, r * k);
        d[i + 1] = Math.min(255, g * k);
        d[i + 2] = Math.min(255, b * k);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return texture(canvas, like);
}

// Two kinds of glow. Every material lights itself a little with its own colours (SELF_LIT, the emissive map), so
// walls in their own shade still read white by day; after dark that fades. Lit windows glow on top of that, from a
// mask of just the glass in the glow colour, added in the shader, so they brighten at night while the walls darken.
const SELF_LIT = 0.22;
function glassMask(like: THREE.Texture, hex: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = hex;
    ctx.fillRect(...swatchRect(SWATCH.glass));
  }
  return texture(canvas, like);
}
type Windows = { glow: { value: number }; day: number; night: number };
function withWindows(material: THREE.MeshStandardMaterial, mask: THREE.Texture, [, day, night]: readonly [string, number, number]): THREE.MeshStandardMaterial {
  const glow = { value: day };
  material.userData.windows = { glow, day, night } satisfies Windows;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.windowMap = { value: mask };
    shader.uniforms.windowGlow = glow;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D windowMap;\nuniform float windowGlow;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += texture2D( windowMap, vEmissiveMapUv ).rgb * windowGlow;");
  };
  material.customProgramCacheKey = () => "kit-windows";
  return material;
}

type Kit = { geo: Record<string, THREE.BufferGeometry>; mats: Record<PaletteName, THREE.MeshStandardMaterial> };
const kits = new WeakMap<object, Kit>();
export function useKitPieces(): Kit {
  const gltf = useModel(PIECES);
  const kit = useMemo(() => {
    const known = kits.get(gltf);
    if (known) return known;
    const geo: Record<string, THREE.BufferGeometry> = {};
    let original: THREE.Texture | null = null;
    gltf.scene.traverse((o) => {
      if (!isMesh(o)) return;
      geo[o.name] = o.geometry;
      original ??= (o.material as THREE.MeshStandardMaterial).map;
    });
    const like = original as THREE.Texture | null;
    const mats = Object.fromEntries(
      (Object.entries(PALETTES) as [PaletteName, Palette][]).map(([name, p]) => {
        const map = like ? recolour(like.image as CanvasImageSource, like, p.colours) : null;
        const material = new THREE.MeshStandardMaterial({ map, roughness: 0.85, emissive: new THREE.Color("#FFFFFF"), emissiveMap: map, emissiveIntensity: SELF_LIT });
        return [name, p.glow && like ? withWindows(material, glassMask(like, p.glow[0]), p.glow) : material];
      }),
    ) as Kit["mats"];
    const made = { geo, mats };
    kits.set(gltf, made);
    return made;
  }, [gltf]);
  // The time of day: walls light themselves less after dark, and the lit windows glow more.
  useEffect(
    () =>
      onSkyLight((selfLit, lights) => {
        for (const m of Object.values(kit.mats)) {
          m.emissiveIntensity = SELF_LIT * selfLit;
          const w = m.userData.windows as Windows | undefined;
          if (w) w.glow.value = w.day + (w.night - w.day) * lights;
        }
      }),
    [kit],
  );
  return kit;
}

export const BASE = 0.3; // the plinth under a building
export const STOREY = CELL * 0.625; // a cell is 1 x 0.625 x 1, so a storey at this scale is 3.2 m
// Façade styles, picked per building so neighbours differ: [ground floor, upper floors, back].
const STYLES = [
  ["building-window-awnings", "building-windows-sills", "building-windows"],
  ["building-window-large", "building-window-balcony", "building-window"],
  ["building-windows", "building-window-sill", "building-windows"],
] as const;
export const roofHeight = CELL * 0.212; // roof-flat-top's height at this scale
// Window cells on a building: front and back rows, plus two on each side, per storey.
export const kitWindows = (cols: number, floors: number): number => (cols * 2 + 4) * floors;

// A building's walls from kit cells: cols x 2 cells per storey. Every cell carries its windows on its +z face, so
// front cells face out to the quad and back cells are turned round; the door is in the middle of the ground floor.
// The sides get window cells of their own, turned to face out, standing a little proud of the end cells (a shallow
// bay), 78% as wide as a cell so they stay behind the end cells' glass. A flat roof tops every cell, with an air-con
// unit on the back. lit: how many window cells glow, front first, then the sides, then the back, each from the ground
// floor up, so the side you see shows your progress first. state: warm, cooling or cold.
const SIDE_PROUD = CELL * 0.1 + 0.03;
const BAY = 0.78;
const SIDE_PIECES = ["building-windows", "building-windows-sills"] as const; // [ground, upper]
type Cell = { key: string; piece: string; f: number; front?: boolean; pos: [number, number]; turn: number; scale: number | [number, number, number] };
export function KitShell({ cols, floors, lit, state, style }: { cols: number; floors: number; lit: number; state: "warm" | "cooling" | "cold"; style: number }) {
  const { geo, mats } = useKitPieces();
  const [ground, upper, back] = STYLES[style % STYLES.length] ?? STYLES[0];
  const x = (c: number) => (c - (cols - 1) / 2) * CELL;
  const cells: Cell[] = [];
  const add = (row: number, side?: number) => {
    for (let f = 0; f < floors; f++) {
      if (side) {
        for (const r of [1, 0]) {
          const pos: [number, number] = [x(side < 0 ? 0 : cols - 1) + side * SIDE_PROUD, (r - 0.5) * CELL];
          cells.push({ key: `s${side}${f}${r}`, piece: SIDE_PIECES[f === 0 ? 0 : 1], f, pos, turn: (side * Math.PI) / 2, scale: [CELL * BAY, CELL, CELL] });
        }
        continue;
      }
      for (let c = 0; c < cols; c++) {
        const door = row === 1 && f === 0 && c === Math.floor(cols / 2);
        const piece = door ? "building-door-window" : row === 0 ? (f === 0 ? back : upper) : f === 0 ? ground : upper;
        cells.push({ key: `${row}${f}${c}`, piece, f, front: row === 1, pos: [x(c), (row - 0.5) * CELL], turn: row === 1 ? 0 : Math.PI, scale: CELL });
      }
    }
  };
  add(1);
  add(0, 1);
  add(0, -1);
  add(0);
  const cold = state === "cold";
  const glow = state === "cooling" ? mats.cooling : mats.lit;
  const plain = cold ? mats.cold : mats.base;
  return (
    <group>
      {cells.map(({ key, piece, f, pos, turn, scale }, i) => (
        <mesh key={key} geometry={geo[piece]} material={i < lit ? (cold ? mats.coldLit : glow) : plain} position={[pos[0], BASE + f * STOREY, pos[1]]} rotation-y={turn} scale={scale} castShadow receiveShadow />
      ))}
      {[0, 1].flatMap((row) =>
        Array.from({ length: cols }, (_, c) => (
          <mesh key={`roof${row}${c}`} geometry={geo["roof-flat-top"]} material={plain} position={[x(c), BASE + floors * STOREY, (row - 0.5) * CELL]} scale={CELL} castShadow receiveShadow />
        )),
      )}
      <mesh geometry={geo[style % 2 ? "detail-ac-b" : "detail-ac-a"]} material={plain} position={[x(0) + CELL * 0.15, BASE + floors * STOREY + roofHeight, -CELL * 0.45]} scale={CELL * 0.9} castShadow />
    </group>
  );
}

// ---------- people ----------

// One of Kenney's mini characters (variant 0 to 11), animated: idle, walk, sprint, sit, emote-yes, jump and more.
// Change what they're doing through the ref (play(name, speed, once)); the clip blends over in a moment, and a clip
// played once holds its last pose. offset: seconds into the first clip, so a crowd doesn't move in step.
export type PersonApi = { play: (name: string, timeScale?: number, once?: boolean) => void };
type PersonProps = { variant?: number; action?: string; speed?: number; offset?: number; scale?: number };
export const KitPerson = forwardRef<PersonApi, PersonProps>(function KitPerson({ variant = 0, action = "idle", speed = 1, offset = 0, scale = 3 }, ref) {
  const { scene } = useModel(PEOPLE[variant % PEOPLE.length] ?? PEOPLE[0]!);
  const { animations } = useModel(ANIMS);
  const model = useMemo(() => {
    const m = cloneSkinned(scene);
    m.traverse((o) => {
      if (isMesh(o) || isSkinned(o)) o.castShadow = true;
    });
    return m;
  }, [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const current = useRef<THREE.AnimationAction | null>(null);
  const api = useMemo<PersonApi>(
    () => ({
      play(name, timeScale = 1, once = false) {
        const clip = animations.find((a) => a.name === name);
        if (!clip) return;
        const next = mixer.clipAction(clip);
        next.timeScale = timeScale;
        const loop = once ? THREE.LoopOnce : THREE.LoopRepeat;
        if (current.current === next && next.loop === loop) return;
        next.setLoop(loop, Infinity);
        next.clampWhenFinished = once;
        next.reset().play();
        if (current.current && current.current !== next) next.crossFadeFrom(current.current, 0.15, false);
        current.current = next;
      },
    }),
    [mixer, animations],
  );
  useImperativeHandle(ref, () => api, [api]);
  useEffect(() => {
    api.play(action, speed);
    if (offset && current.current) current.current.time = offset % current.current.getClip().duration;
  }, [api, action, speed, offset]);
  useEffect(() => () => void mixer.stopAllAction(), [mixer]);
  useFrame((_, dt) => mixer.update(Math.min(dt, 0.1)));
  return <primitive object={model} scale={scale} />;
});
