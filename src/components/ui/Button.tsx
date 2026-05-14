import type { ButtonHTMLAttributes } from 'react'

import { cn } from './cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-[#006fb3] bg-[#006fb3] text-white hover:border-[#00578d] hover:bg-[#00578d] focus-visible:outline-[#006fb3]/30',
  secondary: 'border-[#d7e1ea] bg-white text-[#006fb3] hover:bg-[#f4f9fc] focus-visible:outline-[#006fb3]/25',
  ghost: 'border-transparent bg-transparent text-[#006fb3] hover:bg-[#f4f9fc] focus-visible:outline-[#006fb3]/25',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
}

export function Button({ className, variant = 'primary', size = 'md', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border font-semibold leading-none transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}