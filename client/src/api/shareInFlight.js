// Shares calls that are already under way: a call made while another with the same key is still running gets that
// one's result instead of starting a second. Used for the session refreshes in apiSlice.js (P0-15), so the queries
// that fail together when a session expires wait for one refresh between them.
export function shareInFlight() {
  const running = new Map();
  return (key, start) => {
    if (!running.has(key)) {
      const call = Promise.resolve()
        .then(start)
        .finally(() => running.delete(key));
      running.set(key, call);
    }
    return running.get(key);
  };
}
