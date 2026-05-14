import type { ComponentPropsWithoutRef, ElementType } from 'react'

import { cn } from './cn'

type CardTone = 'strong' | 'surface' | 'soft' | 'tint' | 'danger' | 'warning' | 'neutral'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

type CardProps<T extends ElementType> = {
  as?: T
  tone?: CardTone
  padding?: CardPadding
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

const toneClasses: Record<CardTone, string> = {
  strong: 'panel-card-strong',
  surface: 'panel-card',
  soft: 'rounded-3xl border border-slate-200 bg-slate-50',
  tint: 'rounded-3xl border border-[#c8dafd] bg-[#f4f8ff]',
  danger: 'rounded-3xl border border-red-200 bg-red-50',
  warning: 'rounded-3xl border border-amber-200 bg-amber-50',
  neutral: 'rounded-3xl border border-dashed border-slate-300 bg-white',
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6 sm:p-7',
}

export function Card<T extends ElementType = 'section'>({
  as,
  tone = 'surface',
  padding = 'md',
  className,
  ...props
}: CardProps<T>) {
  const Component = as ?? 'section'

  return <Component className={cn(toneClasses[tone], paddingClasses[padding], className)} {...props} />
}