import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const MobileMenuButton = ({ isOpen, onClick, isTransparent }) => {
  return (
    <div className="md:hidden">
      <button
        onClick={onClick}
        className={`cursor-pointer inline-flex items-center justify-center p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
          isTransparent
            ? "text-white/60 hover:text-white hover:bg-white/8"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
        }`}
      >
        <span className="sr-only">Open main menu</span>
        {isOpen ? (
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Bars3Icon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

export default MobileMenuButton;
