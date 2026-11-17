import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Links in what people write are marked as user content that search engines shouldn't follow or credit
// (`rel="nofollow ugc"`), so links put in a study set don't pass this site's standing on to the pages they point to
// (P0-14). The client marks links in content saved before this the same way (HtmlRenderer).
export const USER_LINK_REL = "nofollow ugc noopener noreferrer";
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.hasAttribute("href")) {
    node.setAttribute("rel", USER_LINK_REL);
  }
});

export function getTextFromHTML(html) {
  if (!html) return "";
  const sanitizedHtml = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    RETURN_DOM: true,
  });

  return sanitizedHtml.textContent || sanitizedHtml.innerText || "";
}

export function sanitizeHTML(html) {
  return DOMPurify.sanitize(html);
}
