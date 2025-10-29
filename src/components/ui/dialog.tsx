import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from './button'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />
      <DialogPrimitive.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-4 shadow-xl">
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
export function DialogHeader({ children }: { children: React.ReactNode }) { return <div className="mb-2">{children}</div> }
export function DialogFooter({ children }: { children: React.ReactNode }) { return <div className="mt-4 flex justify-end gap-2">{children}</div> }
export function DialogTitle({ children }: { children: React.ReactNode }) { return <h3 className="font-semibold text-lg">{children}</h3> }
export function DialogDescription({ children }: { children: React.ReactNode }) { return <p className="text-sm text-slate-600">{children}</p> }
