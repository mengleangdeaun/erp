import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent ",
        link:
          "text-primary underline-offset-4 hover:underline",
        // ✨ New soft variants
        "soft-default":
          "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
        "soft-destructive":
          "bg-destructive/10 text-destructive border text-red-500 border-red-500/20 hover:bg-destructive/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ── Ripple colour per variant ──────────────────────────────────────────────────
const rippleColorMap: Record<string, string> = {
  default: "rgba(255,255,255,0.30)",
  destructive: "rgba(255,255,255,0.30)",
  outline: "rgba(0,0,0,0.10)",
  secondary: "rgba(0,0,0,0.10)",
  ghost: "rgba(0,0,0,0.10)",
  link: "transparent",
  // ✨ New soft variants
  "soft-default": "rgba(0,0,0,0.10)",
  "soft-destructive": "rgba(0,0,0,0.10)",
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

// ── useRipple hook ─────────────────────────────────────────────────────────────
function useRipple(variant: string = "default") {
  const [ripples, setRipples] = React.useState<Ripple[]>([])

  const addRipple = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget
      const rect = el.getBoundingClientRect()
      const size = Math.hypot(rect.width, rect.height) * 2
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
      const id = Date.now()

      setRipples(prev => [...prev, { id, x, y, size }])

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, 600)
    },
    []
  )

  const rippleColor = rippleColorMap[variant] ?? "rgba(255,255,255,0.25)"

  const rippleElements = (
    <>
      {ripples.map(({ id, x, y, size }) => (
        <span
          key={id}
          aria-hidden
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: "50%",
            background: rippleColor,
            transform: "scale(0)",
            animation: "button-ripple 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
            pointerEvents: "none",
          }}
        />
      ))}
      <style>{`
        @keyframes button-ripple {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )

  return { addRipple, rippleElements }
}

// ── ButtonProps ────────────────────────────────────────────────────────────────
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

// ── Button ─────────────────────────────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, onClick, children, disabled, ...props }, ref) => {
    const { addRipple, rippleElements } = useRipple(variant ?? "default")

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isLoading) return
        addRipple(e)
        onClick?.(e)
      },
      [addRipple, onClick, isLoading]
    )

    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={handleClick as React.MouseEventHandler}
        disabled={isLoading || disabled}
        {...props}
      >
        <span className={cn("flex items-center justify-center gap-2", isLoading && "opacity-0")}>
          <Slottable>{children}</Slottable>
        </span>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
        {rippleElements}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }