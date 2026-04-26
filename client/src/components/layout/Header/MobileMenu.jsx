import { NavLink, Link } from "react-router-dom";
import { HomeIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import UserInfo from "./UserInfo";
import UserMenuItems from "./UserMenuItems";
import MobileMenuSkeleton from "../../ui/skeletons/MobileMenuSkeleton";

const MobileMenu = ({ isOpen, navigation, user, setIsOpen, isLoading }) => {
  const closeMenu = () => setIsOpen(false);

  const getNavIcon = (name) => {
    switch (name) {
      case "Categories": return RectangleStackIcon;
      default: return HomeIcon;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      <div className="bg-white/98 dark:bg-brand-dark/98 backdrop-blur-xl border-t border-gray-100 dark:border-white/8">
        {/* Nav links */}
        <div className="px-3 py-2 space-y-0.5">
          {navigation.map((item) => {
            const Icon = getNavIcon(item.name);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-brand-primary/6 dark:bg-brand-accent/8 text-brand-primary dark:text-brand-accent"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-brand-accent" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User section */}
        <div className="border-t border-gray-100 dark:border-white/8 px-3 py-3">
          {user ? (
            <>
              <div className="px-4 py-3 mb-1.5 bg-gray-50 dark:bg-white/4 rounded-xl">
                <UserInfo user={user} />
              </div>
              <div className="space-y-0.5">
                <UserMenuItems isMobile={true} closeMenu={closeMenu} />
              </div>
            </>
          ) : isLoading ? (
            <MobileMenuSkeleton />
          ) : (
            <Link
              to="/authenticate"
              onClick={closeMenu}
              className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-brand-accent hover:bg-amber-400 text-brand-dark font-semibold text-sm transition-colors duration-150"
            >
              Register / Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
