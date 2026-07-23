import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-sm font-medium outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-90 focus-visible:ring-destructive/25",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        brand: "bg-brand text-brand-foreground hover:bg-brand-hover",
      },
      size: {
        default: "h-(--control-height) px-3 has-[>svg]:px-2.5",
        compact: "h-(--control-height-compact) gap-1.5 px-2.5 has-[>svg]:px-2",
        sm: "h-(--control-height-compact) gap-1.5 px-2.5 has-[>svg]:px-2",
        lg: "h-(--control-height-large) px-4 has-[>svg]:px-3",
        icon: "size-(--control-height)",
        "icon-sm": "size-(--control-height-compact)",
        "icon-lg": "size-(--control-height-large)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
