import React from "react";
import { Link } from "react-router-dom";
import { RocketLaunchIcon, BookOpenIcon } from "@heroicons/react/24/outline";

const EmptyState = ({ title, message, ctaText, ctaLink }) => {
  return (
    <div className="text-center bg-white dark:bg-[#14112a] p-12 rounded-2xl border border-gray-200 dark:border-white/8">
      <div className="w-24 h-24 bg-brand-surface dark:bg-white/8 rounded-full flex items-center justify-center mx-auto mb-6">
        <RocketLaunchIcon className="w-12 h-12 text-brand-primary dark:text-brand-accent/70" />
      </div>
      <h3 className="text-2xl font-heading text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
        {message}
      </p>
      <Link
        to={ctaLink}
        className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 transition-colors duration-200"
      >
        <BookOpenIcon className="w-5 h-5 mr-2" />
        {ctaText}
      </Link>
    </div>
  );
};

export default EmptyState;
