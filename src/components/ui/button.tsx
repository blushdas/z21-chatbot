
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-heading font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 active:bg-brand-yellow/80 shadow-sm",
        destructive:
          "bg-[color:var(--color-error-soft)] text-[color:var(--color-error)] border border-[color:var(--color-error-border)] hover:bg-[color:var(--color-error)] hover:text-[color:var(--color-text-inverse)]",
        outline:
          "border border-[var(--chat-border)] bg-transparent text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]",
        secondary:
          "bg-[var(--chat-card)] text-[var(--chat-text)] border border-[var(--chat-border)] hover:bg-[var(--ui-bg-hover)]",
        ghost:
          "bg-transparent text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]",
        link:
          "text-[var(--chat-text)] underline-offset-4 hover:underline hover:text-brand-yellow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
