// The 3D world in the app's frame (D-20): behind the campus, and behind the pages that open over it in 3D (a subject's
// page inside its building, a study set's page over its room, the subjects list), so it stays alive from one to the
// next instead of starting again with each page. useWorld (view.ts) says when and as what; the world's code comes in
// its own chunks (Campus3D.tsx, and in it scene/World.tsx), loaded only for that. Its loading screen is the campus's
// skeleton, the same frame.
import { Suspense, lazy } from "react";
import { useSaveSettingsMutation } from "./campusApi.ts";
import { Campus3DSkeleton } from "./CampusSkeleton.tsx";
import { setBroken, useWorld } from "./view.ts";

const Campus3D = lazy(() => import("./Campus3D.tsx"));

export function WorldHost() {
  const world = useWorld();
  const [save] = useSaveSettingsMutation();
  if (!world.shown) return null;
  const pick = (in3d: boolean) => {
    setBroken(false);
    void save({ view3d: in3d });
  };
  return (
    <Suspense fallback={<Campus3DSkeleton hud={world.view.kind === "campus"} />}>
      <Campus3D campus={world.campus} view={world.view} category={world.category} onPick={pick} onBroken={() => setBroken(true)} />
    </Suspense>
  );
}
