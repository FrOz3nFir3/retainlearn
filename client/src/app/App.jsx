import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  ScrollRestoration,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Header from "../components/layout/Header/Header";
import Footer from "../components/layout/Footer/Footer";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary";
import { useSessionCheck } from "#app/session.ts";

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

// Root layout component. The session is checked once, here, as the app opens (app/session.ts).
const RootLayout = () => {
  useSessionCheck();
  return (
  <ErrorBoundary>
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex grow flex-col">
        <Outlet />
      </main>
      <Footer />
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
        element: <LandingPageRoute />,
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
