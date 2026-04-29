import { useRef, useEffect } from 'react'

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function AutoResizeTextarea({
  label,
  className = '',
  ...props
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function resize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => {
    resize()
  }, [props.value])

  const baseClass =
    'w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 shadow-sm transition focus:border-[#0057B8] focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 placeholder:text-slate-400'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={2}
        onInput={resize}
        className={`${baseClass} ${className}`}
        {...props}
      />
    </div>
  )
}
