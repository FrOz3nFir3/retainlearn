// A subject's study sets as its page shows them (the prototype's BuildingHud), with your progress in each taken from
// your report card (no request of its own), worked out with the shared rules so the page agrees with the report card,
// the campus and the classroom. A set is counted with its live counts, as the campus counts it.
import { fadingCount, studySetStats, studySetStatus, subjectStats } from "@retainlearn/core";
import type { ReportCard, StudySet, StudySetStats, StudySetStatus, Subject, SubjectSet, SubjectStats, When } from "@retainlearn/core";

export type Room = { set: SubjectSet; stats: StudySetStats; status: StudySetStatus; fading: number };
export type SubjectProgress = { rooms: Room[]; stats: SubjectStats };

const counted = (category: string, set: SubjectSet): StudySet => ({ _id: set._id, category, flashcards: set.flashcards, questions: set.questions });

// Each set with your progress in it (none when signed out: card is null), and the subject's numbers across them.
export function subjectProgress(subject: Subject, card: ReportCard | null, when: When): SubjectProgress {
  const progress = Object.fromEntries((card?.sets ?? []).filter((s) => s.category === subject.name).map((s) => [s.setId, s]));
  const sets = subject.sets.map((set) => counted(subject.name, set));
  const rooms = subject.sets.map((set, i) => {
    const counts = sets[i] ?? counted(subject.name, set);
    const stats = studySetStats(counts, progress[set._id], when);
    const fading = fadingCount(counts, progress[set._id], when);
    return { set, stats, status: studySetStatus(stats, fading), fading };
  });
  return { rooms, stats: subjectStats(sets, progress, when) };
}

const missedIn = (r: Room) => r.stats.missedFlashcards + r.stats.missedQuestions;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
// The room with the most of something (the first of those level).
const mostOf = (rooms: readonly Room[], count: (r: Room) => number): Room | undefined =>
  rooms.reduce<Room | undefined>((best, r) => (!best || count(r) > count(best) ? r : best), undefined);

// Which set is next in this subject (the prototype's pickNext, before paths): the one with the most missed, then the
// most fading, then the one you're furthest into that still has flashcards to see, then the first not started. null
// when there's nothing to go back to and nothing new. why: the reason, in words.
export function upNextHere(rooms: readonly Room[]): { room: Room; why: string } | null {
  const missed = mostOf(rooms.filter((r) => r.status.key === "missed"), missedIn);
  if (missed) return { room: missed, why: `${missedIn(missed)} missed` };
  const fading = mostOf(rooms.filter((r) => r.status.key === "fading"), (r) => r.fading);
  if (fading) return { room: fading, why: `${plural(fading.fading, "player card")} fading` };
  const going = mostOf(rooms.filter((r) => r.stats.started && r.stats.unreviewed > 0), (r) => r.stats.explored);
  if (going) return { room: going, why: `${going.stats.reviewed} of ${plural(going.stats.flashcards, "flashcard")} seen so far` };
  const fresh = rooms.find((r) => !r.stats.started && !r.stats.empty);
  if (fresh) return { room: fresh, why: "Not started yet" };
  return null;
}

// The other sets that need you, after "Up next here": points or questions missed, player cards fading, or started and
// not finished, the most pressing first (the prototype's "Also needs attention"), up to three.
export function alsoNeedsAttention(rooms: readonly Room[], next: Room | null, max = 3): Room[] {
  return ordered(rooms.filter((r) => r !== next && (r.status.key === "missed" || r.status.key === "fading" || r.status.key === "inProgress")), "attention").slice(0, max);
}

// The two orders of the sets: as they were added (the building's floors), or what needs you first (most missed first
// within each status).
export type Order = "building" | "attention";
const RANK: Record<StudySetStatus["key"], number> = { missed: 0, fading: 1, inProgress: 2, new: 3, mastered: 4, empty: 5 };
export const ordered = (rooms: readonly Room[], order: Order): Room[] =>
  order === "attention" ? rooms.toSorted((a, b) => RANK[a.status.key] - RANK[b.status.key] || missedIn(b) - missedIn(a)) : [...rooms];

// A page of a subject's sets, 9 to a page: a page of the 2D list, and in 3D the classroom floors the lift shows, 3 rooms
// a floor (D-19: the two match). page: the page asked for (clamped); with none, the one a set is on (roomId), else the
// first. newRoom: the "+ New study set" room after the last set, when there's space on the last page and no search.
export const SETS_PER_PAGE = 9;
export type RoomsPage = { items: Room[]; page: number; pages: number; newRoom: boolean };
export function roomsPage(found: readonly Room[], { page, roomId = null, search = "" }: { page: number | null; roomId?: string | null; search?: string }): RoomsPage {
  const pages = Math.max(1, Math.ceil(found.length / SETS_PER_PAGE));
  const at = roomId ? found.findIndex((r) => r.set._id === roomId) : -1;
  const asked = page ?? (at >= 0 ? Math.floor(at / SETS_PER_PAGE) + 1 : 1);
  const current = Math.min(pages, Math.max(1, Math.floor(asked) || 1));
  const items = found.slice((current - 1) * SETS_PER_PAGE, current * SETS_PER_PAGE);
  return { items, page: current, pages, newRoom: current === pages && items.length < SETS_PER_PAGE && !search };
}

// Whether a set matches the search: every word typed, in its titles, in any case.
export function matchesSearch(set: SubjectSet, query: string): boolean {
  const text = `${set.subtopic} ${set.topic}`.toLocaleLowerCase();
  return query.toLocaleLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word));
}
