// Skills (P2-07, the prototype's): the paths' skills you've earned, kept for good with their path's title as it was. On
// your report card, under Skills, with the path you follow and how far along it you are; on your profile, as chips.
import { Link } from "react-router-dom";
import type { CampusPath, ReportCard } from "@retainlearn/core";
import { useSession } from "#app/session.ts";
import { Bar } from "#components/ui/Bar.tsx";
import { cardClass, cardLinkClass } from "#components/ui/Card.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { SkeletonBlock } from "#components/ui/Skeleton.tsx";
import { SECTION, SECTION_TITLE } from "#features/profile/ProfileSkeleton.tsx";
import { useReportCard } from "#features/report-card/reportCardApi.ts";
import { pathPath } from "./pathView.ts";

type Skill = ReportCard["skills"][number];
const formatDay = (iso: string) => new Date(iso).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });

// The report card's Skills: the path you follow (if you do), and the skills you've earned.
export function SkillsSection({ skills, path }: { skills: readonly Skill[]; path: CampusPath | null }) {
  return (
    <section aria-labelledby="skills-title" className="mt-8">
      <h2 id="skills-title" className="mb-3 font-display text-xl font-semibold">
        Skills
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {path && <FollowedPath path={path} />}
        <div className="panel bg-surface p-4">
          <h3 className="text-sm font-semibold">Skills earned</h3>
          {skills.length ? (
            <ul className="mt-2 space-y-2">
              {skills.map((s) => (
                <li key={s.pathId} className="flex items-center gap-2.5 text-sm">
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-xl bg-bell-wash text-bell-ink">
                    <Icon name="trophy" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link to={pathPath(s.pathId)} className="font-semibold text-balance hover:underline">
                      {s.title}
                    </Link>
                    <span className="block text-xs text-ink/55">{`Earned on ${formatDay(s.at)}`}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-pretty text-ink/60">None yet. Finish every step of a path to earn one.</p>
          )}
        </div>
      </div>
    </section>
  );
}

// The path you follow: where you're up to, and how many steps are done.
function FollowedPath({ path }: { path: CampusPath }) {
  const done = path.total > 0 && path.done === path.total;
  return (
    <article className={cardClass}>
      <p className="text-xs text-ink/50">Your path</p>
      <h3 className="font-semibold text-balance">
        <Link to={pathPath(path._id)} data-card-link className={cardLinkClass}>
          {path.title}
        </Link>
      </h3>
      <p className="text-sm text-ink/60">{path.current ? `Now on: ${path.current.name}` : "All steps done"}</p>
      <div className="mt-auto flex items-center gap-2 pt-3">
        <Bar value={path.total ? path.done / path.total : 0} label={`Steps done in ${path.title}`} tone={done ? "mint" : "brand"} className="h-1.5 flex-1" />
        <span className="text-xs text-ink/55 tabular-nums">{`${path.done} of ${path.total} steps`}</span>
      </div>
    </article>
  );
}

// Your profile's "Skills earned": chips, or how to earn the first. A chip's placeholder while the report card loads.
export function ProfileSkills() {
  const card = useReportCard(useSession() !== "in");
  const skills = card.data?.skills;
  return (
    <section aria-labelledby="skills-title" className={SECTION}>
      <h2 id="skills-title" className={SECTION_TITLE}>
        Skills earned
      </h2>
      {!skills ? (
        <SkeletonBlock className="mt-3 h-7 w-40 rounded-full" />
      ) : skills.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <li key={s.pathId}>
              <Link to={pathPath(s.pathId)} className="inline-flex items-center gap-1.5 rounded-full bg-bell-wash px-3 py-1 text-sm font-semibold text-bell-ink hover:underline">
                <Icon name="trophy" className="size-3.5" />
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-pretty text-ink/55">
          None yet.{" "}
          <Link to="/paths" className="font-semibold text-brand hover:underline">
            Pick a path
          </Link>{" "}
          and finish it to earn your first skill.
        </p>
      )}
    </section>
  );
}
