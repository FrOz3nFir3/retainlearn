import React from "react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const RestrictedAccess = ({ description }) => {
  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] flex flex-col justify-center items-center text-center py-12 px-4">
      <div className="max-w-lg w-full bg-white dark:bg-[#14112a] p-10 rounded-2xl border border-gray-200 dark:border-white/8">
        <div className="mx-auto w-12 h-12 bg-brand-surface dark:bg-white/8 rounded-xl flex items-center justify-center">
          <LockClosedIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
        </div>
        <h2 className="mt-6 text-2xl font-heading text-gray-900 dark:text-white">
          Access Restricted
        </h2>
        <p className="mt-2 text-gray-600 dark:text-white/60">
          {description ||
            "You need to be logged in to access this page. Please log in or sign up to continue."}
        </p>
        <div className="mt-8">
          <Link
            to="/authenticate"
            className="w-full inline-flex justify-center items-center rounded-xl bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 px-6 py-3 text-base font-semibold text-white dark:text-brand-dark transition-colors duration-200"
          >
            Login or Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RestrictedAccess;
