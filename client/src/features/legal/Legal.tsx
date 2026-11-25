// The Privacy Policy and the Terms of Service (/privacy, /terms), word for word as on the live site, in the new design
// (LegalFrame): a contents list that stays beside the text on wide screens and shows which section you're reading.
import { useEffect, useState } from "react";
import { cx } from "#utils/cx.ts";
import { LEGAL_TEXT, LegalFrame } from "./LegalSkeleton.tsx";
import type { LegalKind, LegalSection } from "./LegalSkeleton.tsx";
import { PRIVACY, PRIVACY_UPDATED } from "./privacyText.tsx";
import { TERMS, TERMS_UPDATED } from "./termsText.tsx";

const TEXTS: Record<LegalKind, { sections: LegalSection[]; updated: string }> = {
  privacy: { sections: PRIVACY, updated: PRIVACY_UPDATED },
  terms: { sections: TERMS, updated: TERMS_UPDATED },
};
// A section's id in the address: its title, without its number ("2. Data We Collect" -> "data-we-collect").
const idFor = (title: string) =>
  title
    .replace(/^\d+\.\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function Legal({ kind }: { kind: LegalKind }) {
  const { sections, updated } = TEXTS[kind];
  const [reading, setReading] = useState<string | null>(null);
  // The section in view: the one whose heading last crossed the top part of the screen.
  useEffect(() => {
    const seen = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setReading(visible.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(idFor(s.title));
      if (el) seen.observe(el);
    }
    return () => seen.disconnect();
  }, [sections]);

  return (
    <LegalFrame
      kind={kind}
      updated={updated}
      contents={
        <nav aria-label="On this page" className="sticky top-24">
          <p className="mb-3 px-2 text-[10px] font-semibold tracking-[0.16em] text-ink/40 uppercase">On this page</p>
          <ul className="space-y-0.5">
            {sections.map(({ title }) => {
              const id = idFor(title);
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={reading === id ? "location" : undefined}
                    className={cx(
                      "block rounded-md border-l-2 px-2 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand",
                      reading === id ? "border-brand bg-brand/[0.07] font-medium text-brand" : "border-transparent text-ink/55 hover:text-ink",
                    )}
                  >
                    {title}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      }
    >
      <article className={LEGAL_TEXT}>
        {sections.map(({ title, body }) => (
          <section key={title} id={idFor(title)}>
            <h2>{title}</h2>
            {body}
          </section>
        ))}
      </article>
    </LegalFrame>
  );
}
