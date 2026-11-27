// Inside a subject's building (the prototype's Building.jsx Interior, Room, AddRoom, Lobby and EmptyRoom): the same
// kit building with its front half taken away (KitShell open), the lobby on the ground floor, then this page of the
// subject's study sets in classrooms, 3 to a floor (subjectProgress.ts roomsPage, the lobby panel's lift). On the first
// page that's the building you saw outside; a later page, or a search, shows the floors it needs. Each room shows how
// you're doing with its set: the lights on once you've started, a yellow sticky note on the board for each thing you
// missed (up to 5), a trophy on the teacher's desk once it's mastered, and classmates at the desks when you've studied
// it in the last few days. A tap on a room opens its classroom; its label is its link, for the keyboard and screen
// readers. A tap anywhere on the building stays with it: nothing behind it answers.
import { Suspense, useState } from "react";
import type { ReactNode } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { Chip } from "#components/ui/Chip.tsx";
import { setPath } from "#features/classes/modes.ts";
import { SETS_PER_PAGE } from "#features/subjects/subjectProgress.ts";
import type { Room as RoomData, RoomsPage } from "#features/subjects/subjectProgress.ts";
import { SET_STATUS_TONE } from "../subjects.ts";
import { BASE, KitShell, OPEN_WALL, STOREY, roofHeight } from "./kit.tsx";
import { Label, PlaceLink } from "./Label.tsx";
import { StepBadge } from "#features/paths/StepBadge.tsx";
import type { StepBadgeInfo } from "#features/paths/pathView.ts";
import { ROOMS_PER_FLOOR, classFloors, storeys } from "./layout.ts";
import type { CampusBuilding } from "./layout.ts";
import { Seated } from "./People.tsx";
import { BOARD_ASPECT, COLORS, useBoardTexture } from "./util.ts";

const mat = {
  plinth: new THREE.MeshStandardMaterial({ color: "#DCE0F2", roughness: 1 }),
  slab: new THREE.MeshStandardMaterial({ color: "#E9EBF6", roughness: 0.95 }),
  // The same white and indigo as the outside, a little self-lit so walls in their own shade still read white.
  inWall: new THREE.MeshStandardMaterial({ color: "#F7F7FC", emissive: "#F7F7FC", emissiveIntensity: 0.22, roughness: 0.9 }),
  trim: new THREE.MeshStandardMaterial({ color: COLORS.indigo, roughness: 0.7 }),
  frame: new THREE.MeshStandardMaterial({ color: COLORS.indigoDeep, roughness: 0.6 }),
  daylight: new THREE.MeshStandardMaterial({ color: "#D6E7FA", emissive: "#C4DCF6", emissiveIntensity: 0.45, roughness: 0.3 }),
  sill: new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 0.6 }),
  desk: new THREE.MeshStandardMaterial({ color: "#E7D2AE", roughness: 0.8 }),
  chair: new THREE.MeshStandardMaterial({ color: "#5B5F8F", roughness: 0.7 }),
  pane: new THREE.MeshStandardMaterial({ color: "#CFE6F7", emissive: "#BFE0F7", emissiveIntensity: 0.25, roughness: 0.3 }),
  note: new THREE.MeshStandardMaterial({ color: "#FFD45C", roughness: 0.8, side: THREE.DoubleSide }),
  gold: new THREE.MeshStandardMaterial({ color: "#F2B530", metalness: 0.35, roughness: 0.35 }),
  lampOn: new THREE.MeshStandardMaterial({ color: "#FFE8B0", emissive: "#FFC860", emissiveIntensity: 0.8 }),
  lampOff: new THREE.MeshStandardMaterial({ color: "#D9DCE8", roughness: 0.6 }),
  bare: new THREE.MeshStandardMaterial({ color: "#E9EBF5", roughness: 0.95 }), // an empty room's floor
  blank: new THREE.MeshStandardMaterial({ color: "#DADDEC", roughness: 0.8 }), // its board, nothing on it
  lobbyFloor: new THREE.MeshStandardMaterial({ color: "#F1ECE6", roughness: 0.9 }),
  liftDoor: new THREE.MeshStandardMaterial({ color: "#C9CCE0", metalness: 0.2, roughness: 0.45 }),
};

