// The campus in 3D, in the app's frame (WorldHost.tsx), for a signed-in player in 3D (view.ts decides): the world
// (scene/World.tsx, its own chunk, loaded from here) fills the screen under the bars, and stays alive behind the pages
// that open over it (D-20). On the campus itself, the prototype's HUD over it: the 3D / 2D switch and the map buttons top
// right, today's timetable as a slim bar, and the coach, who walks over with news and whose talk comes up from the
// bottom as on the 2D campus. A period's Start walks you to its building, then opens the class; back
// from a finished class, its building sparkles. The clock tower says where the bell stands (a toast). While the world's
// code and models load, its loading screen. If the world can't start or the GPU gives it up (onBroken), the 2D campus
// takes over, offering 3D again.
import { Component, Suspense, lazy, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { XP } from "@retainlearn/core";
import type { Campus } from "@retainlearn/core";
import { useMyUsername } from "#app/hooks.ts";
import { Loading } from "#components/ui/Skeleton.tsx";
import { toast } from "#components/ui/Toast.tsx";
import { CAMPUS_TITLE, HUD_CONTROLS, HUD_LAYER, MapButtons, ViewSwitch, WORLD_LAYER, WorldBackdrop } from "./CampusSkeleton.tsx";
import { CoachTalk, useCoach } from "./Coach.tsx";
import type { CoachAct } from "./coach.ts";
import { skyHour, useLocalHour } from "./daytime.ts";
import { setPath } from "#features/classes/modes.ts";
import { useReportCard } from "#features/report-card/reportCardApi.ts";
import { matchesSearch, roomsPage, subjectProgress } from "#features/subjects/subjectProgress.ts";
import { useGetSubjectQuery } from "#features/subjects/subjectsApi.ts";
import { useToday } from "./campusApi.ts";
import { subjectPath } from "./subjects.ts";
import { Timetable } from "./Timetable.tsx";
import type { MapCommand, WorldView } from "./view.ts";
import type { Inside } from "./scene/Interior.tsx";
import type { ClassWalk } from "./scene/World.tsx";

const World = lazy(() => import("./scene/World.tsx"));

// view: what the world stands behind (view.ts); category: the building of a room.
type Props = { campus: Campus; view: WorldView; category: string | null; onPick: (in3d: boolean) => void; onBroken: () => void };

export default function Campus3D({ campus, view, category, onPick, onBroken }: Props) {
  const onCampus = view.kind === "campus";
  const navigate = useNavigate();
  const coach = useCoach(campus, useMyUsername(), { walksUp: true });
  const hour = skyHour(campus.player.settings.sky, useLocalHour());
  // A class from a period's Start or the coach's button: you walk to its subject's building, then the class opens (and
  // comes back here after). One at a time.
  const [walk, setWalk] = useState<ClassWalk | null>(null);
  const walkToClass = (category: string, to: string) => setWalk((w) => w ?? { category, then: () => navigate(to, { state: { returnTo: "/" } }), n: performance.now() });
  const startClass = (period: Campus["timetable"][number], to: string) => walkToClass(period.set?.category ?? "", to);
  // A walk that hasn't arrived in 20 s (a route that can't be walked, say): the class opens anyway, so Start is never
  // left waiting. The longest walk, across a big campus at a run, takes about 12 s.
  useEffect(() => {
    if (!walk) return;
    const timer = setTimeout(walk.then, 20_000);
    return () => clearTimeout(timer);
  }, [walk]);
  // The coach's buttons that open a class walk you there too; their other pages open at once.
  const coachGo = (act: CoachAct) => {
    if (!act.category) return false;
    walkToClass(act.category, act.to);
    return true;
  };
  // Back from a finished class (the class's end says which subject): its building sparkles, once; the address's state is
  // cleared, so coming back to this page later doesn't play it again.
  const location = useLocation();
  const [celebrate] = useState(() => (location.state as { celebrate?: string } | null)?.celebrate ?? null);
  useEffect(() => {
    if (celebrate) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, as the campus opens
  }, []);
  // Inside a building (its subject's page, or one of its classrooms, open over the world): its rooms, worked out by the
  // same rules as the subject's page (subjectProgress.ts), the page of them on show (the page's address, or the one a
  // classroom's set is on), and what a room does: a tap opens its classroom; the "+ New study set" room, the form.
  const [params] = useSearchParams();
  const insideOf = view.kind === "building" ? view.category : view.kind === "room" ? category : null;
  const subject = useGetSubjectQuery(insideOf ?? skipToken);
  const card = useReportCard(!insideOf);
  const when = useToday();
  const inside = useMemo((): Inside | null => {
    if (!insideOf || !subject.data || subject.data.name !== insideOf) return null;
    const { rooms } = subjectProgress(subject.data, card.data ?? null, when);
    const search = view.kind === "building" ? (params.get("search") ?? "").trim() : "";
    const found = rooms.filter((r) => matchesSearch(r.set, search));
    const asked = view.kind === "building" ? Number(params.get("page")) || null : null;
    const page = roomsPage(found, { page: asked, roomId: view.kind === "room" ? view.setId : null, search });
    const newHref = `${subjectPath(insideOf)}?new=1`;
    return { page, roomId: view.kind === "room" ? view.setId : null, onOpen: (id) => navigate(setPath(id)), onNew: () => navigate(newHref), newHref };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate is stable
  }, [insideOf, subject.data, card.data, when, view, params]);
  const [command, setCommand] = useState<MapCommand | null>(null);
  const send = (kind: MapCommand["kind"], value: number) => setCommand((c) => ({ kind, value, n: (c?.n ?? 0) + 1 }));
  const rung = campus.timetable.length > 0 && campus.timetable.every((p) => p.done);
  const tower = () => toast(rung ? "The bell's rung: today's timetable is done" : `Finish today's timetable and the bell rings: ${XP.timetableDone} bonus XP`, rung ? "bell" : "night");
  // The bell ringing (once a day, the first time you see today's timetable done): said once the coach has finished
  // talking, as a toast behind an open dialog would go unseen (guide: persistent-toast-notifications).
  const [ringing, setRinging] = useState(false);
  const talking = !!coach.line;
  useEffect(() => {
    if (!ringing || talking) return;
    toast("Timetable done: the bell rings", "bell");
    setRinging(false);
  }, [ringing, talking]);

  return (
    <div className={WORLD_LAYER}>
      {onCampus && (
        <>
          <Helmet>
            <title>{CAMPUS_TITLE}</title>
          </Helmet>
          <h1 className="sr-only">Your campus</h1>
          {/* The HUD first, so the keyboard reaches today's timetable before every place's label (it's drawn on top). */}
          <div className={HUD_LAYER}>
            <div className={HUD_CONTROLS}>
              <div className="panel pointer-events-auto rounded-2xl p-1">
                <ViewSwitch in3d onPick={onPick} />
              </div>
              <MapButtons onCommand={send} />
            </div>
            {/* It steps aside while the coach talks, in its place (the prototype's). */}
            {!talking && <Timetable campus={campus} look="slim" onStart={startClass} busy={!!walk} />}
          </div>
        </>
      )}
      <WorldBoundary onBroken={onBroken}>
        <Suspense
          fallback={
            <Loading label="Opening your campus">
              <WorldBackdrop />
            </Loading>
          }
        >
          <World
            campus={campus}
            view={view}
            category={category}
            inside={inside}
            coach={{ who: coach.who, news: coach.news, comes: onCampus && coach.comes, talking: talking, onTalk: coach.open }}
            hour={hour}
            command={command}
            walk={walk}
            celebrate={celebrate}
            onEnter={(b) => navigate(subjectPath(b.name))}
            onAddSubject={() => navigate("/subjects")}
            onReportCard={() => navigate("/report-card")}
            onTower={tower}
            onRing={() => setRinging(true)}
            onLost={onBroken}
          />
        </Suspense>
      </WorldBoundary>
      {onCampus && coach.line && <CoachTalk who={coach.who} line={coach.line} lines={coach.lines} onNext={coach.next} onDone={coach.done} onGo={coachGo} />}
    </div>
  );
}

// The world not starting (no WebGL context after all, a model that won't load): the 2D campus instead. A class
// component: React catches errors only in one of those.
class WorldBoundary extends Component<{ onBroken: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) console.error("The 3D campus didn't start:", error);
    this.props.onBroken();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
