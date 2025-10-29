import * as React from 'react'
import cls from 'classnames'
export function Badge({ variant='default', className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default'|'secondary'}) {
  const v = variant==='default' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
  return <span {...props} className={cls('inline-flex items-center px-2 h-6 text-xs rounded-md', v, className)} />
}
export default Badge
