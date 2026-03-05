import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type CheckboxSize = "sm" | "md" | "lg"

const sizeConfig: Record<CheckboxSize, {
    root: string
    icon: string
}> = {
    sm: {
        root: "h-3.5 w-3.5 rounded-[3px]",
        icon: "h-2.5 w-2.5",
    },
    md: {
        root: "h-4 w-4 rounded-sm",
        icon: "h-3 w-3",
    },
    lg: {
        root: "h-5 w-5 rounded",
        icon: "h-3.5 w-3.5",
    },
}

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
    size?: CheckboxSize
}

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    CheckboxProps
>(({ className, size = "md", ...props }, ref) => {
    const { root, icon } = sizeConfig[size as CheckboxSize]

    return (
        <CheckboxPrimitive.Root
            ref={ref}
            className={cn(
                // Base layout
                "peer relative shrink-0 overflow-hidden",
                // Border & background
                "border border-primary bg-background",
                // Transitions & animations
                "transition-all duration-150 ease-out",
                // Hover state — subtle lift
                "hover:border-primary/80 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]",
                // Focus ring
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                // Checked state
                "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
                // Click press feel
                "active:scale-90",
                // Disabled
                "disabled:cursor-not-allowed disabled:opacity-50",
                root,
                className
            )}
            {...props}
        >
            {/* Ripple layer */}
            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute inset-0 rounded-[inherit]",
                    "bg-primary/20 opacity-0 scale-0",
                    "peer-active:opacity-100 peer-active:scale-150",
                    "transition-all duration-300"
                )}
            />

            <CheckboxPrimitive.Indicator
                className="flex items-center justify-center text-current"
                // Animate the check icon in
                style={{ animation: "checkIn 150ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
                <Check className={cn("stroke-[3]", icon)} />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    )
})

Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
export type { CheckboxSize }