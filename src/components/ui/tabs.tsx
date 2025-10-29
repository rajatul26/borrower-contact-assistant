import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import cls from 'classnames'

export const Tabs = TabsPrimitive.Root
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cls('bg-slate-100 rounded-lg p-1', className)} {...props} />
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger className={cls('px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow', className)} {...props} />
}
export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cls('mt-3', className)} {...props} />
}
export default Tabs
