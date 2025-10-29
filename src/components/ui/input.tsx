import * as React from 'react'
import cls from 'classnames'
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cls('h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 ring-brand w-full', props.className)} />
}
export default Input
