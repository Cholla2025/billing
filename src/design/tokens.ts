// Cholla design system tokens (buildspec 06_DESIGN_SYSTEM.md + inline prototype).
// The visual identity is shared with the Check-In System — do not drift.

export const COLORS = {
  primary: "#4C84C4", // primary blue
  navy: "#21314F", // headers / dark bars / sidebar
  terracotta: "#BE6A45", // primary action buttons
  teal: "#3F9C93",
  violet: "#7A6FB0",
  green: "#2E9E73",
  gold: "#E0A32E",
  slate: "#8CA0BC",

  skyBg: "#EEF4FB", // app background
  skyTint: "#DCE8F6",
  panel: "#F7FAFE",
  white: "#ffffff",

  ink: "#21314F",
  body: "#3A4A66",
  muted: "#7A8AA3",
  faint: "#9AA8BD",
  border: "#DCE3EE",
  borderSoft: "#E7EDF5",

  ok: "#1F7A56",
  warn: "#B5742A",
  danger: "#B14233",
  dangerBright: "#C1453B",
} as const;

// Categorical chart palette (order matters — matches the prototype).
export const CHART = [
  "#4C84C4",
  "#21314F",
  "#BE6A45",
  "#3F9C93",
  "#7A6FB0",
  "#2E9E73",
  "#E0A32E",
  "#8CA0BC",
] as const;

export const FONTS = {
  heading: "'Poppins', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
};

// Status-pill color system (bg, fg) — consistent across every surface.
export const PILL: Record<string, [string, string]> = {
  Paid: ["#E3F3EC", "#1F7A56"],
  Accepted: ["#E3F3EC", "#1F7A56"],
  Submitted: ["#DCE8F6", "#2C5C94"],
  Draft: ["#EEF1F6", "#5A6B85"],
  Rejected: ["#FBEEDD", "#B5742A"],
  Denied: ["#F7E3E0", "#B14233"],
  Active: ["#E3F3EC", "#1F7A56"],
  Expiring: ["#FBEEDD", "#B5742A"],
  Expired: ["#F7E3E0", "#B14233"],
  Pending: ["#DCE8F6", "#2C5C94"],
  Appeal: ["#EAE6F3", "#5B4B94"],
  "Correct & resubmit": ["#DCE8F6", "#2C5C94"],
  "Write-off": ["#EEF1F6", "#5A6B85"],
};
