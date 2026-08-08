type IconName =
  | 'trash'
  | 'pencil'
  | 'repeat'
  | 'chevron-down'
  | 'chevron-up'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'plus'
  | 'clock'

const ICON_PATHS: Record<IconName, string[]> = {
  trash: [
    'M3 6h18',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M10 11v6',
    'M14 11v6',
  ],
  pencil: ['M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'],
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
