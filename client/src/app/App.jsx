import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  ScrollRestoration,
  useLocation,
} from "react-router-dom";

import { SiteFooter } from "#components/layout/SiteFooter.tsx";
import { CrashScreen } from "#components/layout/CrashScreen.tsx";
import { useSession, useSessionCheck } from "#app/session.ts";
import { TabBar } from "#components/layout/TabBar.tsx";
import { TopBar } from "#components/layout/TopBar.tsx";
import { Toasts } from "#components/ui/Toast.tsx";
import { WorldHost } from "#features/campus/WorldHost.tsx";
import { isClassPath } from "#features/classes/modes.ts";
// Each screen's skeleton, loaded with the app, so a screen shows it the moment it's opened, before its own code
// arrives (PLAN 14.15).
import { CampusSkeleton } from "#features/campus/CampusSkeleton.tsx";
import { ClassroomSkeleton } from "#features/classroom/ClassroomSkeleton.tsx";
import { ClassSkeleton } from "#features/classes/ClassSkeleton.tsx";
import { EditorSkeleton } from "#features/editor/EditorSkeleton.tsx";
import { ReportCardSkeleton } from "#features/report-card/ReportCardSkeleton.tsx";
import { SubjectSkeleton } from "#features/subjects/SubjectSkeleton.tsx";
import { SubjectsSkeleton } from "#features/subjects/SubjectsSkeleton.tsx";
import { SignInSkeleton } from "#features/sign-in/SignInSkeleton.tsx";
// The home page for visitors comes with the app: most of them land there.
import Landing from "#features/landing/Landing.tsx";
import { LegalSkeleton } from "#features/legal/LegalSkeleton.tsx";
import NoSuchPage from "#features/not-found/NoSuchPage.tsx";
import { ProfileSkeleton } from "#features/profile/ProfileSkeleton.tsx";
import { PublicProfileSkeleton } from "#features/profile/PublicProfileSkeleton.tsx";

// Lazy-loaded route wrappers
const Subjects = lazy(() => import("#features/subjects/Subjects.tsx"));
const Subject = lazy(() => import("#features/subjects/Subject.tsx"));
const ReportCard = lazy(() => import("#features/report-card/ReportCard.tsx"));
const Profile = lazy(() => import("#features/profile/Profile.tsx"));
const PublicProfile = lazy(() => import("#features/profile/PublicProfile.tsx"));
const SignIn = lazy(() => import("#features/sign-in/SignIn.tsx"));
const Legal = lazy(() => import("#features/legal/Legal.tsx"));
const Campus = lazy(() => import("#features/campus/Campus.tsx"));
// A study set's pages, under /study-sets/:id: its classroom, its classes (named as the API names them) and its editor.
const Classroom = lazy(() => import("#features/classroom/Classroom.tsx"));
const ReviewClass = lazy(() => import("#features/classes/ReviewClass.tsx"));
const QuizClass = lazy(() => import("#features/classes/QuizClass.tsx"));
const Editor = lazy(() => import("#features/editor/Editor.tsx"));

const classRoute = (Class, mode, label) => (
  <Suspense fallback={<ClassSkeleton label={label} mode={mode} />}>
    <Class mode={mode} />
  </Suspense>
);

// "/": the campus for a signed-in player (its skeleton while the session is checked), the landing page for a visitor.
const HomeRoute = () =>
  useSession() === "out" ? (
    <Landing />
  ) : (
    <Suspense fallback={<CampusSkeleton />}>
      <Campus />
    </Suspense>
  );

