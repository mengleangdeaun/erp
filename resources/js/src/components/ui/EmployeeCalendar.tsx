import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";

interface EmployeeCalendarProps {
    className?: string;
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    onMonthChange?: (date: Date) => void;
    month?: Date;
    attendance?: any[];
    holidays?: any[];
    leaves?: any[];
    workingDays?: any[];
}

function EmployeeCalendar({
    className,
    selected,
    onSelect,
    onMonthChange,
    month,
    attendance = [],
    holidays = [],
    leaves = [],
    workingDays = [],
    ...props
}: EmployeeCalendarProps) {
    const defaultClassNames = getDefaultClassNames();

    const modifiers = React.useMemo(() => {
        const attendanceDays = (attendance || []).map((a: any) =>
            startOfDay(parseISO(a.date))
        );

        // Multi-day logic for holidays and leaves
        const holidayDays: Date[] = [];
        (holidays || []).forEach((h: any) => {
            const start = startOfDay(parseISO(h.start_date));
            const end = startOfDay(parseISO(h.end_date));
            let curr = new Date(start);
            while (curr <= end) {
                holidayDays.push(new Date(curr));
                curr.setDate(curr.getDate() + 1);
            }
        });

        const leaveDays: Date[] = [];
        (leaves || []).forEach((l: any) => {
            const start = startOfDay(parseISO(l.start_date));
            const end = startOfDay(parseISO(l.end_date));
            let curr = new Date(start);
            while (curr <= end) {
                leaveDays.push(new Date(curr));
                curr.setDate(curr.getDate() + 1);
            }
        });

        const getDayConfig = (date: Date) => {
            if (!workingDays) return null;
            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const dayName = days[date.getDay()];
            return Array.isArray(workingDays) ? workingDays[date.getDay()] : workingDays[dayName];
        };

        const isScheduled = (date: Date) => {
            const config = getDayConfig(date);
            return config?.is_working === true || config?.is_working === 1 || config?.is_working === "1";
        };

        const isHalfDay = (date: Date) => {
            const config = getDayConfig(date);
            if (!config || !config.is_working || !config.start_time || !config.end_time) return false;

            try {
                const [startH, startM] = config.start_time.split(':').map(Number);
                const [endH, endM] = config.end_time.split(':').map(Number);
                const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                // Threshold: 5 hours = 300 minutes
                return durationMinutes > 0 && durationMinutes <= 300;
            } catch (e) {
                return false;
            }
        };

        const isDayOff = (date: Date) => {
            const config = getDayConfig(date);
            // It's a day off only if it's explicitly marked as not working in the shift
            return config && (config.is_working === false || config.is_working === 0 || config.is_working === "0");
        };

        return {
            attended: attendanceDays,
            holiday: holidayDays,
            leave: leaveDays,
            scheduled: (date: Date) => isScheduled(date),
            halfDay: (date: Date) => isHalfDay(date),
            dayOff: (date: Date) => isDayOff(date),
        };
    }, [attendance, holidays, leaves, workingDays]);

    return (
        <DayPicker
            mode="single"
            selected={selected}
            onSelect={onSelect}
            onMonthChange={onMonthChange}
            month={month}
            weekStartsOn={1}
            className={cn("p-3 w-full", className)}
            modifiers={modifiers}
            classNames={{
                ...defaultClassNames,
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full relative",
                month: "space-y-4 w-full",
                month_caption: "flex justify-center pt-2 relative items-center mb-4 px-10 min-h-[40px]",
                caption_label: "text-base font-semibold text-gray-800 dark:text-gray-200 tracking-tight",
                nav: "flex items-center absolute inset-x-0 top-0 justify-between z-40 pointer-events-none px-2",
                button_previous: cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-10 w-10 p-0 text-gray-400 hover:text-primary hover:bg-primary/10 transition-all rounded-full pointer-events-auto"
                ),
                button_next: cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-10 w-10 p-0 text-gray-400 hover:text-primary hover:bg-primary/10 transition-all rounded-full pointer-events-auto"
                ),
                table: "w-full border-collapse",
                weekdays: "flex w-full mb-2",
                weekday: "text-gray-400 rounded-md w-full font-medium text-[11px] uppercase text-center tracking-wider",
                week: "flex w-full mt-1",
                // Make sure these are the ones you're using:

                day: "flex items-center justify-center w-full text-sm p-0 relative focus-within:z-20",

                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "!h-11 !w-11 p-0 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-full relative mx-auto flex items-center justify-center"
                ),

                selected:
                    "bg-primary !bg-primary !w-11 !h-11 text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md shadow-primary/30 ring-2 ring-primary ring-inset z-10 !rounded-full",

            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === "left" ? (
                        <ChevronLeftIcon className="h-5 w-5" />
                    ) : (
                        <ChevronRightIcon className="h-5 w-5" />
                    ),
                DayButton: ({ day, modifiers, ...props }: any) => {
                    const isAttended = modifiers.attended;
                    const isHoliday = modifiers.holiday;
                    const isLeave = modifiers.leave;
                    const isScheduled = modifiers.scheduled;
                    const isHalfDay = modifiers.halfDay;
                    const isDayOff = modifiers.dayOff;
                    const isSelected = modifiers.selected;
                    const isToday = modifiers.today;

                    return (
                        <button
                            {...props}
                            className={cn(
                                props.className,
                                // Half Days: Highlight half with soft red
                                isHalfDay &&
                                !isSelected &&
                                "bg-[linear-gradient(135deg,theme(colors.red.50)_50%,transparent_50%)] dark:bg-[linear-gradient(135deg,rgba(153,27,27,0.2)_50%,transparent_50%)] text-red-600 dark:text-red-400 border border-red-100/50 dark:border-red-900/20",
                                // Day Off: Full background highlight
                                isDayOff &&
                                !isSelected &&
                                "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40",
                                // Holidays: soft amber background + dot
                                isHoliday &&
                                !isSelected &&
                                "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
                                // Leaves: soft pink background + dot
                                isLeave &&
                                !isSelected &&
                                "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300",
                                // Today: ring (unless selected, where ring is already applied)
                                isToday && !isSelected && "ring-2 ring-primary/30",
                                // Subtle scale on hover for non-selected days
                                !isSelected && "hover:scale-105 active:scale-95",
                                "rounded-full"
                            )}
                        >
                            <span className="relative z-10 text-base font-medium">
                                {day.date.getDate()}
                            </span>

                            {/* Attendance dot (green) */}
                            {isAttended && (
                                <span
                                    className={cn(
                                        "absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-sm",
                                        isSelected ? "bg-white" : "bg-green-500"
                                    )}
                                />
                            )}

                            {/* Small corner dot for holiday/leave (only if not selected) */}
                            {(isHoliday || isLeave) && !isSelected && (
                                <span
                                    className={cn(
                                        "absolute top-1.5 right-1.5 w-1 h-1 rounded-full",
                                        isHoliday ? "bg-amber-400" : "bg-pink-400"
                                    )}
                                />
                            )}
                        </button>
                    );
                },
            }}
            {...props}
        />
    );
}

export { EmployeeCalendar };