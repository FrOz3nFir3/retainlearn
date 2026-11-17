import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FlagIcon } from "@heroicons/react/24/outline";
import Modal from "../../../components/ui/Modal";
import { selectCurrentUser } from "../../authentication/state/authSlice";
import { useReportSetMutation } from "../../../api/apiSlice";

const REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "offensive", label: "Offensive or inappropriate" },
  { value: "wrong", label: "Wrong or misleading" },
  { value: "other", label: "Something else" },
];

const buttonClass =
  "cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white/60 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150";
const primaryClass =
  "cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 px-5 py-2.5 text-sm font-semibold text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 rounded-xl transition-colors duration-150";

// "Report this set": one report per person per set. When enough people report a set, it's taken out of the
// categories until it's checked.
const ReportSetButton = ({ cardId }) => {
  const user = useSelector(selectCurrentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [reportSet, { isLoading, isSuccess, error, reset }] = useReportSetMutation();

  const close = () => {
    setIsOpen(false);
    setReason("");
    setNote("");
    reset();
  };

  const send = (event) => {
    event.preventDefault();
    if (reason) reportSet({ cardId, reason, note: note.trim() });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150"
      >
        <FlagIcon className="h-4 w-4" aria-hidden="true" />
        Report this set
      </button>

      <Modal isOpen={isOpen} onClose={close} maxWidth="md">
        <div className="bg-white dark:bg-[#14112a] p-6" role="dialog" aria-labelledby="report-set-title">
          <h3 id="report-set-title" className="text-xl font-heading text-gray-900 dark:text-white">
            Report this set
          </h3>

          {!user ? (
            <>
              <p className="mt-2 text-sm text-gray-500 dark:text-white/40">Log in to report a set.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className={buttonClass} onClick={close}>
                  Cancel
                </button>
                <Link to="/authenticate" className={primaryClass}>
                  Log in
                </Link>
              </div>
            </>
          ) : isSuccess ? (
            <>
              <p className="mt-2 text-sm text-gray-500 dark:text-white/40">Thanks for letting us know. We'll take a look.</p>
              <div className="mt-6 flex justify-end">
                <button type="button" className={buttonClass} onClick={close}>
                  Close
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={send}>
              <fieldset className="mt-4">
                <legend className="text-sm font-medium text-gray-700 dark:text-white/70">What's wrong with it?</legend>
                <div className="mt-2 space-y-2">
                  {REASONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 text-sm text-gray-700 dark:text-white/70 cursor-pointer">
                      <input
                        type="radio"
                        name="report-reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => setReason(option.value)}
                        className="h-4 w-4 accent-brand-primary"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-white/70">
                Anything to add? <span className="font-normal text-gray-400 dark:text-white/30">(optional)</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="mt-1 block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-sm text-gray-900 dark:text-white"
                />
              </label>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {error.data?.error ?? "Couldn't send the report. Please try again."}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className={buttonClass} onClick={close}>
                  Cancel
                </button>
                <button type="submit" className={primaryClass} disabled={!reason || isLoading}>
                  {isLoading ? "Sending…" : "Send report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ReportSetButton;