// The page of the building shown inside, and what its rooms do. roomId: the room whose classroom is open (picked out).
// newHref: the address that opens the "+ New study set" form (onNew does it in the app).
// badges: each room's place in the path you follow, when it's this subject's (paths/pathView.ts, stepBadges).
export type Inside = { page: RoomsPage; roomId: string | null; onOpen: (setId: string) => void; onNew: () => void; newHref: string; badges?: ReadonlyMap<string, StepBadgeInfo> };
export type ShellLook = { cols: number; lit: number; state: "warm" | "cooling" | "cold"; style: number };

const FLOORS_PER_PAGE = SETS_PER_PAGE / ROOMS_PER_FLOOR;

// How many floors this page of the building shows: the lobby, then a floor for each 3 rooms (with the new set's room).
export const floorsInside = (page: RoomsPage): number => storeys(page.items.length + (page.newRoom ? 1 : 0));

// pennant: the building's flag on its roof (given the roof's height), as outside; lobby: how many people study there.
type Props = { b: CampusBuilding; rot: number; shell: ShellLook; lobby: number; sign: THREE.Texture | null; inside: Inside; pennant: (roofTop: number) => ReactNode };
export function Interior({ b, rot, shell, lobby, sign, inside, pennant }: Props) {
  const [w, d] = b.size;
  const rw = w / ROOMS_PER_FLOOR;
  const { page } = inside;
  const slotsUsed = page.items.length + (page.newRoom ? 1 : 0);
  const floors = storeys(slotsUsed);
  // The rooms fill the front half, against the back half's own walls (the middle of the building).
  const wallZ = 0;
  const front = d / 2;
  const deep = front - wallZ;
  // Room i: on the classroom floors, the first of them just above the lobby.
  const roomAt = (i: number) => ({ x: -w / 2 + rw * ((i % ROOMS_PER_FLOOR) + 0.5), y: BASE + (1 + Math.floor(i / ROOMS_PER_FLOOR)) * STOREY });
  const room = { rw, back: wallZ + 0.01, front };
  const firstFloor = (page.page - 1) * FLOORS_PER_PAGE; // the lift: page 2 is floors 4 to 6
  return (
    <group position={[b.pos[0], 0, b.pos[1]]} rotation-y={rot} onClick={(e: ThreeEvent<MouseEvent>) => e.stopPropagation()}>
      <mesh position-y={BASE / 2} receiveShadow material={mat.plinth}>
        <boxGeometry args={[w + 1.4, BASE, d + 1.4]} />
      </mesh>
      <Suspense fallback={null}>
        <KitShell {...shell} floors={floors} open />
      </Suspense>
      {pennant(BASE + floors * STOREY + roofHeight)}
      {/* Each floor: a slab with indigo trim along its open edge, daylight windows in the end walls (where the windows
          are outside) and, above the lobby, walls between the rooms. */}
      {Array.from({ length: floors }, (_, f) => {
        const y = BASE + f * STOREY;
        return (
          <group key={f}>
            <mesh position={[0, y + 0.1, (wallZ + front) / 2]} receiveShadow material={mat.slab}>
              <boxGeometry args={[w - 0.02, 0.2, deep + 0.02]} />
            </mesh>
            <mesh position={[0, y + 0.1, front]} material={mat.trim}>
              <boxGeometry args={[w + 0.04, 0.26, 0.14]} />
            </mesh>
            {[-1, 1].flatMap((sx) =>
              [wallZ + deep * 0.3, wallZ + deep * 0.72].map((z) => (
                <group key={`${sx}${z}`} position={[sx * (w / 2 - OPEN_WALL - 0.01), y + 1.75, z]} rotation-y={(-sx * Math.PI) / 2}>
                  <mesh material={mat.sill}>
                    <boxGeometry args={[1.9, 1.75, 0.04]} />
                  </mesh>
                  <mesh position-z={0.03} material={mat.daylight}>
                    <planeGeometry args={[1.6, 1.45]} />
                  </mesh>
                  <mesh position={[0, -0.92, 0.1]} material={mat.sill}>
                    <boxGeometry args={[2.1, 0.1, 0.24]} />
                  </mesh>
                </group>
              )),
            )}
            {f > 0 &&
              [1, 2].map((k) => (
                <mesh key={k} position={[-w / 2 + k * rw, y + STOREY * 0.5, (wallZ + front - 0.9) / 2]} material={mat.inWall}>
                  <boxGeometry args={[0.2, STOREY, deep - 0.9]} />
                </mesh>
              ))}
            {/* Beside the building, so not on phones, where it fills the width (the lobby panel names the floors). */}
            <Label position={[-w / 2 - 1.2, y + STOREY / 2, front]}>
              <div className="hidden sm:block" aria-hidden="true">
                <div className="scene-chip px-2! py-1! text-[10px]! text-ink/60">{f ? `Floor ${firstFloor + f}` : "Lobby"}</div>
              </div>
            </Label>
          </group>
        );
      })}
      <Lobby w={w} back={wallZ + 0.01} front={front} people={lobby} sign={sign} accent={b.pennant} />
      {page.items.map((r, i) => (
        <Room key={r.set._id} room={r} {...roomAt(i)} {...room} selected={r.set._id === inside.roomId} accent={b.pennant} seed={i} onOpen={inside.onOpen} badge={inside.badges?.get(r.set._id)} />
      ))}
      {page.newRoom && <NewRoom {...roomAt(page.items.length)} {...room} href={inside.newHref} onNew={inside.onNew} />}
      {Array.from({ length: classFloors(slotsUsed) * ROOMS_PER_FLOOR - slotsUsed }, (_, k) => (
        <EmptyRoom key={k} {...roomAt(slotsUsed + k)} {...room} />
      ))}
    </group>
  );
}

