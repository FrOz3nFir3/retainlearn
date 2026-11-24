import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  ScrollRestoration,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Footer from "../components/layout/Footer/Footer";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary";
import { useSession, useSessionCheck } from "#app/session.ts";
import { TabBar } from "#components/layout/TabBar.tsx";
import { TopBar } from "#components/layout/TopBar.tsx";
import { isClassPath } from "#features/classes/modes.ts";

// Lazy-loaded route wrappers
const LandingPageRoute = lazy(() =>
  import("../features/home/routes/LandingPageRoute")
);
const CategoryPageRoute = lazy(() =>
  import("../features/cards/routes/CategoryPageRoute")
);
const CardsPageRoute = lazy(() =>
  import("../features/cards/routes/CardsPageRoute")
);
const IndividualCardPageRoute = lazy(() =>
  import("../features/cards/routes/IndividualCardPageRoute")
);
const ReportCard = lazy(() => import("#features/report-card/ReportCard.tsx"));
const ProfilePageRoute = lazy(() =>
  import("../features/profile/routes/ProfilePageRoute")
);
const PublicPageRoute = lazy(() =>
  import("../features/profile/routes/PublicPageRoute")
);
const AuthenticationRoute = lazy(() =>
  import("../features/authentication/routes/AuthenticationRoute")
);
const PrivacyPolicyRoute = lazy(() =>
  import("../features/home/routes/PrivacyPolicyRoute")
);
const TermsOfServiceRoute = lazy(() =>
  import("../features/home/routes/TermsOfServiceRoute")
);
const NotFoundRoute = lazy(() =>
  import("../features/not-found/routes/NotFoundRoute")
);
const Campus = lazy(() => import("#features/campus/Campus.tsx"));

// "/": the campus for a signed-in player (its skeleton while the session is checked), the landing page for a visitor.
const HomeRoute = () => (useSession() === "out" ? <LandingPageRoute /> : <Campus />);

// The root layout: the top bar, the page, and on phones the tab bar, except in a class, which takes the whole screen.
// The old footer stays on the public pages only, until the landing page is rebuilt. The session is checked once, here,
// as the app opens (app/session.ts).
const RootLayout = () => {
  useSessionCheck();
  const session = useSession();
  const { pathname } = useLocation();
  const inClass = isClassPath(pathname);
  const publicPage = pathname === "/privacy" || pathname === "/terms" || (pathname === "/" && session === "out");
  return (
  <ErrorBoundary>
    <div className={`bg-gray-100 dark:bg-gray-900 min-h-dvh flex flex-col ${inClass ? "" : "max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]"}`}>
      {!inClass && <TopBar />}
      <main className="flex grow flex-col">
        <Outlet />
      </main>
      {publicPage && <Footer />}
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
        element: <CategoryPageRoute />,
      },
      {
        path: "subjects/:name",
        element: <CardsPageRoute />,
      },
      {
        path: "study-sets/:id/*",
        element: <IndividualCardPageRoute />,
      },
      {
        path: "report-card",
        element: <ReportCard />,
      },
      {
        path: "profile",
        element: <ProfilePageRoute />,
      },
      {
        path: "profile/:username",
        element: <PublicPageRoute />,
      },
      {
        path: "sign-in",
        element: <AuthenticationRoute mode="sign-in" />,
      },
      {
        path: "sign-up",
        element: <AuthenticationRoute mode="sign-up" />,
      },
      {
        path: "privacy",
        element: <PrivacyPolicyRoute />,
      },
      {
        path: "terms",
        element: <TermsOfServiceRoute />,
      },
      {
        path: "*",
        element: <NotFoundRoute />,
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
