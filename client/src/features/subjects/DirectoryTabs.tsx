// The directory's two lists (the prototype's Directory tabs): every subject, and skill paths. Links, as each is a page
// with its own address; the one on show is the current page (NavLink marks it aria-current). Loaded with the app, as
// both lists' skeletons show it.
import { NavLink } from "react-router-dom";
import { TABLIST_CLASS, tabClass } from "#components/ui/Tabs.tsx";
import { cx } from "#utils/cx.ts";

export function DirectoryTabs() {
  return (
    <nav aria-label="Subjects and paths" className={cx(TABLIST_CLASS, "mb-4")}>
      <NavLink to="/subjects" end className={({ isActive }) => tabClass(isActive)}>
        Subjects
      </NavLink>
      <NavLink to="/paths" end className={({ isActive }) => tabClass(isActive)}>
        Paths
      </NavLink>
    </nav>
  );
}
