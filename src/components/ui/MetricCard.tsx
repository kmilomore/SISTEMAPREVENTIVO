import type { ReactNode } from 'react'

import { Card } from './Card'
import { cn } from './cn'

type MetricTone = 'primary' | 'success' | 'warning' | 'neutral' | 'violet'

const accentClasses: Record<MetricTone, string> = {
  primary: 'bg-[#eaf3f9] text-[#006fb3]',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  neutral: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-50 text-violet-700',
}

type MetricCardProps = {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  tone?: MetricTone
  className?: string
}

export function MetricCard({ label, value, sub, icon, tone = 'primary', className }: MetricCardProps) {
  return (
    <Card tone="strong" className={cn('flex flex-col gap-3 px-5 py-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        {icon ? (
          <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl', accentClasses[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
    </Card>
  )
}