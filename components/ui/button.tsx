import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-none border-3 border-[#BEBEBE] items-center hover:border-white/50 cursor-pointer py-6",
        form: "bg-fm-green font-md text-white hover:bg-fm-blue-3",
        form2: "bg-fm-red font-md text-white hover:bg-fm-blue-3",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        outline2:
          "border border-fm-green/80 border-2 border-b-4 bg-fm-blue-1 text-white hover:border-fm-blue-3 hover:text-white/50",
        outline3:
          "border border-fm-red/80 border-2 border-b-4 bg-fm-blue-1 text-white hover:border-fm-blue-3 hover:text-white/50",
        outline4:
          "border border-fm-green-2 border-2 border-b-4 bg-fm-green hover:border-fm-blue-3 hover:bg-fm-blue-2 hover:text-white/50",
        outline5:
          "border border-fm-red-3 border-2 border-b-4 bg-fm-red hover:border-fm-blue-3 hover:bg-fm-blue-2 hover:text-white/50",
        secondary:
          "bg-none border-3 border-[#40C9A9] hover:border-[#40C9A9]/50 text-[#40C9A9] cursor-pointer py-6",
        secondary2:
          "text-secondary-foreground hover:bg-fm-blue-1 hover:text-accent-foreground",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link:
          "bg-none cursor-pointer text-white/50",
        extragrande:
          "bg-fm-green rounded-full text-2xl text-white",
        locked:
          "border border-black/30 border-2 border-b-4 bg-white/50 hover:border-fm-blue-3 hover:bg-fm-blue-2 hover:text-accent-foreground",
        locked2:
          "border border-fm-blue-3/30 border-2 border-b-4 bg-fm-green/50 hover:border-fm-blue-3 hover:bg-fm-blue-2 hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        default2: "h-12 w-20 lg:w-16 px-2 py-2 rounded-xl",
        sm: "h-[63px] w-[284px] text-lg rounded-2xl gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-[63px] sm:w-[369px] w-[700px] rounded-2xl sm:py-2 py-9 px-6 has-[>svg]:px-4 sm:text-base text-3xl",
        xl: "h-14 rounded-xl px-10 has-[>svg]:px-6 text-lg",
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
