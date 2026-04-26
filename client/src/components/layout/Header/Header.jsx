import { useState, useRef, Suspense } from "react";
import { useSelector } from "react-redux";
import { usePostAuthDetailsMutation } from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/authentication/state/authSlice";

import useAuthEffect from "../../../hooks/useAuthEffect";
import useClickOutside from "../../../hooks/useClickOutside";
import useHeaderScroll from "../../../hooks/useHeaderScroll";

import ThemeToggler from "./ThemeToggler";
import ProfileMenuSkeleton from "../../ui/skeletons/ProfileMenuSkeleton";
import DesktopNav from "./DesktopNav";
import HeaderLogo from "./HeaderLogo";
import MobileMenuButton from "./MobileMenuButton";
import React from "react";

const ProfileMenu = React.lazy(() => import("./ProfileMenu"));
const MobileMenu = React.lazy(() => import("./MobileMenu"));

function Header() {
  const [postAuthDetails, { isLoading }] = usePostAuthDetailsMutation();
  const user = useSelector(selectCurrentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useAuthEffect(postAuthDetails);
  useClickOutside(profileMenuRef, () => setIsProfileOpen(false));
  const { isScrolled, isFocusedSession, isTransparent } = useHeaderScroll();

  const toggleMobileMenu = () => setIsOpen(!isOpen);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Categories", href: "/categories" },
  ];

  return (
    <nav
      className={`font-sans sticky top-0 z-50 transition-all duration-300 ${
        isFocusedSession
          ? "bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-white/8"
          : isScrolled
          ? "bg-white dark:bg-brand-dark backdrop-blur-lg border-b border-gray-200 dark:border-white/8 shadow-sm"
          : isTransparent
          ? "bg-brand-dark"
          : "bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-white/8"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center">
            <HeaderLogo isTransparent={isTransparent} />
            <DesktopNav navigation={navigation} isTransparent={isTransparent} />
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            <ThemeToggler isTransparent={isTransparent} />
            {isLoading ? (
              <ProfileMenuSkeleton />
            ) : (
              <Suspense fallback={<ProfileMenuSkeleton />}>
                <ProfileMenu
                  user={user}
                  isProfileOpen={isProfileOpen}
                  setIsProfileOpen={setIsProfileOpen}
                  profileMenuRef={profileMenuRef}
                  isTransparent={isTransparent}
                />
              </Suspense>
            )}
            <MobileMenuButton
              isOpen={isOpen}
              onClick={toggleMobileMenu}
              isTransparent={isTransparent}
            />
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <MobileMenu
          isOpen={isOpen}
          navigation={navigation}
          user={user}
          setIsOpen={setIsOpen}
          isLoading={isLoading}
        />
      </Suspense>
    </nav>
  );
}

export default Header;