// The root layout: the top bar, the page, the footer, and on phones the tab bar; a class, and signing in or up, take
// the whole screen instead. The page area is at least the screen's height under the top bar, so the footer always
// starts below the fold: a page that grows as it loads never moves it into view and out again. The session is checked
// once, here, as the app opens (app/session.ts).
const RootLayout = () => {
  useSessionCheck();
  const { pathname } = useLocation();
  // A class, and signing in or up, take the whole screen: no bars.
  const inClass = isClassPath(pathname) || pathname === "/sign-in" || pathname === "/sign-up";
  return (
  <CrashScreen>
    <div className={`bg-chalk min-h-dvh flex flex-col ${inClass ? "" : "max-md:pb-[calc(3.75rem+max(0.25rem,env(safe-area-inset-bottom,0px)))]"}`}>
      {!inClass && <TopBar />}
      <main className={`flex grow flex-col ${inClass ? "" : "min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)]"}`}>
        {/* A page whose code is still coming shows its own skeleton (its route's); this keeps the bars up meanwhile. */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      {/* The 3D world, behind the pages it stands behind (D-20). */}
      {!inClass && <WorldHost />}
      {!inClass && <SiteFooter />}
      {!inClass && <TabBar />}
      <Toasts />
      <ScrollRestoration
        getKey={(location, matches) => {
          // Pages whose address changes as you use them (a search, the editor's tabs and filter) keep their place.
          if (location.search.includes("search") || location.pathname.startsWith("/subjects") || location.pathname.endsWith("/edit")) {
            return location.pathname;
          }
          return location.key;
        }}
      />
    </div>
  </CrashScreen>
  );
};

// Create the router
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomeRoute />,
      },
      {
        path: "subjects",
        element: (
          <Suspense fallback={<SubjectsSkeleton />}>
            <Subjects />
          </Suspense>
        ),
      },
      {
        path: "subjects/:name",
        element: (
          <Suspense fallback={<SubjectSkeleton />}>
            <Subject />
          </Suspense>
        ),
      },
      {
        path: "study-sets/:id",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<ClassroomSkeleton />}>
                <Classroom />
              </Suspense>
            ),
          },
          { path: "review", element: classRoute(ReviewClass, "review", "Loading the review") },
          { path: "review-missed", element: classRoute(ReviewClass, "reviewMissed", "Loading the review") },
          { path: "quiz", element: classRoute(QuizClass, "quiz", "Loading the quiz") },
          { path: "retry-missed", element: classRoute(QuizClass, "retryMissed", "Loading the quiz") },
          {
            path: "edit",
            element: (
              <Suspense fallback={<EditorSkeleton />}>
                <Editor />
              </Suspense>
            ),
          },
          { path: "*", element: <NoSuchPage /> },
        ],
      },
      {
        path: "report-card",
        element: (
          <Suspense fallback={<ReportCardSkeleton />}>
            <ReportCard />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<ProfileSkeleton />}>
            <Profile />
          </Suspense>
        ),
      },
      {
        path: "profile/:username",
        element: (
          <Suspense fallback={<PublicProfileSkeleton />}>
            <PublicProfile />
          </Suspense>
        ),
      },
      {
        path: "sign-in",
        element: (
          <Suspense fallback={<SignInSkeleton mode="sign-in" />}>
            <SignIn mode="sign-in" />
          </Suspense>
        ),
      },
      {
        path: "sign-up",
        element: (
          <Suspense fallback={<SignInSkeleton mode="sign-up" />}>
            <SignIn mode="sign-up" />
          </Suspense>
        ),
      },
      {
        path: "privacy",
        element: (
          <Suspense fallback={<LegalSkeleton kind="privacy" />}>
            <Legal kind="privacy" />
          </Suspense>
        ),
      },
      {
        path: "terms",
        element: (
          <Suspense fallback={<LegalSkeleton kind="terms" />}>
            <Legal kind="terms" />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: <NoSuchPage />,
      },
    ],
  },
]);

import { HelmetProvider } from "@dr.pogodin/react-helmet";

function App() {
  return (
    <HelmetProvider>
      <CrashScreen>
        <RouterProvider router={router} />
      </CrashScreen>
    </HelmetProvider>
  );
}

export default App;
