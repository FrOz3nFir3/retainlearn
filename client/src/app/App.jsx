import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  ScrollRestoration,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { SiteFooter } from "#components/layout/SiteFooter.tsx";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary";
import { useSession, useSessionCheck } from "#app/session.ts";
import { TabBar } from "#components/layout/TabBar.tsx";
import { TopBar } from "#components/layout/TopBar.tsx";
import { isClassPath } from "#features/classes/modes.ts";
// Each new screen's skeleton, loaded with the app, so a screen shows it the moment it's opened, before its own code
// arrives (PLAN 14.15). The study set's routes (small) come with the app for the same reason: they hold the classroom's
// and the classes' skeletons.
import { CampusSkeleton } from "#features/campus/CampusSkeleton.tsx";
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
import IndividualCardPageRoute from "../features/cards/routes/IndividualCardPageRoute";

// Lazy-loaded route wrappers
const Subjects = lazy(() => import("#features/subjects/Subjects.tsx"));
const Subject = lazy(() => import("#features/subjects/Subject.tsx"));
const ReportCard = lazy(() => import("#features/report-card/ReportCard.tsx"));
const Profile = lazy(() => import("#features/profile/Profile.tsx"));
const PublicProfile = lazy(() => import("#features/profile/PublicProfile.tsx"));
const SignIn = lazy(() => import("#features/sign-in/SignIn.tsx"));
const Legal = lazy(() => import("#features/legal/Legal.tsx"));
const Campus = lazy(() => import("#features/campus/Campus.tsx"));

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
  <ErrorBoundary>
    <div className={`bg-gray-100 dark:bg-gray-900 min-h-dvh flex flex-col ${inClass ? "" : "max-md:pb-[calc(3.75rem+max(0.25rem,env(safe-area-inset-bottom,0px)))]"}`}>
      {!inClass && <TopBar />}
      <main className={`flex grow flex-col ${inClass ? "" : "min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)]"}`}>
        {/* A page whose code is still coming shows its own skeleton (its route's); this keeps the bars up meanwhile. */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      {!inClass && <SiteFooter />}
      {!inClass && <TabBar />}
      <Toaster />
      <ScrollRestoration
        getKey={(location, matches) => {
          // probably look into this later
          if (
            location.search.includes("cardNo") ||
            location.search.includes("quizNo") ||
            location.search.includes("flashcardFilter") ||
            location.search.includes("search") ||
            location.pathname.startsWith("/subjects")
          ) {
            return location.pathname;
          }
          return location.key;
        }}
      />
    </div>
  </ErrorBoundary>
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
        path: "study-sets/:id/*",
        element: <IndividualCardPageRoute />,
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
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
