import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'success' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-pressed disabled:bg-hairline disabled:text-stone',
  secondary: 'bg-canvas text-ink border border-hairline-strong hover:bg-surface-soft',
  ghost: 'bg-transparent text-ink hover:bg-sunken',
  dark: 'bg-ink text-page hover:opacity-90',
  success: 'bg-success-soft text-success-ink border border-success/30',
  danger: 'bg-canvas text-error-ink border border-error/40 hover:bg-error-soft',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-[18px] text-sm',
    lg: 'h-13 px-6 text-[15px]',
  }
  return (
    <button
      {...props}
      className={`press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn font-medium disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-card border border-hairline bg-canvas ${className}`}>{children}</div>
}

const tintClass = {
  peach: 'bg-tint-peach text-tint-ink-peach',
  rose: 'bg-tint-rose text-tint-ink-rose',
  mint: 'bg-tint-mint text-tint-ink-mint',
  lavender: 'bg-tint-lavender text-tint-ink-lavender',
  sky: 'bg-tint-sky text-tint-ink-sky',
  yellow: 'bg-tint-yellow text-gold-ink',
} as const
export type Tint = keyof typeof tintClass

export function Tag({ tint = 'lavender', children }: { tint?: Tint; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[13px] font-semibold ${tintClass[tint]}`}>
      {children}
    </span>
  )
}

export function tint(t: Tint) {
  return tintClass[t]
}

/** Fortschrittsring (SVG-Kreis, kein Icon). */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  color = 'var(--primary)',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hairline)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/** Schmaler Fortschrittsbalken. */
export function Bar({ value, color = 'bg-primary', className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-hairline-soft ${className}`}>
      <div
        className={`h-full rounded-full ${color}`}
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  )
}
