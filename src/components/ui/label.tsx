import * as React from 'react'
export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={'text-sm text-slate-600 block mb-1 ' + (props.className||'')} />
}
export default Label
