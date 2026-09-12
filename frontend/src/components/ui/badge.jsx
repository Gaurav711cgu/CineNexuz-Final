import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] hover:bg-transparent hover:text-[hsl(var(--primary))]",
        secondary:
          "border-white/30 bg-transparent text-white hover:bg-white hover:text-black",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] hover:bg-transparent hover:text-destructive",
        outline: "text-foreground bg-transparent border-white/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
