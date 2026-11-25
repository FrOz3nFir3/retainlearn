// The Privacy Policy's and the Terms' frame (/privacy, /terms; the prototype's Legal) and its skeleton (PLAN 14.15):
// the eyebrow, the title and the date it was last updated, then on wide screens a contents list that stays in view
// beside the text. The page fills it with the text; the skeleton, loaded with the app, with lines while the text's
// code arrives.
import type { ReactNode } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { Icon } from "#components/ui/Icon.tsx";
import { Loading, SkeletonText } from "#components/ui/Skeleton.tsx";

export type LegalKind = "privacy" | "terms";
export type LegalSection = { title: string; body: ReactNode };

export const LEGAL: Record<LegalKind, { title: string; eyebrow: string; description: string }> = {
  privacy: { title: "Privacy Policy", eyebrow: "Legal · Privacy", description: "Privacy Policy for RetainLearn. Learn how we handle your data." },
  terms: { title: "Terms of Service", eyebrow: "Legal · Terms", description: "Terms of Service for RetainLearn. The rules for using the service." },
};

// The text's look: headings, paragraphs and lists, links in the brand colour, in both themes.
export const LEGAL_TEXT =
  "rounded-2xl border border-ink/[0.08] bg-surface p-6 text-[15px] leading-relaxed text-ink/80 sm:p-10 [&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_section]:scroll-mt-24 [&_section+section]:mt-10 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5";

export function LegalFrame({ kind, updated, contents, children }: { kind: LegalKind; updated: ReactNode; contents: ReactNode; children: ReactNode }) {
  const { title, eyebrow, description } = LEGAL[kind];
  return (
    <div className="flex-1 bg-mist text-ink">
      <Helmet>
        <title>{`${title} | RetainLearn`}</title>
        <meta name="description" content={description} />
      </Helmet>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 max-w-3xl sm:mb-10">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">{eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/[0.08] bg-surface px-3 py-1.5 text-xs font-medium text-ink/60">
            <Icon name="calendar" className="size-3.5 text-brand" /> Last updated {updated}
          </p>
        </header>
        <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
          <div className="hidden lg:block">{contents}</div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSkeleton({ kind }: { kind: LegalKind }) {
  const lines = ["w-full", "w-11/12", "w-4/5", "w-full", "w-2/3"];
  return (
    <LegalFrame
      kind={kind}
      updated={<SkeletonText className="inline-flex w-24 align-middle" />}
      contents={
        <div aria-hidden="true" className="sticky top-24 space-y-2.5 px-2">
          {Array.from({ length: 8 }, (_, i) => (
            <p key={i} className="text-sm">
              <SkeletonText className={i % 2 ? "w-28" : "w-36"} />
            </p>
          ))}
        </div>
      }
    >
      <Loading label={`Loading the ${LEGAL[kind].title}`} className={LEGAL_TEXT}>
        {[0, 1, 2].map((s) => (
          <div key={s} className={s ? "mt-10" : ""}>
            <p className="font-display text-xl font-semibold">
              <SkeletonText className="w-48" />
            </p>
            <div className="mt-3">
              {lines.map((w, i) => (
                <SkeletonText key={i} className={w} />
              ))}
            </div>
          </div>
        ))}
      </Loading>
    </LegalFrame>
  );
}
