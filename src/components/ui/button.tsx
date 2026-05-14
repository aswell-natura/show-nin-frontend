import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding font-medium whitespace-nowrap shadow-sm transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-[linear-gradient(135deg,var(--muted)_0,var(--muted)_58%,var(--background)_58%,var(--background)_100%)] disabled:bg-[length:10px_10px] disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/85",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-primary/35 hover:bg-secondary/80 active:bg-secondary/70",
        ghost:
          "bg-transparent text-foreground shadow-none hover:bg-muted hover:text-foreground active:bg-muted/80",
      },
      size: {
        sm: "h-8 gap-1.5 px-3 text-xs",
        md: "h-10 gap-2 px-4 text-sm",
        lg: "h-12 gap-2.5 px-5 text-base",
        icon: "h-8 w-8 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Render the button styles onto a child component, such as a router link. */
  asChild?: boolean
}

/**
 * Design-system button built on shadcn/ui conventions.
 *
 * Variants and sizes resolve through CSS variables declared in `src/index.css`
 * and documented in `DESIGN.md`.
 */
function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
