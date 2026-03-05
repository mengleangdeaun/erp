import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';
import { Button } from './button';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface SearchableMultiSelectProps {
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    loading?: boolean;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
    options,
    value = [],
    onChange,
    placeholder = "Select options...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    disabled = false,
    loading = false
}) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when popover opens
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        } else {
            setSearchQuery('');
        }
    }, [open]);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const handleRemove = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectedLabels = value.map(v => options.find(o => o.value === v)?.label).filter(Boolean);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={`
                        w-full 
                        justify-between 
                        font-normal
                        bg-white dark:bg-black
                        border-gray-200 dark:border-gray-800
                        hover:bg-gray-50 dark:hover:bg-gray-900
                        ${!value.length && "text-muted-foreground"}
                        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                        h-auto min-h-[2.5rem] py-1.5 px-3
                    `}
                >
                    <div className="flex flex-wrap gap-1 items-center pr-7 overflow-hidden">
                        {value.length === 0 ? (
                            <span className="truncate py-1">{placeholder}</span>
                        ) : (
                            selectedLabels.map((lbl, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded border border-primary/20"
                                >
                                    <span className="truncate max-w-[150px]">{lbl}</span>
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:bg-primary/20 rounded-full"
                                        onClick={(e) => handleRemove(e, value[idx])}
                                    />
                                </span>
                            ))
                        )}
                    </div>

                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {value.length > 0 && !disabled && (
                            <X
                                className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                                onClick={handleClearAll}
                            />
                        )}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-md"
                align="start"
            >
                <div className="flex flex-col">
                    <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-gray-500" />
                        <Input
                            ref={inputRef}
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={
                                "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            }
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    <PerfectScrollbar className="max-h-[240px] w-full relative" options={{ wheelPropagation: false }}>
                        <div className="m-2">
                            {loading ? (
                                <div className="p-8 flex flex-col items-center justify-center gap-2">
                                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                    <p className="text-sm text-gray-400 font-medium">Loading...</p>
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="p-4 text-center">
                                    <p className="text-sm text-gray-400">{emptyMessage}</p>
                                </div>
                            ) : (
                                filteredOptions.map((option) => {
                                    const isSelected = value.includes(option.value);
                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => handleSelect(option.value)}
                                            className={`
                                                relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors
                                                hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50
                                                ${isSelected ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700 dark:text-gray-300'}
                                            `}
                                        >
                                            <div className="flex flex-1 flex-col">
                                                <span>{option.label}</span>
                                            </div>
                                            <div className="flex items-center ml-2">
                                                <div className={`
                                                    w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                    ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300 dark:border-gray-600'}
                                                `}>
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </PerfectScrollbar>
                    {/* Footer */}
                    {filteredOptions.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900">
                            {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default SearchableMultiSelect;
