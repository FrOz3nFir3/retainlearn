// Colours the code blocks in user content. highlight.js and its common languages load only when there's a code block
// to colour, as their own chunk, so pages without code never download them.
type Hljs = {
  configure(options: { ignoreUnescapedHTML: boolean }): void;
  getLanguage(name: string): unknown;
  highlightElement(el: HTMLElement): void;
};
let hljs: Promise<Hljs> | undefined;

export async function highlightCode(root: Element): Promise<void> {
  const blocks = [...root.querySelectorAll<HTMLElement>("pre code:not([data-highlighted])")];
  if (!blocks.length) return;
  hljs ??= import("highlight.js/lib/common").then((m) => {
    const lib = m.default as unknown as Hljs;
    lib.configure({ ignoreUnescapedHTML: true });
    return lib;
  });
  const lib = await hljs;
  for (const code of blocks) {
    if (!code.isConnected) continue;
    const language = code.closest("pre")?.dataset.language;
    if (language && lib.getLanguage(language)) code.classList.add(`language-${language}`);
    lib.highlightElement(code);
  }
}
