// The footer, at the bottom of every page but a class and signing in (the prototype's): the name, that it's free and
// open source, and the links people look for at the bottom of a page. Signed in, your profile instead of signing in.
import { Link } from "react-router-dom";
import { useSession } from "#app/session.ts";

const LINK = "rounded hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function SiteFooter() {
  const signedIn = useSession() === "in";
  return (
    <footer className="bg-night pb-[env(safe-area-inset-bottom)] text-white/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 px-4 py-6 text-sm sm:px-6">
        <span className="flex items-center gap-2 font-semibold text-white">
          <img src="/images/logo.svg" alt="" width={24} height={23} className="size-6" /> RetainLearn
        </span>
        <span>Free and open source.</span>
        <nav aria-label="Footer" className="ml-auto">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link to="/subjects" className={LINK}>
                Subjects
              </Link>
            </li>
            <li>
              <Link to={signedIn ? "/profile" : "/sign-in"} className={LINK}>
                {signedIn ? "Your profile" : "Sign in"}
              </Link>
            </li>
            <li>
              <Link to="/privacy" className={LINK}>
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className={LINK}>
                Terms
              </Link>
            </li>
            <li>
              <a href="https://github.com/FrOz3nFir3/retainlearn" className={LINK} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
