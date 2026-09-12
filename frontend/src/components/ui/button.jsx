import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:bg-transparent hover:text-primary border border-transparent hover:border-primary",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[4px_4px_0px_0px_rgba(255,0,0,0.2)] hover:bg-transparent hover:text-destructive border border-transparent hover:border-destructive",
        outline:
          "border border-white/20 shadow-none hover:bg-white hover:text-black",
        secondary:
          "bg-secondary text-secondary-foreground shadow-none hover:bg-transparent hover:text-secondary border border-transparent hover:border-secondary",
        ghost: "hover:bg-white/10 hover:text-accent-foreground border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-10 rounded-none px-4 text-[10px]",
        lg: "h-14 rounded-none px-10 text-sm",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
