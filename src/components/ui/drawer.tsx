import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'

export const Drawer = Dialog.Root
export function DrawerContent({ children, className='' }: { children: React.ReactNode, className?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/40" />
      <Dialog.Content className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-auto ${className}`}>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}
export function DrawerHeader({ children }: { children: React.ReactNode }) { return <div className="px-4 pb-2">{children}</div> }
export function DrawerTitle({ children }: { children: React.ReactNode }) { return <h3 className="font-semibold text-lg">{children}</h3> }
export function DrawerDescription({ children }: { children: React.ReactNode }) { return <p className="text-sm text-slate-600">{children}</p> }
