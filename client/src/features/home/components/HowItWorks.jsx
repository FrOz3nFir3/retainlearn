const HowItWorks = (props) => {
  const howItWorksRef = props.ref;

  const steps = [
    {
      number: "01",
      title: "Pick a topic",
      description:
        "Browse public categories or create your own. Organize cards by topic and sub-topic so everything has a place and nothing is hard to find.",
    },
    {
      number: "02",
      title: "Study your way",
      description:
        "Flip through flashcards to test yourself, or switch to quiz mode for multiple-choice practice. Mark tough cards for Focus Mode later.",
    },
    {
      number: "03",
      title: "See what sticks",
      description:
        "Check your stats to see what you've mastered and what still needs work. Use Focus Mode to drill weak cards until they click.",
    },
  ];

  return (
    <section
      ref={howItWorksRef}
      className="relative bg-brand-dark py-24 sm:py-32 overflow-hidden"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-4">
            How it works
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl text-white leading-tight">
            Three steps.
            <br />
            <span className="text-white/40">That's the whole idea.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8 rounded-2xl overflow-hidden">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group bg-brand-dark hover:bg-white/4 transition-colors duration-200 p-8 sm:p-10"
            >
              {/* Big amber step number */}
              <div className="font-heading text-6xl sm:text-7xl text-brand-accent/40 group-hover:text-brand-accent/65 transition-colors duration-200 leading-none mb-6 select-none">
                {step.number}
              </div>
              <h3 className="font-heading text-2xl text-white mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-white/55 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative watermark — desktop only, avoids overlapping stacked cards on mobile */}
      <div
        className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-20 font-heading text-[20rem] lg:text-[26rem] font-bold leading-none text-white/4 select-none pointer-events-none"
        aria-hidden="true"
      >
        ?
      </div>
    </section>
  );
};

export default HowItWorks;
