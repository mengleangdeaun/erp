import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    [
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
        "select-none cursor-default",
    ].join(" "),
    {
        variants: {
            variant: {
                default: [
                    // Light: dark pill on white
                    "bg-zinc-900 text-zinc-50 border-zinc-800",
                    "hover:bg-zinc-700 hover:border-zinc-600",
                    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
                    "focus:ring-zinc-500",
                    // Dark: inverted — light pill on dark bg
                    "dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-200",
                    "dark:hover:bg-zinc-200 dark:hover:border-zinc-300",
                    "dark:shadow-[inset_0_1px_0_0_rgba(0,0,0,0.06)]",
                    "dark:focus:ring-zinc-400",
                ].join(" "),

                secondary: [
                    "bg-zinc-100 text-zinc-700 border-zinc-200",
                    "hover:bg-zinc-200 hover:border-zinc-300 hover:text-zinc-900",
                    "focus:ring-zinc-300",
                    "dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                    "dark:hover:bg-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-100",
                    "dark:focus:ring-zinc-600",
                ].join(" "),

                destructive: [
                    "bg-red-50 text-red-700 border-red-200",
                    "hover:bg-red-100 hover:border-red-300",
                    "focus:ring-red-400",
                    "dark:bg-red-950 dark:text-red-300 dark:border-red-800",
                    "dark:hover:bg-red-900 dark:hover:border-red-700",
                    "dark:focus:ring-red-700",
                ].join(" "),

                success: [
                    "bg-emerald-50 text-emerald-700 border-emerald-200",
                    "hover:bg-emerald-100 hover:border-emerald-300",
                    "focus:ring-emerald-400",
                    "dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
                    "dark:hover:bg-emerald-900 dark:hover:border-emerald-700",
                    "dark:focus:ring-emerald-700",
                ].join(" "),

                warning: [
                    "bg-amber-50 text-amber-700 border-amber-200",
                    "hover:bg-amber-100 hover:border-amber-300",
                    "focus:ring-amber-400",
                    "dark:bg-amber-950 dark:text-amber-300 dark:border-amber-600",
                    "dark:hover:bg-amber-900 dark:hover:border-amber-700",
                    "dark:focus:ring-amber-700",
                ].join(" "),

                outline: [
                    "bg-transparent text-foreground border-border",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:ring-ring",
                    "dark:text-zinc-200 dark:border-zinc-600",
                    "dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                ].join(" "),

                ghost: [
                    "bg-transparent text-muted-foreground border-transparent",
                    "hover:bg-accent hover:text-foreground",
                    "focus:ring-ring",
                    "dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
                ].join(" "),

                accent: [
                    "bg-violet-600 text-white border-violet-700",
                    "hover:bg-violet-500 hover:border-violet-600",
                    "shadow-[0_0_0_1px_rgba(139,92,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
                    "focus:ring-violet-400",
                    "dark:bg-violet-500 dark:border-violet-600",
                    "dark:hover:bg-violet-400 dark:hover:border-violet-500",
                    "dark:shadow-[0_0_0_1px_rgba(167,139,250,0.4),inset_0_1px_0_0_rgba(255,255,255,0.12)]",
                ].join(" "),
            },

            size: {
                sm: "px-2 py-0.5 text-[10px] rounded",
                md: "px-2.5 py-1 text-[11px] rounded-md",
                lg: "px-3 py-1.5 text-xs rounded-md",
            },

            dot: {
                true: "",
                false: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
            dot: false,
        },
    }
)

// Light + dark dot colors per variant
const dotColorMap: Record<string, string> = {
    default:     "bg-zinc-400 dark:bg-zinc-500",
    secondary:   "bg-zinc-400 dark:bg-zinc-500",
    destructive: "bg-red-500 dark:bg-red-400",
    success:     "bg-emerald-500 dark:bg-emerald-400",
    warning:     "bg-amber-500 dark:bg-amber-400",
    outline:     "bg-zinc-400 dark:bg-zinc-500",
    ghost:       "bg-zinc-400 dark:bg-zinc-600",
    accent:      "bg-violet-300 dark:bg-violet-200",
}

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
    /** Show a status dot on the left */
    dot?: boolean
    /** Optional icon rendered before the label */
    icon?: React.ReactNode
}

function Badge({
    className,
    variant = "default",
    size,
    dot = false,
    icon,
    children,
    ...props
}: BadgeProps) {
    const dotColor = dotColorMap[variant ?? "default"] ?? "bg-current"

    return (
        <span
            className={cn(badgeVariants({ variant, size, dot }), className)}
            {...props}
        >
            {dot && (
                <span
                    aria-hidden="true"
                    className={cn(
                        "inline-block size-1.5 rounded-full shrink-0",
                        dotColor
                    )}
                />
            )}
            {icon && (
                <span aria-hidden="true" className="shrink-0 [&>svg]:size-3">
                    {icon}
                </span>
            )}
            {children}
        </span>
    )
}

export { Badge, badgeVariants }