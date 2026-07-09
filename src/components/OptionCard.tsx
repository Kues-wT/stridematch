import type { ReactNode } from 'react'

interface OptionCardProps {
  selected?: boolean
  onClick: () => void
  title: string
  description?: string
  icon?: ReactNode
}

export function OptionCard({ selected, onClick, title, description, icon }: OptionCardProps) {
  return (
    <button
      type="button"
      className={`option-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {icon && <span className="option-icon">{icon}</span>}
      <span className="option-title">{title}</span>
      {description && <span className="option-desc">{description}</span>}
    </button>
  )
}
