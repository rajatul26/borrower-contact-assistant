import * as React from 'react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'

export const DropdownMenu = Dropdown.Root
export const DropdownMenuTrigger = Dropdown.Trigger
export function DropdownMenuContent(props: React.ComponentProps<typeof Dropdown.Content>) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content align={props.align as any} className="rounded-lg border bg-white shadow px-1 py-1 min-w-[160px]">
        {props.children}
      </Dropdown.Content>
    </Dropdown.Portal>
  )
}
export function DropdownMenuItem({ children, ...props }: React.ComponentProps<typeof Dropdown.Item>) {
  return (
    <Dropdown.Item
      className="px-2 py-1.5 rounded-md text-sm outline-none hover:bg-slate-100 cursor-pointer flex items-center gap-2"
      {...props}
    >
      {children}
    </Dropdown.Item>
  )
}
export function DropdownMenuLabel({ children }: { children: React.ReactNode }) { return <div className="px-2 py-1.5 text-xs text-slate-500">{children}</div> }
export function DropdownMenuSeparator() { return <div className="my-1 h-px bg-slate-200" /> }
