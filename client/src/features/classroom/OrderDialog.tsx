// Your order of a set's topics (the prototype's OrderModal), in a wide dialog: a long list to rearrange needs room.
// Each topic is a flashcard, and its quiz questions move with it, so review and quiz rounds change together; "Round N"
// marks where each round starts as you go. Progress stays with each flashcard, so nothing is lost; flashcards added
// later go at the end. Saved for you alone (PUT /api/study-sets/:id/order); "Back to the author's order" undoes yours.
// Moving a topic (guide: drag-and-drop): drag it by its handle, which keeps the item in its slot, lifted under the
// pointer, with a line where it will land, and moves it once on release (Esc cancels); or its menu (to the top, up,
// down, to the bottom), the way for the keyboard and screen readers. Each move is said once in a status line.
// Closing with changes not saved asks first, in the dialog's own footer.
import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { orderedFlashcards, reviewLoad, setRounds, shortTopic } from "@retainlearn/core";
import type { StudySetContent } from "@retainlearn/core";
import { problemOf } from "#api/problem.ts";
import { Button } from "#components/ui/Button.tsx";
import { Dialog } from "#components/ui/Dialog.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Menu, MenuButton } from "#components/ui/Menu.tsx";
import { recallPoints } from "#features/classes/recallPoints.ts";
import { cx } from "#utils/cx.ts";
import { textOf } from "#utils/safeHtml.ts";
import { useSaveOrderMutation } from "./classroomApi.ts";

type Props = { set: StudySetContent; order: string[] | null; onClose: () => void };
type Drag = { id: string; pointer: number; startY: number; startScroll: number; dy: number; to: number };

const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const moved = (ids: readonly string[], id: string, to: number) => {
  const rest = ids.filter((x) => x !== id);
  return [...rest.slice(0, to), id, ...rest.slice(to)];
};

