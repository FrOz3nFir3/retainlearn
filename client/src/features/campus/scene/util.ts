// What the 3D campus's pieces share (the prototype's scene/util.js): its colours, reduced motion, shapes, where a
// building's front and door are, and signs drawn to a canvas (no font files or workers in the scene: the CSP allows
// neither blob: nor WebAssembly).
import { useEffect, useState } from "react";
import * as THREE from "three";

export const COLORS = {
  ground: "#E6E9F6",
  meadow: "#D8E9DB", // the countryside beyond the road
  hill: "#B9CFC0",
  lot: "#F3F4FB",
  path: "#FFFFFF",
  lawn: "#CDEBD6",
  road: "#D6DAEE",
  wall: "#FBFBFE",
  wallCold: "#E4E5EF",
  band: "#E4E6F6",
  indigo: "#4F46E5",
  indigoDeep: "#3B33C4",
  ink: "#1E1B4B",
  cold: "#8E92B6",
  glass: "#C9CDEB",
  lit: "#FFD36A",
  litCold: "#E4DBC0",
  amber: "#F59E0B",
  trunk: "#A3846F",
  leaf: ["#7CC99D", "#95D6AE", "#6BBE90"],
} as const;

export const prefersReducedMotion = (): boolean => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export type Place = { pos: readonly [number, number]; size: readonly [number, number] };

// A building's front faces the quad (local +z points at the middle of the campus).
export const facingCenter = ([x, z]: readonly [number, number]): number => Math.atan2(-x, -z);

// The point just outside a building's front door, in the world.
export function doorPoint(b: Place, extra = 1.8): THREE.Vector3 {
  const rot = facingCenter(b.pos);
  const dist = b.size[1] / 2 + extra;
  return new THREE.Vector3(b.pos[0] + Math.sin(rot) * dist, 0, b.pos[1] + Math.cos(rot) * dist);
}

const FONT = '"Plus Jakarta Sans Variable", system-ui, sans-serif';

// A sign drawn to a canvas texture, once the app's font has loaded (or failed to).
export function useLabelTexture(text: string, { bg = COLORS.ink as string, fg = "#FFFFFF", width = 1024, height = 200 } = {}): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let cancelled = false;
    let tex: THREE.CanvasTexture | undefined;
    const draw = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 36);
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.font = `700 ${Math.round(height * 0.46)}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, height / 2 + 4);
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      setTexture(tex);
    };
    document.fonts.load(`700 80px ${FONT}`).then(draw, draw);
    return () => {
      cancelled = true;
      tex?.dispose();
    };
  }, [text, bg, fg, width, height]);
  return texture;
}

// Words broken into lines no wider than max, at this context's font.
function wrap(ctx: CanvasRenderingContext2D, words: readonly string[], max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(next).width <= max) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// A classroom's whiteboard with the study set's name on it: up to two lines, as large as fits, and a stroke in the
// subject's colour underneath. 512 x 200, so the board is 2.56 times as wide as it is tall.
export const BOARD_ASPECT = 2.56;
export function useBoardTexture(text: string, accent: string = COLORS.indigo): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let cancelled = false;
    let tex: THREE.CanvasTexture | undefined;
    const draw = () => {
      if (cancelled) return;
      const canvas = Object.assign(document.createElement("canvas"), { width: 512, height: 200 });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#FCFCFF";
      ctx.fillRect(0, 0, 512, 200);
      const words = text.split(/\s+/).filter(Boolean);
      let size = 60;
      let lines: string[] = [];
      for (; size >= 24; size -= 4) {
        ctx.font = `700 ${size}px ${FONT}`;
        lines = wrap(ctx, words, 460);
        if (lines.length <= 2) break;
      }
      if (lines.length > 2) lines = [lines[0] ?? "", `${lines[1] ?? ""}…`];
      ctx.fillStyle = COLORS.ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lineHeight = size * 1.12;
      lines.forEach((l, i) => ctx.fillText(l, 256, 88 + (i - (lines.length - 1) / 2) * lineHeight, 480));
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(196, 160, 120, 10, 5);
      ctx.fill();
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      setTexture(tex);
    };
    document.fonts.load(`700 60px ${FONT}`).then(draw, draw);
    return () => {
      cancelled = true;
      tex?.dispose();
    };
  }, [text, accent]);
  return texture;
}
