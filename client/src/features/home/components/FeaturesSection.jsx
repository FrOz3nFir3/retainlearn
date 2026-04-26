import {
  PencilSquareIcon,
  SparklesIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { GiftIcon } from "@heroicons/react/24/solid";

const features = [
  {
    icon: PencilSquareIcon,
    name: "Cards & quizzes in one place",
    description:
      "Create flashcards with questions and answers, or build multiple-choice quizzes. Organize everything by category, topic, and sub-topic so nothing gets lost.",
  },
  {
    icon: SparklesIcon,
    name: "Focus on what's hard",
    description:
      "Mark cards as difficult during a session and come back to them in Focus Mode. Spend your time on what actually needs work, not what you already know.",
  },
  {
    icon: ChartBarIcon,
    name: "Track your progress",
    description:
      "See how many cards you've studied, which quizzes you've aced, and where you're still struggling. Real numbers, not vanity metrics.",
  },
  {
    icon: GiftIcon,
    name: "Free and open source",
    description:
      "No premium tier, no ads, no data harvesting. The full source code is on GitHub under the Unlicense — use it however you want.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 sm:py-32 bg-brand-light dark:bg-[#0f0d1a]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-16 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-4">
            What you get
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl text-gray-900 dark:text-white leading-tight">
            Everything you need,
            <br />
            <span className="text-gray-400 dark:text-white/30">nothing you don't.</span>
          </h2>
        </div>

        {/* Feature grid — gap-px creates dividers from grid bg on all screen sizes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 dark:bg-white/8 border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
          {features.map((f) => (
            <div
              key={f.name}
              className="group relative p-8 sm:p-10 bg-white dark:bg-[#14112a] hover:bg-brand-surface/30 dark:hover:bg-white/4 transition-colors duration-200"
            >
              {/* Amber left accent bar — slides in on hover */}
              <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-brand-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top rounded-full" />

              <div className="flex items-start gap-4">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-brand-surface dark:bg-white/8 flex items-center justify-center shrink-0 group-hover:bg-brand-accent/20 transition-colors duration-200">
                  <f.icon className="w-4 h-4 text-brand-primary dark:text-brand-accent/70 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors" />
                </div>
                <div>
                  <h3 className="font-heading text-xl text-gray-900 dark:text-white mb-2 leading-snug">
                    {f.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
