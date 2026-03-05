import * as React from "react"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "label",
    buttonVariant = "ghost",
    formatters,
    components,
    ...props
}: any) {
    const defaultClassNames = getDefaultClassNames()

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn(
                "p-3 w-fit",
                "[[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
                className
            )}
            captionLayout={captionLayout}
            formatters={{
                formatMonthDropdown: (date) =>
                    date.toLocaleString("default", { month: "long" }),
                ...formatters,
            }}
            classNames={{
                root: cn("w-fit", defaultClassNames.root),
                months: cn(
                    "relative flex flex-col gap-4 sm:flex-row",
                    defaultClassNames.months
                ),
                month: cn("flex flex-col gap-3 w-full", defaultClassNames.month),

                // ── Navigation ──────────────────────────────────────────
                nav: cn(
                    "absolute inset-x-0 top-0 flex items-center justify-between",
                    defaultClassNames.nav
                ),
                button_previous: cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "size-8 rounded-lg border-border/60 bg-transparent",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-accent hover:border-border",
                    "shadow-none transition-all duration-150",
                    "aria-disabled:opacity-30 aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none",
                    defaultClassNames.button_previous
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "size-8 rounded-lg border-border/60 bg-transparent",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-accent hover:border-border",
                    "shadow-none transition-all duration-150",
                    "aria-disabled:opacity-30 aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none",
                    defaultClassNames.button_next
                ),

                // ── Month caption ────────────────────────────────────────
                month_caption: cn(
                    "flex h-8 items-center justify-center px-8",
                    defaultClassNames.month_caption
                ),
                caption_label: cn(
                    "text-sm font-semibold tracking-tight text-foreground select-none",
                    captionLayout !== "label" &&
                    "flex items-center gap-1.5 [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
                    defaultClassNames.caption_label
                ),

                // ── Dropdowns ────────────────────────────────────────────
                dropdowns: cn(
                    "flex items-center gap-1.5 text-sm font-medium",
                    defaultClassNames.dropdowns
                ),
                dropdown_root: cn(
                    "relative rounded-md border border-input",
                    "has-focus:border-ring has-focus:ring-2 has-focus:ring-ring/20",
                    defaultClassNames.dropdown_root
                ),
                dropdown: cn(
                    "absolute inset-0 opacity-0 cursor-pointer",
                    defaultClassNames.dropdown
                ),

                // ── Grid ────────────────────────────────────────────────
                table: "w-full border-collapse",
                weekdays: cn("flex mb-1", defaultClassNames.weekdays),
                weekday: cn(
                    "flex-1 text-[0.7rem] font-medium text-muted-foreground/60",
                    "text-center select-none uppercase tracking-widest py-1",
                    defaultClassNames.weekday
                ),
                week: cn("flex mt-0.5", defaultClassNames.week),
                week_number_header: cn("w-8 select-none", defaultClassNames.week_number_header),
                week_number: cn(
                    "text-[0.7rem] text-muted-foreground/40 text-center",
                    defaultClassNames.week_number
                ),

                // ── Day cell wrapper ─────────────────────────────────────
                day: cn("relative flex-1 text-center p-0 select-none", defaultClassNames.day),
                range_start: cn("rounded-l-md", defaultClassNames.range_start),
                range_end: cn("rounded-r-md", defaultClassNames.range_end),
                range_middle: cn("bg-primary/10 rounded-none", defaultClassNames.range_middle),

                // State classes are handled in CalendarDayButton
                today: "",
                outside: "",
                disabled: "",
                hidden: cn("invisible", defaultClassNames.hidden),
                ...classNames,
            }}
            components={{
                Root: ({ className: cls, rootRef, ...p }) => (
                    <div data-slot="calendar" ref={rootRef} className={cn(cls)} {...p} />
                ),
                Chevron: ({ orientation, className: cls, ...p }) => {
                    if (orientation === "left")
                        return <ChevronLeftIcon className={cn("size-4", cls)} {...p} />
                    if (orientation === "right")
                        return <ChevronRightIcon className={cn("size-4", cls)} {...p} />
                    return <ChevronDownIcon className={cn("size-3.5", cls)} {...p} />
                },
                DayButton: CalendarDayButton,
                WeekNumber: ({ children, ...p }) => (
                    <td {...p}>
                        <div className="flex size-8 items-center justify-center text-[0.7rem] text-muted-foreground/40">
                            {children}
                        </div>
                    </td>
                ),
                ...components,
            }}
            {...props}
        />
    )
}

function CalendarDayButton({ className, day, modifiers, ...props }: any) {
    const ref = React.useRef<HTMLButtonElement>(null)
    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus()
    }, [modifiers.focused])

    const isSelectedSingle =
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle

    return (
        <button
            ref={ref}
            data-today={modifiers.today || undefined}
            data-selected={modifiers.selected || undefined}
            data-selected-single={isSelectedSingle || undefined}
            data-range-start={modifiers.range_start || undefined}
            data-range-end={modifiers.range_end || undefined}
            data-range-middle={modifiers.range_middle || undefined}
            data-outside={modifiers.outside || undefined}
            data-disabled={modifiers.disabled || undefined}
            disabled={modifiers.disabled}
            className={cn(
                // ── Base layout ──────────────────────────────────────────
                "relative inline-flex items-center justify-center",
                "w-full aspect-square min-w-8 max-w-9 rounded-md mx-auto",
                "text-sm font-normal text-foreground",
                "cursor-pointer select-none outline-none",
                "transition-colors duration-100",

                // ── Default hover ─────────────────────────────────────────
                "hover:bg-accent hover:text-accent-foreground",

                // ── Focus ring (keyboard nav) ─────────────────────────────
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",

                // ── Today: subtle ring ────────────────────────────────────
                "data-[today]:ring-1 data-[today]:ring-border",

                // ── Outside month: dimmed, no interaction ─────────────────
                "data-[outside]:text-muted-foreground/30",
                "data-[outside]:hover:bg-transparent data-[outside]:cursor-default",

                // ── Disabled ──────────────────────────────────────────────
                "data-[disabled]:text-muted-foreground/25 data-[disabled]:line-through",
                "data-[disabled]:cursor-not-allowed data-[disabled]:hover:bg-transparent",

                // ── Selected single ───────────────────────────────────────
                "data-[selected-single]:bg-primary data-[selected-single]:text-primary-foreground",
                "data-[selected-single]:hover:bg-primary/90",
                "data-[selected-single]:shadow-sm data-[selected-single]:ring-0",

                // ── Range endpoints ───────────────────────────────────────
                "data-[range-start]:bg-primary data-[range-start]:text-primary-foreground",
                "data-[range-start]:hover:bg-primary/90 data-[range-start]:rounded-r-none",
                "data-[range-end]:bg-primary data-[range-end]:text-primary-foreground",
                "data-[range-end]:hover:bg-primary/90 data-[range-end]:rounded-l-none",

                // ── Range middle ──────────────────────────────────────────
                "data-[range-middle]:bg-primary/10 data-[range-middle]:text-foreground",
                "data-[range-middle]:hover:bg-primary/15 data-[range-middle]:rounded-none",

                className
            )}
            {...props}
        >
            {props.children}

            {/* Today dot — only when not selected */}
            {modifiers.today && !modifiers.selected && (
                <span
                    aria-hidden
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary"
                />
            )}
        </button>
    )
}

export { Calendar, CalendarDayButton }