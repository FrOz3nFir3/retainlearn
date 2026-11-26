// The kit's icons, from the prototype: line drawings on a 24 by 24 grid, drawn in the text's colour. Decorative, so
// hidden from screen readers: a button with only an icon names itself (IconButton's label).
import type { ReactNode } from "react";

const PATHS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  rotateLeft: <><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v4.2h4.2" /></>,
  rotateRight: <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 4.5v4.2h-4.2" /></>,
  home: <path d="M4 11l8-7 8 7v9h-5.5v-6h-5v6H4z" />,
  locate: <><circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="1.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" /></>,
  flame: <path d="M12 3c.8 3 5 5.2 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.8 2.3-4.8.1 1.9 1 3 2.2 3.2C11.6 8.7 10.6 6 12 3z" />,
  bell: <><path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></>,
  review: <><path d="M3.5 5.5c2.8-1.1 5.8-1 8.5.6 2.7-1.6 5.7-1.7 8.5-.6v13.2c-2.8-1.1-5.8-1-8.5.6-2.7-1.6-5.7-1.7-8.5-.6z" /><path d="M12 6.1v13.4" /></>,
  quiz: <><path d="M2 9.5l10-5 10 5-10 5z" /><path d="M6 11.5v4.8c3.4 2.4 8.6 2.4 12 0v-4.8" /></>,
  focus: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.2" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  layers: <><path d="M12 4l9 5-9 5-9-5z" /><path d="M3 14l9 5 9-5" /></>,
  gift: <><path d="M4 11h16v9H4z" /><path d="M3 7.5h18V11H3z" /><path d="M12 7.5V20" /><path d="M12 7.5C10.5 4 7 4 7 6s3.5 1.5 5 1.5c1.5 0 5 .5 5-1.5s-3.5-2-5 1.5z" /></>,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  chevronUp: <path d="M6 14.5l6-6 6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowDown: <path d="M12 5v14M6.5 13.5L12 19l5.5-5.5" />,
  arrowUp: <path d="M12 19V5M6.5 10.5L12 5l5.5 5.5" />,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4.2l2.8 1.8" /></>,
  sparkle: <path d="M12 3.5l1.9 5.1L19 10.5l-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  bot: <><rect x="5" y="8" width="14" height="11" rx="3" /><path d="M12 4.5V8M9 13h.01M15 13h.01M9.5 16.5h5" /></>,
  trophy: <><path d="M8 4h8v4.5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 3.5M16 6h3a3 3 0 0 1-3 3.5M12 12.5V16M8.5 20h7M10 16h4v4h-4z" /></>,
  cards: <><rect x="3.5" y="6" width="11" height="14" rx="2" /><path d="M8.5 3.5h9a2 2 0 0 1 2 2V17" /></>,
  swords: <><path d="M14.5 4H20v5.5L10 19.5 4.5 14z" /><path d="M7 12l5 5M3.5 20.5l3-3" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></>,
  users: <><circle cx="9" cy="9" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" /></>,
  path: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></>,
  inbox: <><path d="M3.5 13l2.5-7.5h12L20.5 13v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" /><path d="M3.5 13h5l1.5 2.5h4L15.5 13h5" /></>,
  share: <><circle cx="17.5" cy="5.5" r="2.5" /><circle cx="6.5" cy="12" r="2.5" /><circle cx="17.5" cy="18.5" r="2.5" /><path d="M8.7 10.8l6.6-4M8.7 13.2l6.6 4" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  shield: <path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" />,
  bolt: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
  skip: <><path d="M4.5 6.5l7 5.5-7 5.5z" /><path d="M12 6.5l7 5.5-7 5.5z" /></>,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  pause: <path d="M8.5 5.5v13M15.5 5.5v13" />,
  ball: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8.2l3.4 2.5-1.3 4h-4.2l-1.3-4z" /><path d="M12 8.2V3.5M15.4 10.7l4.6-1.6M14.1 14.7l2.8 3.9M9.9 14.7l-2.8 3.9M8.6 10.7L4 9.1" /></>,
  logout: <><path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" /><path d="M10.5 12H20M16.5 8.5L20 12l-3.5 3.5" /></>,
  user: <><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  cube: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></>,
  download: <><path d="M12 4v11M7 10.5l5 5 5-5" /><path d="M4.5 19.5h15" /></>,
  flag: <><path d="M5 21V4.5" /><path d="M5 4.5h11l-2 4 2 4H5" /></>,
  building: <><path d="M4 20.5V9l8-5 8 5v11.5" /><path d="M9 20.5v-6h6v6M3 20.5h18" /></>,
  report: <><rect x="4.5" y="3.5" width="15" height="17" rx="2" /><path d="M8.5 15.5v-3M12 15.5v-6M15.5 15.5v-4.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  sunrise: <><path d="M3 19.5h18M7.5 19.5a4.5 4.5 0 0 1 9 0" /><path d="M4.8 13.3l1.4 1.4M19.2 13.3l-1.4 1.4" /><path d="M12 9.5v-6M9.5 6L12 3.5 14.5 6" /></>,
  sunset: <><path d="M3 19.5h18M7.5 19.5a4.5 4.5 0 0 1 9 0" /><path d="M4.8 13.3l1.4 1.4M19.2 13.3l-1.4 1.4" /><path d="M12 3.5v6M9.5 7L12 9.5 14.5 7" /></>,
  moon: <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />,
  grip: <><circle cx="9" cy="6.5" r="1.2" fill="currentColor" /><circle cx="15" cy="6.5" r="1.2" fill="currentColor" /><circle cx="9" cy="12" r="1.2" fill="currentColor" /><circle cx="15" cy="12" r="1.2" fill="currentColor" /><circle cx="9" cy="17.5" r="1.2" fill="currentColor" /><circle cx="15" cy="17.5" r="1.2" fill="currentColor" /></>,
  more: <><circle cx="12" cy="5.5" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /><circle cx="12" cy="18.5" r="1.3" fill="currentColor" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5", strokeWidth = 1.8 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
