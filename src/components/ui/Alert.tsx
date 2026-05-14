import type { HTMLAttributes } from 'react'

import { cn } from './cn'

type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone
}

const toneClasses: Record<AlertTone, string> = {
  info: 'border-[#c8dafd] bg-[#f4f8ff] text-[#0057B8]',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600',
}

export function Alert({ className, tone = 'info', ...props }: AlertProps) {
  return (
    <div
      className={cn('rounded-2xl border px-5 py-4 text-sm', toneClasses[tone], className)}
      {...props}
    />
  )
}