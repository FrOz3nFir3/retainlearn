// The 3D world in the app's frame (D-20): behind the campus, and behind the pages that open over it in 3D (a subject's
// page inside its building, a study set's page over its room, the subjects list), so it stays alive from one to the
// next instead of starting again with each page. useWorld (view.ts) says when and as what; the world's code comes in
// its own chunks (Campus3D.tsx, and in it scene/World.tsx), loaded only for that. Its loading screen is the campus's
// skeleton, the same frame: while the code loads, and while the campus's data does on a page opened straight from its
// address (this browser's guess). It also keeps this browser's copy of your campus's subjects, which such a page's
// skeleton goes by, in 3D or 2D.
import { Suspense, lazy, useEffect } from "react";
import { useSession } from "#app/session.ts";
import { useCampus, useSaveSettingsMutation } from "./campusApi.ts";
import { Campus3DSkeleton } from "./CampusSkeleton.tsx";
import { keepSubjects, setBroken, useWorld } from "./view.ts";

const Campus3D = lazy(() => import("./Campus3D.tsx"));

export function WorldHost() {
  const world = useWorld();
  const [save] = useSaveSettingsMutation();
  const campus = useCampus(useSession() !== "in").data;
  useEffect(() => {
    if (campus) keepSubjects(campus.subjects.map((s) => s.category));
  }, [campus]);
  if (!world.shown) return null;
  const hud = world.view.kind === "campus";
  if (!world.campus) return <Campus3DSkeleton hud={hud} />;
  const pick = (in3d: boolean) => {
    setBroken(false);
    void save({ view3d: in3d });
  };
  return (
    <Suspense fallback={<Campus3DSkeleton hud={hud} />}>
      <Campus3D campus={world.campus} view={world.view} category={world.category} onPick={pick} onBroken={() => setBroken(true)} />
    </Suspense>
  );
}
