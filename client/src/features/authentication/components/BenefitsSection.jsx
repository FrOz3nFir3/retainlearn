import FeatureCard from "./FeatureCard";
import { guestFeatures, memberFeatures } from "../lib/constants";
import { EyeIcon, UserCircleIcon } from "@heroicons/react/24/outline";

const BenefitsSection = () => {
  return (
    <div className="lg:col-span-2 space-y-10">
      {/* Heading */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
          RetainLearn
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl text-gray-900 dark:text-white leading-tight mb-4">
          Your brain already<br />knows how to remember.
        </h1>
        <p className="text-base text-gray-500 dark:text-white/45 max-w-lg leading-relaxed">
          We just give it the right prompts, at the right time. Spaced repetition built for real learning — free, forever.
        </p>
      </div>

      {/* Feature comparison cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <FeatureCard
          title="Try it free"
          subtitle="No signup required"
          icon={EyeIcon}
          features={guestFeatures}
        />
        <FeatureCard
          title="Full access"
          subtitle="Everything included"
          icon={UserCircleIcon}
          features={memberFeatures}
          isHighlight
        />
      </div>
    </div>
  );
};

export default BenefitsSection;
