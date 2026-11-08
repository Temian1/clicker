import type { ReactNode, SVGProps } from 'react'

const O = '#042016' // outline colour shared by all icons

const ICONS: Record<string, ReactNode> = {
  coin: (
    <>
      <circle cx="12" cy="12" r="10" fill="#ffc93c" stroke={O} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="7" fill="#ffdb6e" stroke="#c98a00" strokeWidth="1.2" />
      <path d="M9 8v8M15 8v8M8 10.5h8M8 13.5h8M9 8l6 8" stroke="#a36a00" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  ),
  bolt: <path d="M13.5 2 4.5 13.5h6L9.5 22l10-12.5h-6.5z" fill="#ffd93c" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />,
  tap: (
    <>
      <path d="M9 11V5a2 2 0 1 1 4 0v5l4.4.9a2.5 2.5 0 0 1 2 2.9l-.9 4.7A3 3 0 0 1 15.5 21h-4.2a3 3 0 0 1-2.4-1.2l-3.7-4.9a1.7 1.7 0 0 1 2.6-2.2z" fill="#fff7e6" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 4.5 3.5 3M17 4.5 18.5 3M11 1v-.5" stroke="#ffc93c" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  shop: (
    <>
      <path d="M3 9h18l-1.4 10.2A2 2 0 0 1 17.6 21H6.4a2 2 0 0 1-2-1.8z" fill="#3ec7ff" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 9V7a4 4 0 0 1 8 0v2" fill="none" stroke={O} strokeWidth="1.8" />
      <path d="M12 12.5v5M9.5 15 12 12.5l2.5 2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  people: (
    <>
      <circle cx="8" cy="8" r="3.5" fill="#ff9f1c" stroke={O} strokeWidth="1.6" />
      <path d="M1.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5z" fill="#ff9f1c" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="16.5" cy="7" r="3" fill="#00a859" stroke={O} strokeWidth="1.6" />
      <path d="M13 13.4c1-.6 2.2-.9 3.5-.9 3.2 0 6 2.3 6 6.5h-6.8" fill="#00a859" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
    </>
  ),
  battle: (
    <>
      <path d="m4 3 9 9-2 2-9-9V3z" fill="#e0e7ef" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m20 3-9 9 2 2 9-9V3z" fill="#e0e7ef" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m6 14 4 4-2 2-1-1-2.5 2.5-1.5-1.5L5.5 17.5l-1-1zM18 14l-4 4 2 2 1-1 2.5 2.5 1.5-1.5-2.5-2.5 1-1z" fill="#ff4d4d" stroke={O} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="#ffc93c" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 5H4a3 3 0 0 0 3 4.5M17 5h3a3 3 0 0 1-3 4.5" fill="none" stroke={O} strokeWidth="1.8" />
      <path d="M10 13h4v3h-4zM7.5 16h9v4.5h-9z" fill="#c98a00" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 5.5v2.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" stroke="#fff7e6" strokeWidth="2.6" strokeLinecap="round" />,
  close: <path d="M6 6l12 12M18 6 6 18" stroke="#fff7e6" strokeWidth="2.8" strokeLinecap="round" />,
  settings: (
    <>
      <path d="m12 2 2 2.6 3.2-.6.7 3.2L21 8.5l-1.2 3 1.2 3-3.1 1.3-.7 3.2-3.2-.6L12 22l-2-2.6-3.2.6-.7-3.2L3 15.5l1.2-3L3 9.5l3.1-1.3.7-3.2 3.2.6z" fill="#a7b7c4" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.3" fill="#04291b" stroke={O} strokeWidth="1.4" />
    </>
  ),
  support: (
    <>
      <circle cx="12" cy="12" r="9.5" fill="#ff4d4d" stroke={O} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.5" fill="#04291b" stroke={O} strokeWidth="1.4" />
      <path d="M5.5 5.5 9 9M18.5 5.5 15 9M5.5 18.5 9 15M18.5 18.5 15 15" stroke="#fff" strokeWidth="2.6" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" fill="#00a859" stroke={O} strokeWidth="1.6" />
      <circle cx="6" cy="12" r="3" fill="#00a859" stroke={O} strokeWidth="1.6" />
      <circle cx="18" cy="19" r="3" fill="#00a859" stroke={O} strokeWidth="1.6" />
      <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" stroke="#fff7e6" strokeWidth="1.8" />
    </>
  ),
  lock: (
    <>
      <path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke={O} strokeWidth="2.4" />
      <path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="#a7b7c4" strokeWidth="1.2" />
      <rect x="4" y="10" width="16" height="11" rx="2.5" fill="#ffc93c" stroke={O} strokeWidth="1.8" />
      <circle cx="12" cy="15" r="1.8" fill={O} />
    </>
  ),
  crown: (
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="#ffc93c" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" fill="#ffc93c" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 20.5a2 2 0 0 0 4 0" fill="none" stroke={O} strokeWidth="1.8" />
    </>
  ),
  star: <path d="m12 2 3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8z" fill="#ffc93c" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />,
  check: <path d="m4 12.5 5 5L20 6.5" stroke="#00a859" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  gift: (
    <>
      <rect x="3" y="9" width="18" height="5" rx="1" fill="#ff4d4d" stroke={O} strokeWidth="1.6" />
      <rect x="4.5" y="14" width="15" height="7" rx="1" fill="#ff4d4d" stroke={O} strokeWidth="1.6" />
      <path d="M12 9v12" stroke="#ffc93c" strokeWidth="3" />
      <path d="M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 .5 6-1.5S14 5 12 9z" fill="#ffc93c" stroke={O} strokeWidth="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" fill="#fff7e6" stroke={O} strokeWidth="1.8" />
      <path d="M3 10h18" stroke={O} strokeWidth="1.8" />
      <path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2H3z" fill="#ff4d4d" stroke={O} strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4" stroke={O} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="2.2" fill="#00a859" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9.5" fill="#fff7e6" stroke={O} strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke={O} strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  sound: (
    <>
      <path d="M3 9h4l5-4v14l-5-4H3z" fill="#3ec7ff" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke="#fff7e6" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" fill="none" stroke={O} strokeWidth="2.2" />
      <circle cx="6.5" cy="18" r="3" fill="#9b5cff" stroke={O} strokeWidth="1.6" />
      <circle cx="17.5" cy="16" r="3" fill="#9b5cff" stroke={O} strokeWidth="1.6" />
    </>
  ),
  vibrate: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.5" fill="#a7b7c4" stroke={O} strokeWidth="1.8" />
      <path d="M3 8v8M21 8v8" stroke="#ffc93c" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  voice: (
    <>
      <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" fill="#fff7e6" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 9h10M7 12.5h6" stroke={O} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4.5" fill="#ffc93c" stroke={O} strokeWidth="1.8" />
      <path d="M3.5 21c0-5 3.8-7.5 8.5-7.5s8.5 2.5 8.5 7.5z" fill="#00a859" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9.5" fill="#3ec7ff" stroke={O} strokeWidth="1.8" />
      <path d="M12 11v6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1.5" fill="#fff" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5z" fill="#25d366" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 7.5c-.6.6-.9 1.6-.4 2.9a9 9 0 0 0 5.3 5.3c1.3.5 2.3.2 2.9-.4l.4-1.2-2-1-1 .9a6 6 0 0 1-2.9-2.9l.9-1-1-2z" fill="#fff" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11M7.5 9.5 12 14l4.5-4.5" stroke="#fff7e6" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3" stroke="#fff7e6" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </>
  ),
  fuel: (
    <>
      <rect x="4" y="3" width="11" height="18" rx="2" fill="#00a859" stroke={O} strokeWidth="1.8" />
      <rect x="6.5" y="6" width="6" height="4.5" rx="1" fill="#fff7e6" stroke={O} strokeWidth="1.3" />
      <path d="M15 8h2.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0V8l-2.5-3" fill="none" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  rocket: (
    <>
      <path d="M12 2c4 2.5 5.5 7 4.5 12h-9C6.5 9 8 4.5 12 2z" fill="#fff7e6" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2" fill="#3ec7ff" stroke={O} strokeWidth="1.3" />
      <path d="M7.5 11 4 15l3.5.5M16.5 11l3.5 4-3.5.5" fill="#ff4d4d" stroke={O} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 15.5 12 22l2.5-6.5z" fill="#ff9f1c" stroke={O} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  mic: (
    <>
      <rect x="8" y="2" width="8" height="12" rx="4" fill="#a7b7c4" stroke={O} strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8.5 22h7" stroke={O} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M8 6h3M8 9h3" stroke={O} strokeWidth="1.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="5" fill="#ffc93c" stroke={O} strokeWidth="1.8" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2" stroke="#ff9f1c" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  robot: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="3" fill="#3ec7ff" stroke={O} strokeWidth="1.8" />
      <circle cx="9" cy="12.5" r="1.8" fill="#fff" stroke={O} strokeWidth="1.2" />
      <circle cx="15" cy="12.5" r="1.8" fill="#fff" stroke={O} strokeWidth="1.2" />
      <path d="M12 7V4M9.5 16.5h5" stroke={O} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="3" r="1.5" fill="#ff4d4d" stroke={O} strokeWidth="1.2" />
    </>
  ),
  fire: (
    <>
      <path d="M12 22c-4.5 0-7.5-3-7.5-7 0-4.5 4-6 4-10.5 3 1.5 5 4.5 5 7 1-1 1.5-2.5 1.5-3.5 2.5 2 3.5 4.5 3.5 7 0 4-2.5 7-6.5 7z" fill="#ff6b1c" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 21c-2 0-3.3-1.4-3.3-3.3 0-2 2-3 2.3-5 1.8 1 3.8 2.8 3.8 5.2 0 1.8-1 3.1-2.8 3.1z" fill="#ffd93c" />
    </>
  ),
  bag: (
    <>
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke={O} strokeWidth="2" />
      <rect x="2.5" y="7" width="19" height="14" rx="2" fill="#2f6fd6" stroke={O} strokeWidth="1.8" />
      <path d="M2.5 11.5h19M2.5 16h19M7 7v14M12 7v14M17 7v14" stroke="#e53935" strokeWidth="1.4" />
    </>
  ),
  medal: (
    <>
      <path d="M7 2h4l2 6H9zM17 2h-4l-2 6h4z" fill="#ff4d4d" stroke={O} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="6.5" fill="#ffc93c" stroke={O} strokeWidth="1.8" />
      <path d="m12 11.5 1 2.2 2.3.2-1.7 1.6.5 2.3-2.1-1.2-2.1 1.2.5-2.3-1.7-1.6 2.3-.2z" fill="#c98a00" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" stroke="#fff7e6" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  back: <path d="m15 5-7 7 7 7" stroke="#fff7e6" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  podium: (
    <>
      <path d="M4 10h16l-1.5 11h-13z" fill="#00a859" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M2 7h20v3H2z" fill="#fff7e6" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 7V3M12 3l4 1.5L12 6" fill="#ff4d4d" stroke={O} strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="2.5" fill="#ffc93c" stroke={O} strokeWidth="1.3" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13 6 4h12l3 9v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#fff7e6" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 13h5l1.5 3h5L16 13h5" fill="#a7b7c4" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14l-1.2 13a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" fill="#ff4d4d" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 7h18M9 7V4h6v3" stroke={O} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
    </>
  ),
}

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 24, className, ...rest }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" {...rest}>
      {ICONS[name] ?? ICONS.star}
    </svg>
  )
}
