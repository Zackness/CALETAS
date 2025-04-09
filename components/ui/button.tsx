import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 font-bold text-white hover:bg-fm-blue-3",
        form: "bg-blue-600 hover:bg-blue-700 text-white transition-colors ml-auto",
        form2: "bg-fm-red font-md text-white hover:bg-fm-blue-3",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-fm-blue-2 border-2 bg-fm-blue-1 text-white hover:bg-fm-blue-2 hover:text-white/50",
        outline2:
          "border border-fm-green/80 border-2 border-b-4 bg-fm-blue-1 text-white hover:border-fm-blue-3 hover:text-white/50",
        outline3:
          "border border-fm-red/80 border-2 border-b-4 bg-fm-blue-1 text-white hover:border-fm-blue-3 hover:text-white/50",
        outline4:
          "border border-fm-green-2 border-2 border-b-4 bg-fm-green hover:border-fm-blue-3 hover:bg-fm-blue-2 hover:text-white/50",
        outline5:
          "border border-fm-red-3 border-2 border-b-4 bg-fm-red hover:border-fm-blue-3 hover:bg-fm-blue-2 hover:text-white/50",
        secondary:
          "text-secondary-foreground hover:bg-fm-blue-2 hover:text-accent-foreground",
        secondary2:
          "text-secondary-foreground hover:bg-fm-blue-1 hover:text-accent-foreground",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
        extragrande:
          "bg-fm-green rounded-full text-2xl text-white",
        locked:
          "border border-black/30 border-2 border-b-4 bg-white/50 hover:border-fm-blue-3 hover:bg-fm-blue-2 hover:text-accent-foreground",
        locked2:
          "border border-fm-blue-3/30 border-2 border-b-4 bg-fm-green/50 hover:border-fm-blue-3 hover:bg-fm-blue-2 hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-xl",
        default2: "h-12 w-20 lg:w-16 px-2 py-2 rounded-xl",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-xl px-8",
        lgfull: "h-11 rounded-full px-8",
        icon: "h-10 w-10",
        extragrande: "my-10 px-10 py-4",
        rounded: "rounded-full",
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
