import * as React from "react"
import { format, getYear, setMonth, setYear, startOfDay } from "date-fns"
import { IconCalendar } from "@tabler/icons-react"
import { cn } from "../utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select"

interface DatePickerProps {
    value?: Date | string | null;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    fromYear?: number;
    toYear?: number;
    disabled?: boolean;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    className,
    fromYear,
    toYear,
    disabled = false,
}: DatePickerProps) {
    const currentYear = getYear(new Date());
    const minYear = fromYear ?? currentYear - 80;
    const maxYear = toYear ?? currentYear + 20;

    const parseValue = (v: Date | string | null | undefined): Date | undefined => {
        if (!v) return undefined;
        if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v;
        // Parse YYYY-MM-DD safely without UTC timezone shift
        const parts = String(v).split("-");
        if (parts.length === 3) {
            const d = new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            );
            return isNaN(d.getTime()) ? undefined : d;
        }
        const parsed = new Date(v);
        return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(() => parseValue(value));
    const [viewDate, setViewDate] = React.useState<Date>(
        () => parseValue(value) ?? new Date()
    );

    React.useEffect(() => {
        const parsed = parseValue(value);
        setDate(parsed);
        if (parsed) setViewDate(parsed);
    }, [value]);

    const handleSelect = (selected: Date | undefined) => {
        setDate(selected);
        onChange?.(selected);
        if (selected) setOpen(false);
    };

    const years = Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => minYear + i
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full h-10 justify-start text-left font-normal",
                        "border-input hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <IconCalendar className="mr-2 h-4 w-4 shrink-0" />
                    {date ? format(date, "MMM d, yyyy") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-auto p-0 shadow-xl"
                align="start"
            >
                {/* Month + Year selectors */}
                <div className="flex items-center gap-2 p-3 border-b border-border">
                    <Select
                        value={String(viewDate.getMonth())}
                        onValueChange={(val) =>
                            setViewDate((prev) => setMonth(prev, Number(val)))
                        }
                    >
                        <SelectTrigger className="flex-1 h-9 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m, i) => (
                                <SelectItem key={m} value={String(i)}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={String(getYear(viewDate))}
                        onValueChange={(val) =>
                            setViewDate((prev) => setYear(prev, Number(val)))
                        }
                    >
                        <SelectTrigger className="w-[100px] h-9 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 overflow-y-auto w-[100px]">
                            {years.map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Calendar grid */}
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    month={viewDate}
                    onMonthChange={setViewDate}
                    initialFocus
                />

                {/* Footer: Today / Clear */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-border gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs font-medium"
                        onClick={() => {
                            const today = startOfDay(new Date());
                            setDate(today);
                            setViewDate(today);
                            onChange?.(today);
                            setOpen(false);
                        }}
                    >
                        Today
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs font-medium"
                        onClick={() => {
                            setDate(undefined);
                            onChange?.(undefined);
                        }}
                    >
                        Clear
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
