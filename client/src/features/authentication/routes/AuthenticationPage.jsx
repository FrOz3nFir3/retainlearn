import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../state/authSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import BenefitsSection from "../components/BenefitsSection";
import AuthFormCard from "../components/AuthFormCard";

// Where to go once signed in: the page that sent you here (a returnTo in the link's state, which a URL can't set), if
// it's a page of this site, else the campus.
const returnPath = (state) => {
  const to = state?.returnTo;
  return typeof to === "string" && to.startsWith("/") && !to.startsWith("//") ? to : "/";
};

// /sign-in and /sign-up: the form the address names. Switching tabs changes the address, so each can be linked, and
// keeps where to go back to.
function AuthenticationPage({ mode }) {
  const user = useSelector(selectCurrentUser);
  const isLogin = mode !== "sign-up";
  const navigate = useNavigate();
  const location = useLocation();
  const setIsLogin = (login) => navigate(login ? "/sign-in" : "/sign-up", { replace: true, state: location.state });
  const goTo = returnPath(location.state);

  useEffect(() => {
    if (user) navigate(goTo, { replace: true });
  }, [user, navigate, goTo]);

  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] font-sans">
      <Helmet>
        <title>{isLogin ? "Sign in" : "Sign up"} — RetainLearn</title>
        <meta
          name="description"
          content={
            isLogin
              ? "Sign in to RetainLearn to access your personalised flashcards and track your study progress."
              : "Create a free RetainLearn account and start mastering any topic with spaced repetition."
          }
        />
        <meta property="og:title" content={`${isLogin ? "Sign in" : "Sign up"} — RetainLearn`} />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-16 items-start">
          <BenefitsSection />
          <div className="lg:col-span-1">
            <AuthFormCard isLogin={isLogin} onTabChange={setIsLogin} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthenticationPage;
