// A card whose heading link covers all of it (guide: card): an <article> with cardClass, its heading's link with
// cardLinkClass and data-card-link. The link is stretched over the card, the focus ring and hover are drawn on the
// card, and a button inside it sits above the link (give it "relative z-1"), so it does its own thing.
export const cardClass =
  "relative flex h-full flex-col rounded-2xl border border-ink/7 bg-surface p-4 transition has-[[data-card-link]:focus-visible]:outline-2 has-[[data-card-link]:focus-visible]:outline-offset-2 has-[[data-card-link]:focus-visible]:outline-brand has-[[data-card-link]:hover]:border-brand/35 motion-safe:has-[[data-card-link]:hover]:-translate-y-0.5";
export const cardLinkClass = "outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']";
