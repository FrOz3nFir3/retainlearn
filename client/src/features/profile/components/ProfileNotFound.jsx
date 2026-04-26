import React from "react";
import { Link } from "react-router-dom";
import { HomeIcon, ArrowLeftIcon, UserCircleIcon } from "@heroicons/react/24/outline";

const ProfileNotFound = ({ username }) => {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-brand-light dark:bg-[#0f0d1a] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8">
      <div>
        <div className="mx-auto h-24 w-24 text-brand-primary dark:text-brand-accent/70">
            <UserCircleIcon />
        </div>
        <h1 className="mt-4 text-3xl font-heading text-gray-900 dark:text-white sm:text-4xl">
          User not found
        </h1>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
          Sorry, we couldn't find a user with the username "@{username}".
        </p>
        <div className="mt-6 flex justify-center items-center space-x-4">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 transition-colors duration-200"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-200 dark:border-white/10 text-sm font-medium rounded-xl text-gray-700 dark:text-white/60 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileNotFound;
