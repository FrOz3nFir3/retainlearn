import React from "react";

const ProfileEditForm = ({
  user,
  nameRef,
  emailRef,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-white/60"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          ref={nameRef}
          defaultValue={user.name}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-white/60"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          ref={emailRef}
          defaultValue={user.email}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 sm:text-sm"
        />
      </div>
      <div className="flex justify-start space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer px-4 py-2 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/60 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer px-4 py-2 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 text-white dark:text-brand-dark rounded-xl disabled:opacity-50 transition-colors duration-200"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
