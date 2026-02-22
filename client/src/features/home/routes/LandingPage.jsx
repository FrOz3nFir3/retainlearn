import React, { useRef } from "react";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";

const CtaSection = React.lazy(() => import("../components/CtaSection"));
const HowItWorks = React.lazy(() => import("../components/HowItWorks"));

import { Helmet } from "@dr.pogodin/react-helmet";

const LandingPage = () => {
  const howItWorksRef = useRef(null);

  const handleLearnMoreClick = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 text-slate-800 dark:text-slate-200 min-h-screen">
      <Helmet>
        <title>RetainLearn - Master Your Learning with Smart Flashcards</title>
        <meta 
          name="description" 
          content="Accelerate your learning with RetainLearn. Create custom flashcards, learn programming, biology, languages, and more using scientifically proven spaced repetition algorithms." 
        />
        <meta property="og:title" content="RetainLearn - The Ultimate Flashcard App" />
        <meta property="og:description" content="Join thousands of students and professionals using active recall and spaced repetition to master new skills and ace their exams." />
        <meta property="og:type" content="website" />
      </Helmet>
      <HeroSection onLearnMoreClick={handleLearnMoreClick} />
      <FeaturesSection />
      <HowItWorks ref={howItWorksRef} />
      <CtaSection />
    </div>
  );
};

export default LandingPage;
