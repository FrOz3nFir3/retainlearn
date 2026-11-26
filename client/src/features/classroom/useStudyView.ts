// What the classroom shows of each round: its review and its quiz (Both), or one of them. One of your settings when
// you're signed in, saved as you pick it (PATCH /api/campus/settings); this visit's choice for a guest.
import { useState } from "react";
import { STUDY_VIEWS } from "@retainlearn/core";
import type { StudyView } from "@retainlearn/core";
import { useCampus, useSaveSettingsMutation } from "#features/campus/campusApi.ts";

const isStudyView = (value: unknown): value is StudyView => (STUDY_VIEWS as readonly unknown[]).includes(value);

export function useStudyView(signedIn: boolean): { view: StudyView; setView: (view: StudyView) => void; loading: boolean } {
  const campus = useCampus(!signedIn);
  const [save] = useSaveSettingsMutation();
  const [guest, setGuest] = useState<StudyView>("both");
  const saved = campus.data?.player.settings.studyView;
  return {
    view: signedIn ? (isStudyView(saved) ? saved : "both") : guest,
    setView: (view) => (signedIn ? void save({ studyView: view }) : setGuest(view)),
    loading: signedIn && campus.isLoading,
  };
}
