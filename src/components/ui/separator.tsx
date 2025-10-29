import * as React from 'react'
export function Separator({ className='' }: { className?: string }) {
  return <div className={className + ' w-full h-px bg-slate-200'} />
}
export default Separator
