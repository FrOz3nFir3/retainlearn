import {
  BookOpenIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import {
  BookOpenIcon as BookOpenSolid,
  AcademicCapIcon as AcademicCapSolid,
  PencilSquareIcon as PencilSquareSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverSolid,
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckSolid,
} from "@heroicons/react/24/solid";
import ActionCard from "./ActionCard";
import { useSelector } from "react-redux";
import { selectCurrentCard } from "../state/cardSlice";

const CardActions = ({ layout = "vertical", isRelative = false }) => {
  const card = useSelector(selectCurrentCard);

  const reviewLength = card?.review?.length || card?.reviewLength || 0;
  const quizzesLength = card?.quizzes?.length || card?.quizzesLength || 0;
  const reviewQueueLength = card?.reviewQueue?.length || card?.reviewQueueLength || 0;

  const getActionPath = (action) => (isRelative ? action : `../${action}`);

  const containerClasses = {
    vertical: "grid grid-cols-1 sm:grid-cols-2 gap-4",
    horizontal: "grid grid-cols-1 lg:grid-cols-2 gap-3",
  };

  return (
    <div className={containerClasses[layout]}>
      <ActionCard
        to={getActionPath("review")}
        icon={BookOpenIcon}
        solidIcon={BookOpenSolid}
        title="Review"
        subtitle="Study mode"
        description="Master your flashcards with spaced repetition"
        layout={layout}
        stats={[{ value: reviewLength, label: "flashcards", icon: BookOpenSolid }]}
      />

      <ActionCard
        to={getActionPath("quiz")}
        icon={AcademicCapIcon}
        solidIcon={AcademicCapSolid}
        title="Quiz"
        subtitle="Challenge mode"
        description="Test your knowledge with interactive questions"
        layout={layout}
        stats={[{ value: quizzesLength, label: "quizzes", icon: AcademicCapSolid }]}
      />

      <ActionCard
        to={getActionPath("edit?view=review-queue")}
        icon={ClipboardDocumentCheckIcon}
        solidIcon={ClipboardDocumentCheckSolid}
        title="Review queue"
        subtitle="Collaboration"
        description="Review and approve changes from other users"
        layout={layout}
        className={layout === "vertical" ? "sm:col-span-2" : "lg:col-span-2"}
        stats={[{ value: reviewQueueLength, label: "pending", icon: ClipboardDocumentCheckSolid }]}
      />

      <ActionCard
        to={getActionPath("edit?view=flashcards")}
        icon={PencilSquareIcon}
        solidIcon={PencilSquareSolid}
        title="Edit flashcards"
        subtitle="Create mode"
        description="Build and organise your flashcard collection"
        layout={layout}
      />

      <ActionCard
        to={getActionPath("edit?view=quizzes")}
        icon={WrenchScrewdriverIcon}
        solidIcon={WrenchScrewdriverSolid}
        title="Edit quizzes"
        subtitle="Create mode"
        description="Create and customise your quiz questions"
        layout={layout}
      />
    </div>
  );
};

export default CardActions;
