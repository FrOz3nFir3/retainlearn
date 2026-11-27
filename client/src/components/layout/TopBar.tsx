// The app's top bar (the prototype's Hud top bar), on every page but a class: the logo, the main places, and for a
// signed-in player their streak, level and account menu (profile, theme, sign out); Sign in otherwise; on wide screens a
// search of the subjects. One compact row,
// the one bar that stays at the top, sliding away while you scroll down (styles/kit.css; guide:
// content-first-noise-reduction). On phones the main places are in the tab bar at the bottom (TabBar.tsx).
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { XP_PER_LEVEL } from "@retainlearn/core";
import { setColorScheme, useColorScheme } from "#app/colorScheme.ts";
import type { SchemeChoice } from "#app/colorScheme.ts";
import { useAppSelector } from "#app/hooks.ts";
import { useSession } from "#app/session.ts";
import { Avatar } from "#components/ui/Avatar.tsx";
import { Bar } from "#components/ui/Bar.tsx";
import { buttonClass } from "#components/ui/Button.tsx";
import { Icon } from "#components/ui/Icon.tsx";
import { Menu, MenuButton, MenuGroup, MenuLink, MenuRadio, MenuSeparator } from "#components/ui/Menu.tsx";
import { SearchInput } from "#components/ui/SearchInput.tsx";
import { SkeletonCircle, SkeletonLine } from "#components/ui/Skeleton.tsx";
import { useCampus } from "#features/campus/campusApi.ts";
import useLogout from "#hooks/useLogout.js";
import { cx } from "#utils/cx.ts";
import { mainPlaces } from "./navigation.ts";

export function TopBar() {
  const session = useSession();
  return (
    <header className="kit-top-bar sticky top-0 z-50 border-b border-ink/6 bg-surface/90 text-ink backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <img src="/images/logo.svg" alt="" width={32} height={31} className="size-7 sm:size-8" />
          <span className="text-base font-bold tracking-tight sm:text-[17px]">RetainLearn</span>
        </Link>
        {/* The current page: a tint, and an underline that also shows in forced colours (guide: navbar). */}
        <nav aria-label="Main" className="ml-2 hidden md:block">
          <ul className="flex items-center gap-0.5">
            {mainPlaces(session === "out").map((place) => (
              <li key={place.to}>
                <NavLink
                  to={place.to}
                  end={place.to === "/"}
                  className="block rounded-lg px-3 py-1.5 text-sm font-semibold text-ink/65 transition-colors hover:bg-ink/5 hover:text-ink aria-[current=page]:bg-brand/8 aria-[current=page]:text-brand aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[7px]"
                >
                  {place.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <SubjectSearch />
        <div className="ml-auto flex items-center gap-2 xl:ml-3">
          {session === "in" ? (
            <>
              <PlayerStatus />
              <AccountMenu />
            </>
          ) : session === "out" ? (
            <>
              <ThemeMenu />
              <Link to="/sign-in" className={buttonClass("primary", "sm")}>
                Sign in
              </Link>
            </>
          ) : (
            // While the session is checked: the signed-in cluster's shapes (status, then the avatar's button), so the
            // bar doesn't move when it answers.
            <>
              <SkeletonLine className="h-8 w-16 lg:w-44" />
              <span className="p-0.5">
                <SkeletonCircle className="size-8" />
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Searching the subjects from anywhere, on wide screens (the prototype's): it opens the subjects page with the search.
// A real form to /subjects?search=, so it also works before the app's code has loaded.
function SubjectSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  return (
    <search className="ml-auto hidden w-64 xl:block">
      <form
        action="/subjects"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.trim();
          navigate(q ? `/subjects?search=${encodeURIComponent(q)}` : "/subjects");
          setQuery("");
        }}
      >
        <SearchInput name="search" label="Search subjects" placeholder="Search subjects" value={query} onChange={setQuery} className="[&_input]:h-9" />
      </form>
    </search>
  );
}

// Your streak, lit once today's class has kept it, and your level with the XP to the next (from the campus's data).
function PlayerStatus() {
  const campus = useCampus();
  if (!campus.data) return <SkeletonLine className="h-8 w-16 lg:w-44" />;
  const { streak, xp, level } = campus.data.player;
  const into = xp - (level - 1) * XP_PER_LEVEL;
  return (
    <>
      <p className={cx("flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold", streak.keptToday ? "bg-bell-wash text-bell-ink" : "bg-ink/5 text-ink/75")}>
        <Icon name="flame" className={cx("size-4", streak.count ? "text-bell" : "text-ink/30")} />
        <span className="sr-only">Streak: </span>
        <span className="tabular-nums">{streak.count}</span>
        <span className="max-sm:sr-only">{streak.count === 1 ? " day" : " days"}</span>
        <span className="sr-only">{streak.keptToday ? ", kept today" : ", one class today keeps it"}</span>
      </p>
      <div className="hidden min-w-28 flex-col gap-1 lg:flex">
        <p className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-semibold">Level {level}</span>
          <span className="text-ink/50 tabular-nums">
            {into}/{XP_PER_LEVEL} XP
          </span>
        </p>
        <Bar value={into / XP_PER_LEVEL} label={`Level ${level}: ${into} of ${XP_PER_LEVEL} XP to the next level`} className="h-1.5" />
      </div>
    </>
  );
}

const SCHEMES: { value: SchemeChoice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// The theme for a visitor (the account menu has it for a player): System, Light or Dark, behind a sun or moon.
function ThemeMenu() {
  const { choice, deviceDark } = useColorScheme();
  const dark = choice === "dark" || (choice === "system" && deviceDark);
  return (
    <Menu
      label="Theme"
      triggerClassName="grid size-9 place-items-center rounded-xl text-ink/65 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-expanded:bg-ink/8"
      trigger={<Icon name={dark ? "moon" : "sun"} className="size-5" />}
    >
      <ThemeChoices choice={choice} deviceDark={deviceDark} />
    </Menu>
  );
}

function ThemeChoices({ choice, deviceDark }: { choice: SchemeChoice; deviceDark: boolean }) {
  return (
    <MenuGroup label="Theme">
      {SCHEMES.map((scheme) => (
        <MenuRadio key={scheme.value} checked={choice === scheme.value} onSelect={() => setColorScheme(scheme.value)}>
          {scheme.value === "system" ? `System (now ${deviceDark ? "dark" : "light"})` : scheme.label}
        </MenuRadio>
      ))}
    </MenuGroup>
  );
}

// Your account: your profile, the theme (a setting, so behind this menu rather than a switch always on show; guide:
// dark-mode-toggle), and signing out.
function AccountMenu() {
  const user = useAppSelector((state) => (state.auth as { user?: { name?: string; username?: string } | null }).user);
  const { choice, deviceDark } = useColorScheme();
  const signOut = useLogout();
  const name = user?.name || user?.username || "You";
  return (
    <Menu
      label={`${name}, your account`}
      triggerClassName="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-expanded:bg-ink/8"
      trigger={
        <>
          <Avatar name={name} />
          <span className="hidden pr-2 text-sm font-semibold 2xl:inline">{name}</span>
        </>
      }
    >
      <p className="px-3 pt-1.5 pb-1 text-xs text-ink/55">
        Signed in as <span className="font-semibold text-ink">{name}</span>
      </p>
      <MenuLink to="/profile" icon="user">
        Your profile
      </MenuLink>
      <MenuSeparator />
      <ThemeChoices choice={choice} deviceDark={deviceDark} />
      <MenuSeparator />
      <MenuButton icon="logout" onSelect={() => void signOut()}>
        Sign out
      </MenuButton>
    </Menu>
  );
}
