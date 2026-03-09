import type { ImgHTMLAttributes } from 'react'
import { cn } from '../lib'

export function Avatar({ className, alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      alt={alt}
      className={cn('h-8 w-8 rounded-full border border-slate-200 object-cover', className)}
      {...props}
    />
  )
}
