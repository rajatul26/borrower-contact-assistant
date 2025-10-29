import * as React from 'react'
import cls from 'classnames'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant='default', size, ...props }, ref
){
  const variantCls = {
    default: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }[variant]

  const sizeCls = size === 'sm'
    ? 'h-8 px-3 gap-2'
    : size === 'icon'
    ? 'h-9 w-9 p-0 gap-0'
    : 'h-9 px-4 gap-2'

  return <button
    ref={ref}
    className={cls(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50',
      variantCls,
      sizeCls,
      className
    )}
    {...props}
  />
})

export default Button
