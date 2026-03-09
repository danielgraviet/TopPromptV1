import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-offset-white focus:ring-2 focus:ring-slate-400',
        className
      )}
      {...props}
    />
  )
}
