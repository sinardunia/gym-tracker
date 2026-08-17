type IconName =
  | 'trash'
  | 'pencil'
  | 'note'
  | 'repeat'
  | 'chevron-down'
  | 'chevron-up'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'plus'
  | 'clock'
  | 'calculator'
  | 'x'
  | 'check'
  | 'more'
  | 'home'
  | 'calendar'
  | 'chart'
  | 'settings'
  | 'sun'
  | 'moon'
  | 'monitor'

const ICON_PATHS: Record<IconName, string[]> = {
  trash: [
    'M3 6h18',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M10 11v6',
    'M14 11v6',
  ],
  pencil: ['M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'],
  note: [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M16 13H8',
    'M16 17H8',
    'M10 9H8',
  ],
  repeat: [
    'm17 1 4 4-4 4',
    'M3 11V9a4 4 0 0 1 4-4h14',
    'm7 23-4-4 4-4',
    'M21 13v2a4 4 0 0 1-4 4H3',
  ],
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-up': ['m18 15-6-6-6 6'],
  'arrow-up': ['M12 19V5', 'm5 12 7-7 7 7'],
  'arrow-down': ['M12 5v14', 'm19 12-7 7-7-7'],
  'arrow-left': ['M19 12H5', 'm12 19-7-7 7-7'],
  plus: ['M5 12h14', 'M12 5v14'],
  clock: [
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
    'M12 6v6l4 2',
  ],
  calculator: [
    'M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
    'M8 6h8v4H8z',
    'M8 14h.01',
    'M12 14h.01',
    'M16 14h.01',
    'M8 18h.01',
    'M12 18h.01',
    'M16 18h.01',
  ],
  x: ['M18 6L6 18', 'M6 6l12 12'],
  check: ['M20 6L9 17l-5-5'],
  more: [
    'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
    'M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
    'M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  ],
  home: [
    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    'M9 22V12h6v10',
  ],
  calendar: [
    'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
    'M16 2v4',
    'M8 2v4',
    'M3 10h18',
  ],
  chart: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  settings: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  ],
  sun: [
    'M12 2v2',
    'M12 20v2',
    'm4.93 4.93 1.41 1.41',
    'm17.66 17.66 1.41 1.41',
    'M2 12h2',
    'M20 12h2',
    'm6.34 17.66-1.41 1.41',
    'm19.07 4.93-1.41 1.41',
    'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
  ],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z'],
  monitor: [
    'M2 3h20v14H2z',
    'M8 21h8',
    'M12 17v4',
  ],
}

export function Icon({
  name,
  size = 18,
}: {
  name: IconName
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
