import { NavLink } from "react-router-dom";

const DesktopNav = ({ navigation, isTransparent }) => {
  return (
    <div className="hidden md:block ml-8">
      <div className="flex items-center gap-0.5">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isTransparent
                  ? isActive
                    ? "text-white bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                  : isActive
                  ? "text-brand-primary dark:text-brand-accent bg-brand-primary/6 dark:bg-brand-accent/8"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default DesktopNav;