// Desks in two rows, measured from the board.
const DESKS: readonly (readonly [number, number])[] = [
  [-0.75, 1.6],
  [0.75, 1.6],
  [-0.75, 2.8],
  [0.75, 2.8],
];
const boardSize = (rw: number): [number, number] => {
  const w = Math.min(rw * 0.66, 3.4);
  return [w, w / BOARD_ASPECT];
};
// Low enough that the floor above never hides it from the camera.
const boardHeight = (boardH: number) => 0.62 + boardH / 2 + 0.3;
const hover = (on: (v: boolean) => void) => ({
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    on(true);
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    on(false);
    document.body.style.cursor = "";
  },
});
const pct = (x: number) => Math.round(x * 100);

type RoomProps = { room: RoomData; x: number; y: number; rw: number; back: number; front: number; selected: boolean; accent: string; seed: number; onOpen: (setId: string) => void; badge: StepBadgeInfo | undefined };
// A classroom, from its back wall (back) to the open front: the subject's colour along the back wall, a whiteboard with
// the set's name, desks with chairs, and the room itself showing how you're doing with it.
function Room({ room, x, y, rw, back, front, selected, accent, seed, onOpen, badge }: RoomProps) {
  const { set, stats, status } = room;
  const [hov, setHov] = useState(false);
  const lightOn = stats.started && !stats.empty;
  const floorColor = stats.empty ? "#FBF1E6" : !stats.started ? "#EEF0F7" : stats.mastery > 0.5 ? "#FFF3DC" : "#F8F1E4";
  const board = useBoardTexture(set.subtopic, accent);
  const [boardW, boardH] = boardSize(rw);
  const mid = (back + front) / 2;
  const notes = status.key === "missed" ? Math.min(5, stats.missedFlashcards + stats.missedQuestions) : 0;
  const classmates = !stats.started || stats.daysAgo == null ? 0 : stats.daysAgo <= 1 ? 2 : stats.daysAgo <= 3 ? 1 : 0;
  const pane = rw - boardW > 2.4 ? Math.min(0.9, (rw - boardW) / 2 - 0.5) : 0;
  const boardY = boardHeight(boardH);
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0.22, mid]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[rw - 0.3, front - back - 0.1]} />
        <meshStandardMaterial color={hov || selected ? "#E7E9FF" : floorColor} />
      </mesh>
      <mesh position={[0, 0.3, back + 0.005]}>
        <planeGeometry args={[rw - 0.3, 0.16]} />
        <meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>
      {/* The board, framed in the subject's colour, with a sticky note for each thing missed. */}
      <group position={[0, boardY, back]}>
        <mesh>
          <boxGeometry args={[boardW + 0.18, boardH + 0.18, 0.05]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>
        {board && (
          <mesh position-z={0.03}>
            <planeGeometry args={[boardW, boardH]} />
            <meshBasicMaterial map={board} toneMapped={false} />
          </mesh>
        )}
        {Array.from({ length: notes }, (_, i) => (
          <mesh key={i} position={[boardW / 2 - 0.16 - (i % 3) * 0.26, boardH / 2 - 0.14 - Math.floor(i / 3) * 0.26, 0.045]} rotation-z={((i * 37) % 9) / 40 - 0.1} material={mat.note}>
            <planeGeometry args={[0.2, 0.2]} />
          </mesh>
        ))}
      </group>
      {pane > 0 &&
        [-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * (boardW / 2 + 0.35 + pane / 2), boardY, back + 0.01]} material={mat.pane}>
            <planeGeometry args={[pane, 1.1]} />
          </mesh>
        ))}
      {/* The teacher's desk stands to one side, so it never hides the board; a trophy on it once the set's mastered. */}
      <mesh position={[-rw / 2 + 0.95, 0.65, back + 0.75]} castShadow material={mat.frame}>
        <boxGeometry args={[1.2, 0.7, 0.55]} />
      </mesh>
      {status.key === "mastered" && (
        <group position={[-rw / 2 + 1.25, 1, back + 0.75]}>
          <mesh position-y={0.04} material={mat.gold}>
            <cylinderGeometry args={[0.09, 0.11, 0.08, 12]} />
          </mesh>
          <mesh position-y={0.2} material={mat.gold}>
            <cylinderGeometry args={[0.13, 0.05, 0.24, 14]} />
          </mesh>
        </group>
      )}
      {DESKS.map(([dx, dz], i) => (
        <group key={i} position={[dx, 0, back + dz]}>
          <mesh position-y={0.45} castShadow material={mat.desk}>
            <boxGeometry args={[0.95, 0.45, 0.6]} />
          </mesh>
          <mesh position={[0, 0.42, 0.52]} material={mat.chair}>
            <boxGeometry args={[0.5, 0.07, 0.42]} />
          </mesh>
          <mesh position={[0, 0.66, 0.72]} material={mat.chair}>
            <boxGeometry args={[0.5, 0.42, 0.06]} />
          </mesh>
          {i < classmates && (
            <group position={[0, 0, 0.52]}>
              <Seated seed={seed * 4 + i} />
            </group>
          )}
        </group>
      ))}
      <mesh position={[0, STOREY - 0.12, mid]} rotation-x={Math.PI / 2} material={lightOn ? mat.lampOn : mat.lampOff}>
        <planeGeometry args={[rw * 0.5, 0.5]} />
      </mesh>
      {selected && (
        <mesh position={[0, STOREY / 2, front - 0.05]}>
          <boxGeometry args={[rw - 0.2, STOREY - 0.1, 0.06]} />
          <meshBasicMaterial color="#6366F1" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      )}
      <mesh
        position={[0, STOREY / 2, mid]}
        visible={false}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta < 6) onOpen(set._id);
        }}
        {...hover(setHov)}
      >
        <boxGeometry args={[rw - 0.2, STOREY, front - back - 0.1]} />
      </mesh>
      {/* The board names the room; its label says how you're doing in it (its one status, and on wider screens how much
          you've mastered), low in the room just inside the open front, so it never covers a board. It's the room's
          link, too. */}
      <Label position={[0, 0.35, front - 1.1]}>
        <PlaceLink
          href={setPath(set._id)}
          label={`${set.subtopic}: ${status.label}${badge ? `, path step ${badge.n}` : ""}`}
          go={() => onOpen(set._id)}
          rank={null}
          chip={false}
          className={`flex items-center gap-1 rounded-full bg-surface p-1 shadow-[0_8px_18px_-8px_rgb(30_27_75/0.45)] ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${selected ? "ring-2 ring-brand" : "ring-ink/10"}`}
        >
          {badge && <StepBadge badge={badge} compact />}
          <Chip tone={SET_STATUS_TONE[status.key]} className="px-1.5! text-[10px]!">
            {status.label}
          </Chip>
          {stats.started && !stats.empty && (
            <span className="mx-0.5 hidden h-1.5 w-10 overflow-hidden rounded-full bg-ink/10 sm:block" aria-hidden="true">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(6, pct(stats.mastery))}%` }} />
            </span>
          )}
        </PlaceLink>
      </Label>
    </group>
  );
}

// The room after the last set, while there's space on the last page: a tap (or its label, a link) opens the form for a
// new study set.
function NewRoom({ x, y, rw, back, front, href, onNew }: { x: number; y: number; rw: number; back: number; front: number; href: string; onNew: () => void }) {
  const mid = (back + front) / 2;
  const [hov, setHov] = useState(false);
  return (
    <group position={[x, y, 0]}>
      <mesh
        position={[0, STOREY / 2, mid]}
        visible={false}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta < 6) onNew();
        }}
        {...hover(setHov)}
      >
        <boxGeometry args={[rw - 0.2, STOREY, front - back - 0.1]} />
      </mesh>
      <mesh position={[0, 0.22, mid]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[rw - 0.3, front - back - 0.1]} />
        <meshStandardMaterial color={hov ? "#E7E9FF" : "#F1F2FB"} />
      </mesh>
      <Label position={[0, STOREY / 2, front]}>
        <PlaceLink href={href} go={onNew} rank={null} className="scene-chip-ghost text-[11px]!">
          + New study set
        </PlaceLink>
      </Label>
    </group>
  );
}

// The lobby, on the ground floor behind the door: the front desk with the subject's name on it, the subject's colour
// along the back wall, the lift (it takes you up to the next page of classrooms) and tables where people sit and study,
// facing out: up to four, busier the more alive the subject is for you. Everything stays low, where the floor above
// doesn't hide it and the classrooms' labels don't cover it.
function Lobby({ w, back, front, people, sign, accent }: { w: number; back: number; front: number; people: number; sign: THREE.Texture | null; accent: string }) {
  const mid = (back + front) / 2;
  const tableX = Math.min(w * 0.3, 4.6);
  return (
    <group position-y={BASE}>
      <mesh position={[0, 0.22, mid]} rotation-x={-Math.PI / 2} receiveShadow material={mat.lobbyFloor}>
        <planeGeometry args={[w - 2 * OPEN_WALL - 0.1, front - back - 0.1]} />
      </mesh>
      <mesh position={[0, 0.3, back + 0.005]}>
        <planeGeometry args={[w - 2 * OPEN_WALL - 0.1, 0.16]} />
        <meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.72, back + 1.4]} castShadow material={mat.frame}>
        <boxGeometry args={[2.8, 1, 0.7]} />
      </mesh>
      {sign && (
        <mesh position={[0, 0.74, back + 1.76]}>
          <planeGeometry args={[2.6, 2.6 / 5.12]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      )}
      <group position={[w / 2 - OPEN_WALL - 1.4, 0, back + 0.03]}>
        <mesh position-y={1.3} material={mat.trim}>
          <boxGeometry args={[1.8, 2.2, 0.06]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.38, 1.2, 0.04]} material={mat.liftDoor}>
            <planeGeometry args={[0.72, 1.8]} />
          </mesh>
        ))}
        <mesh position={[0, 2.22, 0.04]} material={mat.lampOn}>
          <planeGeometry args={[0.44, 0.12]} />
        </mesh>
      </group>
      {[-1, 1].map((side, t) => (
        <group key={side} position={[side * tableX, 0, mid + 0.5]}>
          <mesh position-y={0.62} castShadow material={mat.desk}>
            <boxGeometry args={[2.4, 0.08, 0.9]} />
          </mesh>
          <mesh position-y={0.31} material={mat.desk}>
            <boxGeometry args={[2.1, 0.6, 0.1]} />
          </mesh>
          {[-0.6, 0.6].map((cx, c) => (
            <group key={cx} position={[cx, 0, -0.62]}>
              <mesh position-y={0.42} material={mat.chair}>
                <boxGeometry args={[0.5, 0.07, 0.42]} />
              </mesh>
              <mesh position={[0, 0.66, -0.2]} material={mat.chair}>
                <boxGeometry args={[0.5, 0.42, 0.06]} />
              </mesh>
              {t * 2 + c < people && (
                <group rotation-y={Math.PI}>
                  <Seated seed={(t * 2 + c) * 3 + 1} />
                </group>
              )}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// A room no set on this page uses (at most two, on the top floor): a bare floor and a clean whiteboard.
function EmptyRoom({ x, y, rw, back, front }: { x: number; y: number; rw: number; back: number; front: number }) {
  const [boardW, boardH] = boardSize(rw);
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0.22, (back + front) / 2]} rotation-x={-Math.PI / 2} receiveShadow material={mat.bare}>
        <planeGeometry args={[rw - 0.3, front - back - 0.1]} />
      </mesh>
      <group position={[0, boardHeight(boardH), back]}>
        <mesh material={mat.blank}>
          <boxGeometry args={[boardW + 0.18, boardH + 0.18, 0.05]} />
        </mesh>
        <mesh position-z={0.03} material={mat.sill}>
          <planeGeometry args={[boardW, boardH]} />
        </mesh>
      </group>
    </group>
  );
}
