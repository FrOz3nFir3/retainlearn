import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const NavigationDropdown = ({
  items,
  currentIndex,
  onItemSelect,
  placeholder = "Go to item...",
  getItemLabel,
  getItemDescription,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (index) => {
    onItemSelect(index);
    setIsOpen(false);
  };

  const currentItem = items[currentIndex];
  const buttonText = currentItem ? getItemLabel(currentItem, currentIndex) : placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white/70 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-primary/40 dark:hover:border-brand-accent/30 transition-colors duration-150"
      >
        <span className="truncate max-w-[160px]">{buttonText}</span>
        {isOpen
          ? <ChevronUpIcon className="h-3.5 w-3.5 text-gray-400 dark:text-white/30 shrink-0" />
          : <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400 dark:text-white/30 shrink-0" />
        }
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-50 w-72 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {items.map((item, index) => (
            <button
              key={item._id || index}
              onClick={() => handleItemClick(index)}
              className={`cursor-pointer w-full text-left px-4 py-3 transition-colors duration-150 ${
                index === currentIndex
                  ? "bg-brand-surface dark:bg-white/8 border-l-2 border-brand-primary dark:border-brand-accent"
                  : "hover:bg-gray-50 dark:hover:bg-white/5"
              } ${index === 0 ? "rounded-t-xl" : ""} ${
                index === items.length - 1 ? "rounded-b-xl" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {getItemLabel(item, index)}
                  </p>
                  {getItemDescription && (
                    <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 line-clamp-2 leading-relaxed">
                      {getItemDescription(item)}
                    </p>
                  )}
                </div>
                {index === currentIndex && (
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavigationDropdown;
