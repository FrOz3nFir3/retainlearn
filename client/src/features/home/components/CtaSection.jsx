import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../authentication/state/authSlice";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const CtaSection = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <section className="relative bg-brand-surface dark:bg-[#0f0d1a] overflow-hidden">
      {/* Decorative ambient circle top-right */}
      <div className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full bg-brand-accent/15 dark:bg-brand-accent/8 blur-[120px] pointer-events-none" />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">

          {/* Left: editorial heading */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-8 h-px bg-brand-primary/40 dark:bg-brand-accent/40" />
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary/60 dark:text-brand-accent/60">
                Get started free
              </p>
            </div>

            <h2 className="font-heading text-5xl sm:text-6xl lg:text-[4rem] text-gray-900 dark:text-white leading-[1.05] mb-6">
              Ready to remember
              <br />
              <span className="text-brand-primary dark:text-brand-accent">
                what matters?
              </span>
            </h2>

            <p className="text-lg text-gray-600 dark:text-white/50 leading-relaxed max-w-md">
              No credit card. No premium tier. No ads or trackers. A clean,
              open-source tool to help you study — free to use forever.
            </p>

            {/* Inline stats */}
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2">
              {["100% open source", "Forever free", "Unlicense"].map(
                (label, i, arr) => (
                  <div key={label} className="flex items-center gap-5">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
                      {label}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right: action card */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white dark:bg-white/5 border border-amber-200/80 dark:border-white/10 shadow-sm dark:shadow-none p-7 sm:p-8">
              <h3 className="font-heading text-2xl text-gray-900 dark:text-white mb-2">
                Start in 30 seconds
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/45 leading-relaxed mb-7">
                Create your first deck in minutes. Browse public categories
                without an account.
              </p>

              <div className="space-y-3">
                {user ? (
                  <>
                    <Link
                      to="/progress"
                      className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 text-sm font-semibold text-white bg-brand-primary dark:bg-brand-accent dark:text-brand-dark hover:bg-indigo-700 dark:hover:bg-amber-400 rounded-xl transition-colors duration-150 shadow-md shadow-brand-primary/20 dark:shadow-brand-accent/20"
                    >
                      View your progress
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/categories"
                      className="inline-flex items-center justify-center w-full px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/12 hover:border-gray-300 dark:hover:border-white/25 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors duration-150"
                    >
                      Continue learning
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/authenticate"
                      className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 text-sm font-semibold text-white bg-brand-primary dark:bg-brand-accent dark:text-brand-dark hover:bg-indigo-700 dark:hover:bg-amber-400 rounded-xl transition-colors duration-150 shadow-md shadow-brand-primary/20 dark:shadow-brand-accent/20"
                    >
                      Create free account
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/categories"
                      className="inline-flex items-center justify-center w-full px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/12 hover:border-gray-300 dark:hover:border-white/25 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors duration-150"
                    >
                      Browse without signing up
                    </Link>
                  </>
                )}
              </div>

              {/* Mini stats inside card */}
              <div className="mt-7 pt-6 border-t border-gray-100 dark:border-white/8 grid grid-cols-3 gap-3 text-center">
                {[
                  { value: "∞", label: "Free forever" },
                  { value: "0", label: "Ads" },
                  { value: "OSS", label: "Open source" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="font-heading text-2xl text-brand-primary dark:text-brand-accent leading-none">
                      {s.value}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-white/30 mt-1 leading-tight">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom border fade */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-primary/20 dark:via-brand-accent/20 to-transparent" />
    </section>
  );
};

export default CtaSection;
