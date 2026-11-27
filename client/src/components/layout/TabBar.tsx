// The app's main places on phones (the prototype's tab bar), at the bottom where a thumb reaches, on every page but a
// class, and clear of the phone's home indicator. It slides away as you scroll down, with the top bar
// (styles/kit.css). The current place: its icon on a solid pill, as well as the colour (guide: navbar). From the md
// breakpoint the top bar has the places instead.
import { NavLink } from "react-router-dom";
import { useSession } from "#app/session.ts";
import { Icon } from "#components/ui/Icon.tsx";
import { mainPlaces } from "./navigation.ts";
import type { Place } from "./navigation.ts";

export function TabBar() {
  const signedOut = useSession() === "out";
  const you: Place = signedOut ? { to: "/sign-in", label: "Sign in", icon: "user" } : { to: "/profile", label: "You", icon: "user" };
  return (
    <nav aria-label="Main" className="kit-tab-bar fixed inset-x-0 bottom-0 z-50 border-t border-ink/6 bg-surface/92 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] text-ink backdrop-blur-xl md:hidden">
      <ul className="flex">
        {[...mainPlaces(signedOut).filter((place) => !place.wide), you].map((place) => (
          <li key={place.to} className="flex-1">
            <NavLink
              to={place.to}
              end={place.to === "/"}
              className="group flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-semibold text-ink/60 aria-[current=page]:text-brand"
            >
              <span className="grid h-7 w-12 place-items-center rounded-full transition-colors group-aria-[current=page]:bg-brand group-aria-[current=page]:text-white">
                <Icon name={place.icon} className="size-5" />
              </span>
              {place.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
