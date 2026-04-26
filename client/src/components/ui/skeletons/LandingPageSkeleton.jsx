
const LandingPageSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* ── Hero Section (mirrors HeroSection.jsx — always dark) ── */}
      <section className="relative min-h-screen flex items-center bg-brand-dark overflow-hidden">
        {/* Subtle amber glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-accent/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-primary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 w-full py-16 sm:py-20 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 sm:gap-14 lg:gap-24 w-full">
            {/* Left copy */}
            <div className="lg:w-[54%] w-full">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
                <div className="h-4 bg-white/10 rounded w-48"></div>
              </div>

              {/* Heading lines */}
              <div className="space-y-4 mb-6 sm:mb-8">
                <div className="h-10 sm:h-14 lg:h-16 bg-white/10 rounded-lg w-4/5"></div>
                <div className="h-10 sm:h-14 lg:h-16 bg-white/10 rounded-lg w-3/5"></div>
                <div className="h-10 sm:h-14 lg:h-16 bg-white/10 rounded-lg w-1/2"></div>
              </div>

              {/* Subtitle */}
              <div className="space-y-2 mb-8 sm:mb-10 max-w-lg">
                <div className="h-4 bg-white/8 rounded w-full"></div>
                <div className="h-4 bg-white/8 rounded w-5/6"></div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="h-12 bg-white/10 rounded-xl w-48"></div>
                <div className="h-12 bg-white/5 border border-white/8 rounded-xl w-40"></div>
              </div>

              {/* Feature pills row */}
              <div className="flex flex-wrap items-center gap-5 mt-8 sm:mt-12">
                <div className="h-3 bg-white/8 rounded w-20"></div>
                <div className="w-1 h-1 rounded-full bg-white/15" />
                <div className="h-3 bg-white/8 rounded w-16"></div>
                <div className="w-1 h-1 rounded-full bg-white/15" />
                <div className="h-3 bg-white/8 rounded w-24"></div>
                <div className="w-1 h-1 rounded-full bg-white/15" />
                <div className="h-3 bg-white/8 rounded w-28"></div>
              </div>
            </div>

            {/* Right card stack */}
            <div className="w-full lg:w-[46%] flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none">
                {/* Stacked peek cards */}
                <div className="absolute -top-3 left-5 right-5 h-full rounded-3xl bg-white/4 -rotate-3 pointer-events-none" />
                <div className="absolute -top-1.5 left-2.5 right-2.5 h-full rounded-3xl bg-white/6 rotate-1 pointer-events-none" />

                {/* Foreground card */}
                <div className="relative bg-white/8 rounded-3xl border-2 border-white/10 min-h-88 flex flex-col">
                  <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 bg-white/10 rounded-xl"></div>
                      <div className="h-4 bg-white/10 rounded w-20"></div>
                    </div>
                    <div className="h-6 bg-white/10 rounded-full w-14"></div>
                  </div>

                  <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="space-y-3 w-full">
                      <div className="h-5 bg-white/10 rounded w-full"></div>
                      <div className="h-5 bg-white/10 rounded w-4/5 mx-auto"></div>
                    </div>
                  </div>

                  <div className="mt-auto pb-4 text-center">
                    <div className="inline-block h-7 bg-white/8 rounded-full w-44"></div>
                  </div>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mt-5">
                  <div className="h-1 w-5 rounded-full bg-white/20"></div>
                  <div className="h-1 w-1 rounded-full bg-white/10"></div>
                  <div className="h-1 w-1 rounded-full bg-white/10"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / How It Works / CTA (lazy-loaded — show as deferred block) */}
      <div className="py-24 sm:py-32 bg-brand-light dark:bg-[#0f0d1a]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="h-96 bg-gray-200 dark:bg-white/8 rounded-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageSkeleton;
