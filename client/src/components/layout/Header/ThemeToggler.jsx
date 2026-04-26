import useDarkMode from "../../../hooks/useDarkMode";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const ThemeToggler = ({ isTransparent }) => {
  const [theme, setTheme] = useDarkMode();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`cursor-pointer p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
        isTransparent
          ? "text-white/60 hover:text-white hover:bg-white/8"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
      }`}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="w-5 h-5">
        {theme === "dark" ? (
          <SunIcon className="w-5 h-5" />
        ) : (
          <MoonIcon className="w-5 h-5" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggler;
