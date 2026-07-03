type IconName =
  | "home"
  | "health"
  | "wallet"
  | "bell"
  | "share"
  | "plus"
  | "chevron"
  | "chevron-left"
  | "check"
  | "paw"
  | "scissors"
  | "bug"
  | "pill"
  | "bowl"
  | "bone"
  | "question"
  | "camera"
  | "trash"
  | "phone"
  | "hospital"
  | "calendar"
  | "gift"
  | "sparkles"
  | "file"
  | "link"
  | "box"
  | "search"
  | "edit"
  | "mail"
  | "clock";

const paths: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5" />,
  health: (
    <path d="M3 12h4l2-6 3 12 2.5-8 1.5 2h5" />
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M16.5 14.5h.01" />
    </>
  ),
  bell: <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2ZM9.5 20a2.5 2.5 0 0 0 5 0" />,
  share: (
    <>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="17" cy="6" r="2.4" />
      <circle cx="17" cy="18" r="2.4" />
      <path d="M8.2 10.9 14.8 7.1M8.2 13.1l6.6 3.8" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  check: <path d="m5 12 5 5 9-11" />,
  paw: (
    <>
      <circle cx="7" cy="9" r="1.8" />
      <circle cx="12" cy="7" r="1.8" />
      <circle cx="17" cy="9" r="1.8" />
      <path d="M12 12c-3 0-5 2-5 4.2 0 1.6 1.4 2.3 2.8 1.9 1.4-.4 3-.4 4.4 0 1.4.4 2.8-.3 2.8-1.9C17 14 15 12 12 12Z" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <path d="M8 7.5 20 18M8 16.5 20 6" />
    </>
  ),
  bug: (
    <>
      <rect x="8" y="8" width="8" height="11" rx="4" />
      <path d="M12 4v4M5 9l3 1M19 9l-3 1M4 14h4M16 14h4M5 19l3-2M19 19l-3-2" />
    </>
  ),
  pill: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)" />
      <path d="M9 9l6 6" />
    </>
  ),
  bowl: <path d="M3 11h18a9 9 0 0 1-18 0ZM7 11c0-3 2.5-5 5-5s5 2 5 5" />,
  bone: (
    <path d="M8 8a2.2 2.2 0 1 0-1.6 3.7L11 14l2.6 2.3A2.2 2.2 0 1 0 16 15a2.2 2.2 0 1 0-1.4-3.7L10 9 7.4 6.7A2.2 2.2 0 1 0 8 8Z" />
  ),
  question: <path d="M9.2 9a2.8 2.8 0 1 1 4.2 2.5c-.9.6-1.4 1.1-1.4 2.2M12 17h.01" />,
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  trash: <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />,
  phone: (
    <path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2Z" />
  ),
  hospital: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M4 13h16M12 9v11M12 9c-1-3-5-3-5-1s4 1 5 1Zm0 0c1-3 5-3 5-1s-4 1-5 1Z" />
    </>
  ),
  sparkles: (
    <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3ZM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
    </>
  ),
  link: (
    <path d="M10 13.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1M14 10.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
  ),
  box: (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" />
      <path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  edit: <path d="M4 20h4l10-10-4-4L4 16v4ZM13.5 6.5l4 4" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
};

export default function Icon({
  name,
  size = 24,
  className,
  strokeWidth = 1.9,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
