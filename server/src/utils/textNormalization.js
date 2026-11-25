export function normalizeWhitespace(text) {
  // Only normalize whitespace, preserve case:
  // 1. Trim leading/trailing spaces
  // 2. Replace multiple spaces with single space
  return text.trim().replace(/\s+/g, " ");
}

// A set's category as it's kept: "react  hooks" -> "React Hooks". The shared rule (core's subjectName), so a subject
// put on a campus and the sets made in it always have the same name.
export { subjectName as normalizeCategory } from "@retainlearn/core";

export function escapeRegex(string) {
  // Escape special regex characters
  return normalizeWhitespace(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// An email address as it's stored and looked up: trimmed and lowercased. Null if it isn't a plain address: no spaces
// or line breaks anywhere, one "@", a dot in the domain, at most 254 characters.
export function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