export function OrderDialog({ set, order, onClose }: Props) {
  const authors = useMemo(() => set.flashcards.map((f) => f._id), [set]);
  const initial = useMemo(() => orderedFlashcards(set.flashcards, order).map((f) => f._id), [set, order]);
  const byId = useMemo(() => new Map(set.flashcards.map((f) => [f._id, f])), [set]);
  const questions = useMemo(() => {
    const count = new Map<string, number>();
    for (const q of set.questions) if (q.flashcardId) count.set(q.flashcardId, (count.get(q.flashcardId) ?? 0) + 1);
    return count;
  }, [set]);
  const [ids, setIds] = useState(initial);
  const [leaving, setLeaving] = useState(false);
  const [said, setSaid] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [save, saving] = useSaveOrderMutation();
  const list = useRef<HTMLOListElement>(null);
  const changed = !same(ids, initial);
  const isAuthors = same(ids, authors);
  const topic = (id: string) => shortTopic(textOf(byId.get(id)?.question ?? ""));
  // Where each round starts, in the order as it stands.
  const roundStarts = useMemo(() => {
    const rounds = setRounds({ flashcards: set.flashcards, questions: set.questions }, ids, (f) => reviewLoad(recallPoints(f.answer).length));
    return new Map(rounds.filter((r) => r.flashcards[0]).map((r) => [r.flashcards[0]!._id, r.n]));
  }, [set, ids]);

  const place = (id: string, to: number) => {
    const next = moved(ids, id, Math.max(0, Math.min(ids.length - 1, to)));
    if (same(next, ids)) return;
    setIds(next);
    setSaid(`${topic(id)} is now ${next.indexOf(id) + 1} of ${next.length}.`);
  };

  // Dragging by the handle: the drop place is worked out from the other topics' middles (layout, not what's under the
  // pointer), and the scrolling dialog body scrolls near its edges.
  const scroller = () => list.current?.closest<HTMLElement>(".overflow-y-auto") ?? null;
  const dropPlace = (id: string, y: number) => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>("[data-topic]") ?? [])].filter((el) => el.dataset.topic !== id);
    return items.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2 < y;
    }).length;
  };
  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, id: string, index: number) => {
    if (e.button !== 0 || drag) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, pointer: e.pointerId, startY: e.clientY, startScroll: scroller()?.scrollTop ?? 0, dy: 0, to: index });
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const box = scroller();
    if (box) {
      const r = box.getBoundingClientRect();
      if (e.clientY < r.top + 40) box.scrollTop -= 10;
      else if (e.clientY > r.bottom - 40) box.scrollTop += 10;
    }
    setDrag({ ...drag, dy: e.clientY - drag.startY + ((box?.scrollTop ?? 0) - drag.startScroll), to: dropPlace(drag.id, e.clientY) });
  };
  const onUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    place(drag.id, drag.to);
    setDrag(null);
  };
  const cancelDrag = () => {
    if (!drag) return;
    setDrag(null);
    setSaid(`Move cancelled. ${topic(drag.id)} stays where it was.`);
  };

  // The line where a dragged topic will land: above the topic now in that place, or under the last one.
  const others = drag ? ids.filter((x) => x !== drag.id) : [];
  const lineBefore = drag && drag.to < others.length && others[drag.to] !== ids[ids.indexOf(drag.id) + 1] ? others[drag.to] : null;
  const lineAfter = drag && drag.to >= others.length && ids.indexOf(drag.id) !== ids.length - 1 ? others[others.length - 1] : null;

  const submit = async () => {
    setProblem(null);
    try {
      await save({ setId: set._id, order: isAuthors ? null : ids }).unwrap();
      onClose();
    } catch (error) {
      setProblem(problemOf(error, "Your order wasn't saved. Check your connection and try again."));
    }
  };

  return (
    <Dialog
      title="Order of topics"
      eyebrow={set.subtopic}
      onClose={onClose}
      onCloseRequest={() => {
        if (drag) {
          cancelDrag();
          return false;
        }
        if (!changed) return true;
        setLeaving(true);
        return false;
      }}
      wide
      footer={
        leaving ? (
          <>
            <span className="mr-auto self-center text-sm font-semibold text-bell-ink">Leave without saving your new order?</span>
            <Button data-autofocus onClick={() => setLeaving(false)}>
              Keep editing
            </Button>
            <Button tone="danger" onClick={onClose}>
              Discard changes
            </Button>
          </>
        ) : (
          <>
            <span className="mr-auto self-center text-xs">{changed ? <span className="font-semibold text-bell-ink">Order changed</span> : <span className="text-ink/50">No changes yet</span>}</span>
            {!isAuthors && (
              <Button size="sm" className="border-transparent bg-transparent text-brand hover:underline" onClick={() => setIds(authors)}>
                Back to the author's order
              </Button>
            )}
            <Button onClick={onClose}>Cancel</Button>
            <Button tone="primary" disabled={!changed || saving.isLoading} onClick={() => void submit()}>
              {saving.isLoading ? "Saving…" : "Save order"}
            </Button>
          </>
        )
      }
    >
      <p className="text-sm text-ink/65">Rounds follow this order, for review and quiz alike: each topic's quiz questions move with it. Drag a topic by its handle, or use its menu.</p>
      <p className="mt-1 text-xs text-ink/50">The author's order stays as it is. Yours is only for you: flashcards added later go at the end, and your progress stays with each flashcard.</p>
      {problem && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-wash px-3 py-2 text-sm text-rose-ink">
          {problem}
        </p>
      )}
      <p className="mt-3 text-xs font-semibold text-ink/50">{isAuthors ? "The author's order" : "Your order"}</p>
      <p role="status" className="sr-only">
        {said}
      </p>
      <ol ref={list} className={cx("mt-1 space-y-1.5", drag && "cursor-grabbing select-none")}>
        {ids.map((id, i) => {
          const lifted = drag?.id === id;
          const n = roundStarts.get(id);
          const count = questions.get(id) ?? 0;
          return (
            <li
              key={id}
              data-topic={id}
              style={lifted ? { translate: `0 ${drag.dy}px` } : undefined}
              className={cx(
                "relative",
                lifted && "z-10",
                lineBefore === id && "before:absolute before:inset-x-0 before:-top-1 before:h-0.5 before:rounded-full before:bg-brand",
                lineAfter === id && "after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-brand",
              )}
            >
              {n && <p className="mb-1 text-[11px] font-semibold text-brand">Round {n}</p>}
              <div className={cx("flex items-center gap-2 rounded-xl border bg-surface px-2 py-1.5", lifted ? "scale-[1.02] border-brand opacity-95 shadow-lg" : "border-ink/[0.08]")}>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onPointerDown={(e) => onDown(e, id, i)}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={cancelDrag}
                  onKeyDown={(e) => e.key === "Escape" && cancelDrag()}
                  className="cursor-grab touch-none rounded-md p-1.5 text-ink/35 select-none hover:bg-ink/[0.05] hover:text-ink/70 active:cursor-grabbing"
                >
                  <Icon name="grip" className="size-4" />
                </button>
                <span className="w-6 shrink-0 text-right text-xs font-semibold text-ink/45 tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{topic(id)}</p>
                  {count > 0 && <p className="text-[11px] text-ink/50">{count === 1 ? "1 quiz question" : `${count} quiz questions`}</p>}
                </div>
                <Menu label={`Move ${topic(id)}`} trigger={<Icon name="more" className="size-4" />} triggerClassName="grid size-8 place-items-center rounded-lg text-ink/55 hover:bg-ink/[0.05] hover:text-ink">
                  {i > 0 && (
                    <MenuButton icon="arrowUp" onSelect={() => place(id, 0)}>
                      Move to the top
                    </MenuButton>
                  )}
                  {i > 0 && (
                    <MenuButton icon="chevronUp" onSelect={() => place(id, i - 1)}>
                      Move up
                    </MenuButton>
                  )}
                  {i < ids.length - 1 && (
                    <MenuButton icon="chevronDown" onSelect={() => place(id, i + 1)}>
                      Move down
                    </MenuButton>
                  )}
                  {i < ids.length - 1 && (
                    <MenuButton icon="arrowDown" onSelect={() => place(id, ids.length - 1)}>
                      Move to the bottom
                    </MenuButton>
                  )}
                </Menu>
              </div>
            </li>
          );
        })}
      </ol>
    </Dialog>
  );
}
