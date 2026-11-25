import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import EditCardPageSkeleton from "../../../components/ui/skeletons/EditCardPageSkeleton";
import { ClassroomSkeleton } from "#features/classroom/ClassroomSkeleton.tsx";
import { ClassSkeleton } from "#features/classes/ClassSkeleton.tsx";

// A study set's pages, under /study-sets/:id (App.jsx). The new study screens (D-17), each its own chunk: the set's
// classroom, and its classes, named as the API names them (your decision, 2026-11-24). This file is loaded with the app,
// so each screen's skeleton shows the moment it's opened, before its code arrives (PLAN 14.15).
const Classroom = lazy(() => import("#features/classroom/Classroom.tsx"));
const ReviewClass = lazy(() => import("#features/classes/ReviewClass.tsx"));
const QuizClass = lazy(() => import("#features/classes/QuizClass.tsx"));

// Today's editor, in its layout, until the editor is replaced (its own release, D-17).
const IndividualCardPage = lazy(() => import("./IndividualCardPage"));
const EditCardRoute = lazy(() => import("./EditCardRoute"));
const NotFound = lazy(() => import("../../not-found/components/NotFound"));

const classRoute = (Class, mode, label) => (
  <Suspense fallback={<ClassSkeleton label={label} mode={mode} />}>
    <Class mode={mode} />
  </Suspense>
);

const IndividualCardPageRoute = () => (
  <Routes>
    <Route
      index
      element={
        <Suspense fallback={<ClassroomSkeleton />}>
          <Classroom />
        </Suspense>
      }
    />
    <Route path="review" element={classRoute(ReviewClass, "review", "Loading the review")} />
    <Route path="review-missed" element={classRoute(ReviewClass, "reviewMissed", "Loading the review")} />
    <Route path="quiz" element={classRoute(QuizClass, "quiz", "Loading the quiz")} />
    <Route path="retry-missed" element={classRoute(QuizClass, "retryMissed", "Loading the quiz")} />

    <Route
      element={
        <Suspense fallback={<EditCardPageSkeleton />}>
          <IndividualCardPage />
        </Suspense>
      }
    >
      <Route path="edit" element={<EditCardRoute />} />
    </Route>

    <Route
      path="*"
      element={
        <Suspense fallback={null}>
          <NotFound />
        </Suspense>
      }
    />
  </Routes>
);

export default IndividualCardPageRoute;
