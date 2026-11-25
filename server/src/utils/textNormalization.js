export function normalizeWhitespace(text) {
  // Only normalize whitespace, preserve case:
  // 1. Trim leading/trailing spaces
  // 2. Replace multiple spaces with single space
  return text.trim().replace(/\s+/g, " ");
}

export function normalizeCategory(category) {
  // Convert to title case: "programming" -> "Programming", "react hooks" -> "React Hooks"
  return category
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace first
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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
