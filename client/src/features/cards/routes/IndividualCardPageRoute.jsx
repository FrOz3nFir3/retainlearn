import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import IndividualCardPage from "./IndividualCardPage"; // Eager load the layout component
import NotFound from "../../not-found/components/NotFound";

// The new study screens (D-17), each its own chunk: the set's classroom, and its classes at today's URLs.
const Classroom = lazy(() => import("#features/classroom/Classroom.tsx"));
const ReviewClass = lazy(() => import("#features/classes/ReviewClass.tsx"));
const QuizClass = lazy(() => import("#features/classes/QuizClass.tsx"));

// Today's editor, in its layout, until the editor is replaced (its own release, D-17).
const EditCardRoute = lazy(() => import("./EditCardRoute"));

const IndividualCardPageRoute = () => (
  <Routes>
    <Route index element={<Classroom />} />
    <Route path="review" element={<ReviewClass mode="review" />} />
    <Route path="focus-review" element={<ReviewClass mode="reviewMissed" />} />
    <Route path="quiz" element={<QuizClass mode="quiz" />} />
    <Route path="focus-quiz" element={<QuizClass mode="retryMissed" />} />

    <Route element={<IndividualCardPage />}>
      <Route path="edit" element={<EditCardRoute />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default IndividualCardPageRoute;
