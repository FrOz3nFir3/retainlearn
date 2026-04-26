import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const LegalLayout = ({ title, lastUpdated, eyebrow = "Legal", children }) => {
  const contentRef = useRef(null);
  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Build TOC from rendered h2 elements
  useEffect(() => {
    if (!contentRef.current) return;
    const headings = Array.from(contentRef.current.querySelectorAll("h2"));
    const items = headings.map((h) => {
      const id = h.id || slugify(h.textContent || "");
      h.id = id;
      return { id, label: h.textContent };
    });
    setSections(items);
  }, [children]);

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    if (!sections.length || !contentRef.current) return;
    const headings = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [sections]);

  const handleTocClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  const formattedDate = useMemo(() => lastUpdated, [lastUpdated]);

  return (
    <div className="bg-brand-light dark:bg-[#0f0d1a] min-h-screen font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-10 sm:mb-12 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent mb-3">
            {eyebrow}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl text-gray-900 dark:text-white leading-tight">
            {title}
          </h1>
          {formattedDate && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 text-xs font-medium text-gray-600 dark:text-white/60">
              <CalendarDaysIcon className="h-3.5 w-3.5 text-brand-primary dark:text-brand-accent" />
              <span>Last updated {formattedDate}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Table of Contents — desktop only */}
          <aside className="hidden lg:block lg:col-span-3">
            <nav className="sticky top-24" aria-label="Table of contents">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-white/35 mb-3 px-2">
                On this page
              </p>
              <ul className="space-y-0.5">
                {sections.map((s) => {
                  const isActive = activeId === s.id;
                  return (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        onClick={(e) => handleTocClick(e, s.id)}
                        className={`block px-2 py-1.5 text-sm rounded-md transition-colors duration-150 border-l-2 ${
                          isActive
                            ? "border-brand-accent text-brand-primary dark:text-brand-accent font-medium bg-brand-surface/60 dark:bg-brand-accent/8"
                            : "border-transparent text-gray-500 dark:text-white/45 hover:text-gray-900 dark:hover:text-white hover:border-gray-200 dark:hover:border-white/10"
                        }`}
                      >
                        {s.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <article
            ref={contentRef}
            className="lg:col-span-9 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-6 sm:p-10 legal-content"
          >
            {children}
          </article>
        </div>
      </div>
    </div>
  );
};

export default LegalLayout;
