// What the server said went wrong ({ error }, its answer to a refused request), or a fallback for no answer at all.
export function problemOf(error: unknown, fallback: string): string {
  const data = (error as { data?: { error?: unknown } } | undefined)?.data;
  return typeof data?.error === "string" ? data.error : fallback;
}
