import type { HTMLAttributes } from 'react'
import { cn } from '../lib'

export function Separator({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('my-4 border-0 border-t border-slate-200', className)} {...props} />
}
