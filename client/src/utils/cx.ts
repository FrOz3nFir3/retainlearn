// Joins class names, leaving out the ones switched off: cx("rounded", open && "shadow").
export const cx = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(" ");
