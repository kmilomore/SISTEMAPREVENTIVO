import type { HTMLAttributes } from 'react'

import { cn } from './cn'

type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone
}

const toneClasses: Record<StatusTone, string> = {
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
  neutral: 'bg-slate-100 text-slate-600',
}

export function StatusBadge({ className, tone = 'info', ...props }: StatusBadgeProps) {
  return <span className={cn('status-chip', toneClasses[tone], className)} {...props} />
}