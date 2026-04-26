import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../state/authSlice";
import { useNavigate } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import BenefitsSection from "../components/BenefitsSection";
import AuthFormCard from "../components/AuthFormCard";

function AuthenticationPage() {
  const user = useSelector(selectCurrentUser);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

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
