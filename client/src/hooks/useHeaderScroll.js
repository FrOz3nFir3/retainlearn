import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const useHeaderScroll = () => {
  // Initialize from actual scroll position to avoid flash of transparent header on page load
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 10);
  const location = useLocation();

  const isFocusedSession =
    location.pathname.includes("/review") ||
    location.pathname.includes("/quiz") ||
    location.pathname.includes("/edit");

  // Only allow transparent header on the landing page — other pages have light backgrounds
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    if (!isFocusedSession) {
      // Re-check scroll on route change (different pages start at different positions)
      setIsScrolled(window.scrollY > 10);
      const handleScroll = () => setIsScrolled(window.scrollY > 10);
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setIsScrolled(false);
    }
  }, [isFocusedSession, location.pathname]);

  const isTransparent = isLandingPage && !isScrolled && !isFocusedSession;

  return { isScrolled, isFocusedSession, isTransparent };
};

export default useHeaderScroll;
