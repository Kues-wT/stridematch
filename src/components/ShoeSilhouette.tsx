export function ShoeSilhouette({ accent, className }: { accent: string; className?: string }) {
  return (
    <svg className={className ?? 'shoe-svg'} viewBox="0 0 200 100" aria-hidden>
      <path
        d="M18 62c8-18 28-34 58-38 22-3 40 2 58 10 14 6 28 10 40 8 8-1 14 4 12 12-3 12-16 18-30 20H40c-14 0-26-4-22-12z"
        fill={accent}
        opacity="0.9"
      />
      <path
        d="M48 48c18-8 40-10 62-4 12 3 24 6 36 5"
        fill="none"
        stroke="rgba(15,23,42,0.35)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="42" cy="58" r="3" fill="rgba(15,23,42,0.35)" />
      <circle cx="56" cy="52" r="2.5" fill="rgba(15,23,42,0.35)" />
      <circle cx="70" cy="48" r="2.5" fill="rgba(15,23,42,0.35)" />
    </svg>
  )
}
