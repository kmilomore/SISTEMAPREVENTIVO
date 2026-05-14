import type { ReactNode, SelectHTMLAttributes } from 'react'

import { cn } from './cn'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: ReactNode
  containerClassName?: string
}

export function Select({ className, containerClassName, icon, children, ...props }: SelectProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      ) : null}
      <select
        className={cn(
          'h-10 w-full appearance-none rounded-xl border border-[#d7e1ea] bg-white px-3 pr-10 text-sm text-slate-700 focus:border-[#006fb3] focus:outline-none focus:ring-4 focus:ring-[#006fb3]/10',
          Boolean(icon) && 'pl-9',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  )
}