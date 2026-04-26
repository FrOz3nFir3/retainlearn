import React from "react";

const ProfileView = ({ user, onEdit }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-gray-700 dark:text-white/60">
          Name
        </h2>
        <p className="text-gray-900 dark:text-white">{user.name}</p>
      </div>
      <div>
        <h2 className="text-lg font-medium text-gray-700 dark:text-white/60">
          Email
        </h2>
        <p className="text-gray-900 dark:text-white">{user.email}</p>
      </div>
      <button
        onClick={onEdit}
        className="cursor-pointer mt-4 px-4 py-2 bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 text-white dark:text-brand-dark rounded-xl transition-colors duration-200"
      >
        Edit Profile
      </button>
    </div>
  );
};

export default ProfileView;
