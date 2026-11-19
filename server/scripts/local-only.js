// Guard for anything outside the app itself that writes to a database (the scripts and the tests): only a local
// MongoDB, and only a database whose name starts with "retainlearn". Never production, and never another project's
// database on the same machine.
const LOCAL = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function assertLocalRetainlearn(uri, { exact } = {}) {
  let url;
  try {
    url = new URL(uri);
  } catch {
    throw new Error("Refusing: the MongoDB address can't be read");
  }
  if (url.protocol !== "mongodb:" || !LOCAL.has(url.hostname)) {
    throw new Error(`Refusing: ${url.protocol}//${url.hostname} isn't a local MongoDB (only localhost is allowed)`);
  }
  const db = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (exact ? db !== exact : !db.startsWith("retainlearn")) {
    throw new Error(`Refusing: database "${db || "(none)"}" ${exact ? `isn't "${exact}"` : `doesn't start with "retainlearn"`}`);
  }
  return db;
}
