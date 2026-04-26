import { Link } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import UserInfo from "./UserInfo";
import UserMenuItems from "./UserMenuItems";

const ProfileMenu = ({
  user,
  isProfileOpen,
  setIsProfileOpen,
  profileMenuRef,
  isTransparent,
}) => {
  const closeMenu = () => setIsProfileOpen(false);

  return (
    <div className="hidden md:block">
      {user ? (
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
              isTransparent
                ? "text-white/70 hover:text-white hover:bg-white/8"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <div className="relative">
              <UserCircleIcon className="h-6 w-6" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-current" />
            </div>
            <span className="text-sm font-medium max-w-24 truncate">
              {user.name}
            </span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 z-50 mt-3 w-64 origin-top-right">
              <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-black/5 dark:ring-white/10 border border-gray-200/60 dark:border-white/8">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/8">
                  <UserInfo user={user} />
                </div>
                <UserMenuItems isMobile={false} closeMenu={closeMenu} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          to="/authenticate"
          className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 ${
            isTransparent
              ? "bg-brand-accent hover:bg-amber-400 text-brand-dark shadow-md shadow-brand-accent/20"
              : "bg-brand-primary hover:bg-indigo-700 text-white dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark"
          }`}
        >
          Login / Register
        </Link>
      )}
    </div>
  );
};

export default ProfileMenu;
