import { useState, useEffect } from 'react';

/**
 * Custom hook to track failed authentication attempts.
 *
 * @param {any} error - The error object from an API mutation or request.
 * @param {number} threshold - The number of failures before flagging for help (default 3).
 * @returns {Object} An object containing:
 *   - failedAttempts: current count of failures.
 *   - shouldShowHelp: boolean indicating if the threshold has been reached.
 *   - incrementAttempts: function to manually increment the counter.
 */
export const useFailedAttempts = (error, threshold = 3) => {
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (error) {
      setFailedAttempts((prev) => prev + 1);
    }
  }, [error]);

  const incrementAttempts = () => {
    setFailedAttempts((prev) => prev + 1);
  };

  const shouldShowHelp = failedAttempts >= threshold;

  return { failedAttempts, shouldShowHelp, incrementAttempts };
};
