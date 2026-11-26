// The rich-text editor's own extensions (RichEditor.tsx), writing user content in the same HTML the editor has always
// saved, so old and new flashcards are one format (RichText shows both; recall points read it, features/classes):
// - inline code: <span class="inline-code">, also read from a bare <code> (both kinds are in saved content);
// - code blocks: a wrapper naming the language, with a header bar for it, then the code:
//   <div class="code-block-wrapper relative" data-language="…"><div class="code-block-header …"><span
//   class="language-label font-medium">Label</span></div><pre data-language="…" class=" !mt-0 !rounded-t-none"><code>…</code></pre></div>
//   The header's classes are the old editor's, kept for the same output; RichText keeps only the ones it styles.
// Code is coloured as you type (lowlight, the highlight.js languages RichText colours with too).
import { Mark, markInputRule, markPasteRule } from "@tiptap/react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

// The languages a code block can be in: highlight.js's common ones, by the names saved in data-language.
const LABELS: Record<string, string> = {
  bash: "Bash",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  graphql: "GraphQL",
  ini: "INI",
  javascript: "JavaScript",
  json: "JSON",
  objectivec: "Objective-C",
  php: "PHP",
  "php-template": "PHP template",
  plaintext: "Plain text",
  "python-repl": "Python REPL",
  scss: "SCSS",
  sql: "SQL",
  typescript: "TypeScript",
  vbnet: "Visual Basic .NET",
  wasm: "WebAssembly",
  xml: "HTML / XML",
  yaml: "YAML",
};
export const languageLabel = (name: string): string => LABELS[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
export const LANGUAGES: { value: string; label: string }[] = Object.keys(common)
  .map((value) => ({ value, label: languageLabel(value) }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const InlineCode = Mark.create({
  name: "inlineCode",
  excludes: "_", // like code anywhere: no bold or links inside it
  code: true,
  exitable: true,
  parseHTML: () => [{ tag: "span.inline-code" }, { tag: "code" }],
  renderHTML: () => ["span", { class: "inline-code" }, 0],
  addKeyboardShortcuts() {
    return { "Mod-e": () => this.editor.commands.toggleMark(this.name) };
  },
  // `like this` turns into inline code as you type it, or paste it.
  addInputRules() {
    return [markInputRule({ find: /(^|[^`])`([^`]+)`(?!`)$/, type: this.type })];
  },
  addPasteRules() {
    return [markPasteRule({ find: /(^|[^`])`([^`]+)`(?!`)/g, type: this.type })];
  },
});

const lowlight = createLowlight(common);

const languageOf = (el: HTMLElement): string =>
  el.getAttribute("data-language") ?? el.closest(".code-block-wrapper")?.getAttribute("data-language") ?? "plaintext";

export const CodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: "plaintext",
        parseHTML: languageOf,
        renderHTML: (attributes: { language?: string | null }) => (attributes.language ? { "data-language": attributes.language } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div.code-block-wrapper", preserveWhitespace: "full", contentElement: "pre code" }, ...(this.parent?.() ?? [])];
  },
  renderHTML({ HTMLAttributes, node }) {
    const language = (node.attrs.language as string | null) || "plaintext";
    return [
      "div",
      { class: "code-block-wrapper relative", "data-language": language },
      [
        "div",
        {
          class:
            "code-block-header flex justify-between items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300",
        },
        ["span", { class: "language-label font-medium" }, languageLabel(language)],
      ],
      ["pre", { ...HTMLAttributes, class: `${(HTMLAttributes.class as string | undefined) ?? ""} !mt-0 !rounded-t-none` }, ["code", 0]],
    ];
  },
}).configure({ lowlight, defaultLanguage: "plaintext" });

// The language a new code block starts in: the one you last picked, on this device.
const LANGUAGE_KEY = "retainlearn:code-language";
export function lastLanguage(): string {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved && saved in common ? saved : "javascript";
  } catch {
    return "javascript";
  }
}
export function rememberLanguage(language: string): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // private browsing, or storage blocked: the next block starts in the default
  }
}
