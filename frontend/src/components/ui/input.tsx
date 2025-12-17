import * as React from 'react'

import { cn } from '@/lib/utils'

type InputVariant = 'default' | 'underlined' | 'ghost'

interface InputProps extends React.ComponentProps<'input'> {
    variant?: InputVariant
}

/**
 * Input component with a `variant` prop.
 *
 * Variants:
 * - "default": the original rounded, bordered style
 * - "underlined": no surrounding border, only a bottom border (underline)
 * - "ghost": minimal/transparent, no visible border
 */
function Input({ className, type, variant = 'default', ...props }: InputProps) {
    const base =
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 h-9 text-base w-full min-w-0 bg-transparent shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

    const variantClasses: Record<InputVariant, string> = {
        default:
            'rounded-md border bg-transparent border-input px-3 py-1 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        underlined:
            // make it look like an underlined input: only bottom border, no rounding
            'rounded-none border-0 border-b border-b-input px-0 py-2 focus-visible:border-b-ring focus-visible:ring-0 aria-invalid:border-b-destructive dark:aria-invalid:border-b-destructive',
        ghost:
            // ghost removes obvious borders/background and softens focus styles
            'rounded-md border-0 bg-transparent px-3 py-1 focus-visible:ring-0 focus-visible:border-0 aria-invalid:ring-destructive/10'
    }

    return (
        <input
            type={type}
            data-slot="input"
            className={cn(base, variantClasses[variant], className)}
            {...props}
        />
    )
}

export { Input }
