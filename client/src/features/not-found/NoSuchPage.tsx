// A page that doesn't exist (any address the app doesn't know, or a study set's page it can't place; the prototype's
// NotFound): what happened, and the two ways on. Kept out of search results. Loaded with the app: it's small, and an
// old link should answer at once.
import { Link } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useSession } from "#app/session.ts";
import { buttonClass } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";

export default function NoSuchPage() {
  const signedIn = useSession() !== "out";
  return (
    <div className="grid flex-1 place-items-center bg-mist px-4 py-16 text-ink">
      <Helmet>
        <title>Page not found - RetainLearn</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="panel w-full max-w-sm bg-surface p-6 text-center">
        <Icon name="locate" className="mx-auto size-8 text-brand/70" />
        <h1 className="mt-2 font-display text-2xl font-semibold text-balance">This page doesn't exist</h1>
        <p className="mt-1 text-sm text-pretty text-ink/60">The link may be old, or the study set was removed.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/" className={buttonClass("primary")}>
            {signedIn ? "Back to your campus" : "Go to the home page"}
          </Link>
          <Link to="/subjects" className={buttonClass("quiet")}>
            Browse subjects
          </Link>
        </div>
      </div>
    </div>
  );
}
