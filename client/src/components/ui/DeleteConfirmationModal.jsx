import React from "react";
import Modal from "./Modal";
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/authentication/state/authSlice";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}) => {
  const user = useSelector(selectCurrentUser);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="lg">
      <div className="bg-white dark:bg-[#14112a] p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
          <div className="shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <ExclamationTriangleIcon
              className="h-7 w-7 text-red-500 dark:text-red-400"
              aria-hidden="true"
            />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-heading text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/40">
              {description}
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <ShieldExclamationIcon
              className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              This action is irreversible. Please be certain before proceeding.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-white/6">
          <div className="text-sm text-gray-400 dark:text-white/30">
            {!user && "Login to delete"}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white/60 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              disabled={!user}
              type="button"
              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;
