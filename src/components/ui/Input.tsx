import type { InputHTMLAttributes, ReactNode } from 'react'

import { cn } from './cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode
  containerClassName?: string
}

export function Input({ className, containerClassName, icon, ...props }: InputProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      ) : null}
      <input
        className={cn(
          'h-10 w-full rounded-xl border border-[#d7e1ea] bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#006fb3] focus:outline-none focus:ring-4 focus:ring-[#006fb3]/10',
          Boolean(icon) && 'pl-9',
          className,
        )}
        {...props}
      />
    </div>
  )
}