import * as React from "react"
import { cn } from "../../lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Input } from "./input"
import PerfectScrollbar from "react-perfect-scrollbar"
import "react-perfect-scrollbar/dist/css/styles.css"
import { IconClock } from "@tabler/icons-react"

export interface TimePickerProps {
    value?: string;
    onChange?: (val: string) => void;
    className?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export function TimePicker({ value, onChange, className, disabled, icon }: TimePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value || "00:00");

    // Sync input value with prop
    React.useEffect(() => {
        setInputValue(value || "00:00");
    }, [value]);

    const [hour, min] = (inputValue || "00:00").split(":");

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const handleHour = (h: string) => {
        const newValue = `${h}:${min || '00'}`;
        setInputValue(newValue);
        if (onChange) onChange(newValue);
    }
    const handleMin = (m: string) => {
        const newValue = `${hour || '00'}:${m}`;
        setInputValue(newValue);
        if (onChange) onChange(newValue);
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    const handleInputBlur = () => {
        // Simple parser for HH:MM
        let val = inputValue.trim().replace(/[^0-9:]/g, '');

        // Handle HHMM format
        if (val.length === 4 && !val.includes(':')) {
            val = val.slice(0, 2) + ':' + val.slice(2);
        }

        const parts = val.split(':');
        let h = parseInt(parts[0]) || 0;
        let m = parseInt(parts[1]) || 0;

        if (h > 23) h = 23;
        if (h < 0) h = 0;
        if (m > 59) m = 59;
        if (m < 0) m = 0;

        const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        setInputValue(formatted);
        if (onChange && formatted !== value) onChange(formatted);
    }

    // Refs for scrolling
    const hourScrollRef = React.useRef<any>(null);
    const minScrollRef = React.useRef<any>(null);

    React.useEffect(() => {
        if (open) {
            // Give a tiny timeout for PS to initialize/render
            setTimeout(() => {
                if (hourScrollRef.current?._container) {
                    const hIdx = parseInt(hour);
                    hourScrollRef.current._container.scrollTop = hIdx * 28; // 28 is h-7
                }
                if (minScrollRef.current?._container) {
                    const mIdx = parseInt(min);
                    minScrollRef.current._container.scrollTop = mIdx * 28;
                }
            }, 50);
        }
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-full group">
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        disabled={disabled}
                        className={cn(
                            "pl-9 pr-3 h-10 w-full bg-white dark:bg-gray-900",
                            className
                        )}
                        placeholder="00:00"
                    />
                    <div
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() => !disabled && setOpen(!open)}
                    >
                        {icon || <IconClock size={16} stroke={1.5} />}
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden focus:outline-none" align="start">
                <div className="py-2 px-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 text-xs font-medium text-gray-500 flex justify-between">
                    <span className="w-12 text-center">Hour</span>
                    <span className="w-12 text-center">Minute</span>
                </div>
                <div className="flex h-52 divide-x divide-gray-100 dark:divide-gray-800">
                    <PerfectScrollbar
                        ref={hourScrollRef}
                        className="w-16 h-full relative"
                        options={{ wheelPropagation: false, suppressScrollX: true }}
                    >
                        <div className="flex flex-col p-1 gap-0.5">
                            {hours.map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    className={cn(
                                        "h-7 px-2 text-xs w-full rounded-sm flex items-center justify-center transition-colors cursor-pointer",
                                        hour === h ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    )}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleHour(h); }}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    </PerfectScrollbar>
                    <PerfectScrollbar
                        ref={minScrollRef}
                        className="w-16 h-full relative"
                        options={{ wheelPropagation: false, suppressScrollX: true }}
                    >
                        <div className="flex flex-col p-1 gap-0.5">
                            {minutes.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    className={cn(
                                        "h-7 px-2 text-xs w-full rounded-sm flex items-center justify-center transition-colors cursor-pointer",
                                        min === m ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    )}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMin(m); }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </PerfectScrollbar>
                </div>
                <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-center items-center gap-2">
                    <IconClock size={14} className="text-primary" />
                    <span className="text-sm font-bold tabular-nums text-primary tracking-wider">{hour || '00'}:{min || '00'}</span>
                </div>
            </PopoverContent>
        </Popover>
    )
}
