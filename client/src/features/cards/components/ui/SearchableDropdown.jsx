import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  isLoading = false,
  onOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  const selectedOption = useMemo(() => {
    const found = options?.find((opt) => opt.value === value);
    return found;
  }, [options, value]);

  // Update search term when the selection changes externally
  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    } else {
      setSearchTerm("");
    }
  }, [selectedOption]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        // If dropdown is closed without selection, revert to selected option's text
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  const handleSelect = (option) => {
    onChange(option.value);
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation(); // Prevent the dropdown from opening
    onChange(null);
    setSearchTerm("");
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
      if (!value?.trim()) {
        onOpen?.();
      }
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!value?.trim()) {
      onOpen?.();
    }
  };

  const filteredOptions = useMemo(
    () =>
      options?.filter((option) => {
        if (!searchTerm) return true;
        // When a user is typing, we should still allow them to search
        if (searchTerm !== selectedOption?.label || "") {
          const labelText = option.label.toLowerCase();
          const descriptionText = option.description
            ? option.description.toLowerCase()
            : "";
          const searchTermLower = searchTerm.toLowerCase();

          return (
            labelText.includes(searchTermLower) ||
            descriptionText.includes(searchTermLower)
          );
        }
        // If a selection is made, searchTerm will match the label,
        // but we should still show all options so the user can change their selection
        return true;
      }) || [],
    [options, searchTerm, selectedOption]
  );

  useEffect(() => {
    if (!value?.trim()) return;
    onOpen?.();
  }, [value]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-primary/40 dark:hover:border-brand-accent/30 focus:border-brand-primary dark:focus:border-brand-accent focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:outline-none transition-colors duration-200"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {value ? (
            <button
              onClick={handleClear}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              aria-label="Clear selection"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          ) : (
            <ChevronDownIcon
              className="h-4 w-4 text-gray-500 shrink-0"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      {isOpen && (
        <>
          {/* Backdrop */}
          {createPortal(
            <div
              className="fixed inset-0 z-1"
              onClick={() => {
                setIsOpen(false);
                // If dropdown is closed without selection, revert to selected option's text
                if (selectedOption) {
                  setSearchTerm(selectedOption.label);
                } else {
                  setSearchTerm("");
                }
              }}
            />,
            document.body
          )}

          {/* Dropdown */}
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg max-h-72 overflow-y-auto">
            {isLoading ? (
              /* Loading Skeleton - Matches dropdown item structure */
              <div className="py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-4 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Label skeleton */}
                        <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-24 mb-2"></div>
                        {/* Description skeleton - 3 lines */}
                        <div className="space-y-1.5">
                          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-5/6"></div>
                          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-4/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  className={`cursor-pointer w-full text-left px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200 ${
                    option.value === value
                      ? "bg-brand-surface dark:bg-white/8 border-l-4 border-brand-primary dark:border-brand-accent"
                      : ""
                  } ${index === 0 ? "rounded-t-xl" : ""} ${
                    index === filteredOptions.length - 1 ? "rounded-b-xl" : ""
                  }`}
                  onMouseDown={() => handleSelect(option)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-gray-600 dark:text-white/30 mt-2 leading-relaxed line-clamp-3">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {option.value === value && (
                      <div className="ml-2 w-2 h-2 bg-brand-primary dark:bg-brand-accent rounded-full shrink-0" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-gray-500 dark:text-white/30">
                No results found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchableDropdown;
