// A rich-text field for user content (a flashcard's question or answer, a quiz question, its options): TipTap, writing
// the HTML the editor has always saved (richEditorExtensions.ts). A formatting toolbar above it: bold and italic,
// inline code, a code block in a language you pick, and lists (compact: the first three, for short fields). Pasted
// text keeps only what the editor knows; everything is sanitized again on the server, and again when it's shown.
// The toolbar is one tab stop, with arrow keys between its buttons: the browser's focusgroup where it has one, else
// the same keys here; toggles say whether they're on (aria-pressed); the language picker sits outside it, so its own
// arrow keys pick languages (guide: toolbar).
// RichField is the labelled version: a label, the editor, then a hint or the error, read with the editor.
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cx } from "#utils/cx.ts";
import { CodeBlock, InlineCode, LANGUAGES, languageLabel, lastLanguage, rememberLanguage } from "./richEditorExtensions.ts";

const nativeFocusgroup = typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype;

type Tool = { id: string; label: string; glyph: ReactNode; on: (e: Editor) => boolean; run: (e: Editor) => void };
const TOOLS: Tool[][] = [
  [
    { id: "bold", label: "Bold", glyph: <span className="font-bold">B</span>, on: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
    { id: "italic", label: "Italic", glyph: <span className="font-serif italic">I</span>, on: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
  ],
  [
    { id: "code", label: "Inline code", glyph: <span className="font-mono text-[11px]">{"</>"}</span>, on: (e) => e.isActive("inlineCode"), run: (e) => e.chain().focus().toggleMark("inlineCode").run() },
    {
      id: "pre",
      label: "Code block",
      glyph: <span className="font-mono text-[11px]">{"{ }"}</span>,
      on: (e) => e.isActive("codeBlock"),
      run: (e) => e.chain().focus().toggleCodeBlock({ language: lastLanguage() }).run(),
    },
  ],
  [
    { id: "ul", label: "Bulleted list", glyph: <span className="text-[12px]">• List</span>, on: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
    { id: "ol", label: "Numbered list", glyph: <span className="text-[12px]">1. List</span>, on: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
  ],
];
const GROUPS = ["Text", "Code", "Lists"];
// The editor keeps an empty paragraph after a closing code block (so you can write below it), and an empty field is one
// empty paragraph: neither is content, so neither is saved.
const htmlOf = (e: Editor): string => e.getHTML().replace(/(?:<p><\/p>)+$/, "");
const COMPACT = new Set(["bold", "italic", "code"]);

type Props = {
  value: string; // the saved HTML it starts with; later changes are the editor's own
  onChange: (html: string, changed: boolean) => void; // changed: it differs from how it started
  label: string; // the toolbar's name says what it formats
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  placeholder?: string;
  compact?: boolean;
  className?: string; // the writing area's height (min-h-…)
};

export function RichEditor({ value, onChange, label, labelledBy, describedBy, invalid = false, placeholder, compact = false, className }: Props) {
  const started = useRef<string | null>(null);
  const latestOnChange = useRef(onChange);
  useEffect(() => {
    latestOnChange.current = onChange;
  });
  const editor = useEditor({
    extensions: [StarterKit.configure({ codeBlock: false, code: false, link: { openOnClick: false, defaultProtocol: "https" } }), InlineCode, CodeBlock],
    content: value,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    onCreate: ({ editor: e }) => {
      started.current = htmlOf(e); // as the editor writes it: saved content may differ in markup alone
    },
    onUpdate: ({ editor: e }) => {
      const html = htmlOf(e);
      latestOnChange.current(html, html !== started.current);
    },
  });
  // Its name, description and state, kept on the writing area as they change (an error appears, then goes).
  useEffect(() => {
    editor.setOptions({
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          ...(labelledBy ? { "aria-labelledby": labelledBy } : { "aria-label": label }),
          ...(describedBy ? { "aria-describedby": describedBy } : {}),
          ...(invalid ? { "aria-invalid": "true" } : {}),
          class: cx("rich px-3 py-2 !text-sm outline-none", className ?? "min-h-24"),
        },
      },
    });
  }, [editor, label, labelledBy, describedBy, invalid, className]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      on: Object.fromEntries(TOOLS.flat().map((t) => [t.id, t.on(e)])),
      empty: e.isEmpty,
      language: e.isActive("codeBlock") ? ((e.getAttributes("codeBlock").language as string | undefined) ?? "plaintext") : null,
    }),
  });

  // Without the browser's focusgroup: arrow keys, Home and End move between the buttons, wrapping at the ends, and
  // the button last focused is the toolbar's one tab stop.
  const [stop, setStop] = useState(0);
  // Whether focus is in this field (its text or its toolbar): what's on is shown only then, since each editor keeps its
  // own selection, and another field's would show as on while you write here.
  const [active, setActive] = useState(false);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : step ? (at + step + buttons.length) % buttons.length : -1;
    if (at < 0 || to < 0) return;
    e.preventDefault();
    buttons[to]?.focus();
  };
  const groups = TOOLS.map((tools) => (compact ? tools.filter((t) => COMPACT.has(t.id)) : tools)).filter((tools) => tools.length);
  const language = active ? state.language : null;
  const languages = language && !LANGUAGES.some((l) => l.value === language) ? [{ value: language, label: languageLabel(language) }, ...LANGUAGES] : LANGUAGES;

  return (
    <div
      onFocus={() => setActive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive(false);
      }}
      className={cx(
        "overflow-hidden rounded-xl border bg-surface focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10",
        invalid ? "border-danger" : "border-ink/12",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-ink/[0.06] bg-ink/[0.02] px-1.5 py-1">
        <div
          role="toolbar"
          aria-label={`${label}: formatting`}
          {...({ focusgroup: "toolbar wrap" } as Record<string, string>)}
          onKeyDown={nativeFocusgroup ? undefined : onKey}
          className="flex flex-wrap items-center gap-0.5"
        >
          {groups.map((tools, g) => (
            <div key={GROUPS[g]} role="group" aria-label={GROUPS[g]} className="flex items-center gap-0.5">
              {g > 0 && <span role="separator" aria-orientation="vertical" className="mx-0.5 h-4 border-l border-ink/12" />}
              {tools.map((t) => {
                const n = groups.flat().indexOf(t);
                return (
                <button
                  key={t.id}
                  type="button"
                  aria-label={t.label}
                  title={t.label}
                  aria-pressed={active && (state.on[t.id] ?? false)}
                  tabIndex={nativeFocusgroup ? undefined : n === stop ? 0 : -1}
                  onFocus={() => setStop(n)}
                  onMouseDown={(e) => e.preventDefault()} // keeps the selection in the text
                  onClick={() => t.run(editor)}
                  className="grid min-h-7 min-w-7 place-items-center rounded-md border border-transparent px-1.5 text-ink/70 hover:bg-ink/[0.06] hover:text-ink focus-visible:outline-2 focus-visible:outline-brand aria-pressed:border-brand/30 aria-pressed:bg-brand/10 aria-pressed:text-brand pointer-coarse:min-h-9 pointer-coarse:min-w-9"
                >
                  {t.glyph}
                </button>
                );
              })}
            </div>
          ))}
        </div>
        {language && (
          <label className="flex items-center gap-1.5 text-xs text-ink/55">
            Language
            <select
              value={language}
              onChange={(e) => {
                rememberLanguage(e.target.value);
                editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run();
              }}
              className="rounded-md border border-ink/12 bg-surface px-1.5 py-1 text-xs text-ink focus:border-brand focus:outline-none"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="relative">
        {state.empty && placeholder && (
          <p aria-hidden="true" className="pointer-events-none absolute top-2 left-3 text-sm text-ink/40">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// A labelled rich-text field: the label (a click on it starts writing, as a label does), the editor, then the hint or
// the error, read out with the field. The note is a live region, so an error that appears on submit is heard too.
type FieldProps = Omit<Props, "labelledBy" | "describedBy" | "invalid"> & { hint?: string; error?: string | null };

export function RichField({ label, hint, error, ...rest }: FieldProps) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const note = error ?? hint;
  return (
    <div ref={box} className="space-y-1.5">
      <p id={`${id}-label`} className="text-sm font-semibold" onClick={() => box.current?.querySelector<HTMLElement>("[contenteditable]")?.focus()}>
        {label}
      </p>
      <RichEditor label={label} labelledBy={`${id}-label`} describedBy={note ? `${id}-note` : undefined} invalid={!!error} {...rest} />
      <p id={`${id}-note`} aria-live="polite" className={cx("text-xs empty:hidden", error ? "font-medium text-rose-ink" : "text-ink/50")}>
        {note}
      </p>
    </div>
  );
}
