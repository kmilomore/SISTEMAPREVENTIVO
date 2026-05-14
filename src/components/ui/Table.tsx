import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

import { cn } from './cn'

type ResponsiveMode = false | 'always' | 'ss' | 'sm' | 'md' | 'lg' | 'xl'

function responsiveClass(mode: ResponsiveMode) {
  if (mode === false) {
    return ''
  }

  if (mode === 'always') {
    return 'table-responsive'
  }

  return `table-responsive-${mode}`
}

type DataTableProps = TableHTMLAttributes<HTMLTableElement> & {
  containerClassName?: string
  responsive?: ResponsiveMode
}

export function DataTable({ className, containerClassName, responsive = 'md', ...props }: DataTableProps) {
  return (
    <div className={cn(responsiveClass(responsive), containerClassName)}>
      <table className={cn('mb-0 min-w-full text-left text-sm', className)} {...props} />
    </div>
  )
}

export function DataTableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-slate-50 text-xs text-slate-500', className)} {...props} />
}

export function DataTableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-slate-100 bg-white text-sm text-slate-700', className)} {...props} />
}

type DataTableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  interactive?: boolean
}

export function DataTableRow({ className, interactive = false, ...props }: DataTableRowProps) {
  return (
    <tr
      className={cn(interactive && 'cursor-pointer transition hover:bg-[#f8fbff]', className)}
      {...props}
    />
  )
}

export function DataTableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-2.5 font-semibold uppercase tracking-wide', className)} {...props} />
}

export function DataTableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-2', className)} {...props} />
}