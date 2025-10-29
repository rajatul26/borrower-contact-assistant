import * as React from 'react'
export function ScrollArea({ className='', children }: { className?: string, children: React.ReactNode }) {
  return <div className={className + ' overflow-auto'}>{children}</div>
}
export default ScrollArea
