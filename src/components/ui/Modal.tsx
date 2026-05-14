import type { HTMLAttributes, ReactNode } from 'react'

import { Button } from './Button'
import { Card } from './Card'
import { cn } from './cn'

type ModalProps = {
  open?: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  overlayClassName?: string
  panelClassName?: string
  contentClassName?: string
  closeButtonClassName?: string
  align?: 'center' | 'end'
}

export function Modal({
  open = true,
  onClose,
  children,
  className,
  overlayClassName,
  panelClassName,
  contentClassName,
  align = 'center',
}: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className={cn('fixed inset-0 z-50 flex justify-center px-4 py-6', align === 'center' ? 'items-center sm:p-4' : 'items-end sm:items-center sm:p-4', className)}>
      <div className={cn('fixed inset-0 bg-slate-900/40 backdrop-blur-sm', overlayClassName)} onClick={onClose} aria-hidden="true" />
      <Card as="div" tone="strong" padding="none" className={cn('relative z-10 flex w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl', panelClassName)}>
        <div className={cn('flex-1 overflow-y-auto', contentClassName)}>{children}</div>
      </Card>
    </div>
  )
}

export function ModalHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5', className)} {...props} />
}

export function ModalBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-6', className)} {...props} />
}

export function ModalFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4', className)} {...props} />
}

export function ModalCloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('h-8 w-8 rounded-xl p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700', className)}
      aria-label="Cerrar"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </Button>
  )
}