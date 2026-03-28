import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';
import { Button } from './button';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { Check, ChevronsUpDown, Search, Inbox, Loader2 } from 'lucide-react';
import { EmptyDataIllustration,EmptyDataSmallIllustration } from '@/components/illustrations/EmptyData';

interface Option {
    value: string | number;
    label: string;
    description?: string;
    color?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | null;
    onChange: (value: string | number) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
    footer?: React.ReactNode;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No options found.',
    className = '',
    disabled = false,
    loading = false,
    footer,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options;
        const lowerQuery = searchQuery.toLowerCase();
        return options.filter((opt) => opt.label.toLowerCase().includes(lowerQuery));
    }, [options, searchQuery]);

    const selectedOption = options.find((opt) => opt.value === value);

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
                        h-10
                        px-3
                        font-normal
                        border
                        transition-all
                        duration-200
                        bg-white
                        dark:bg-slate-900
                        hover:bg-slate-50
                        dark:hover:bg-slate-800
                        focus:outline-none
                        focus:ring-2
                        focus:ring-primary/20
                        ${!selectedOption ? 'text-slate-400' : ''}
                        ${open ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-800'}
                        ${className}
                    `}
                >
<div className="flex items-center gap-2">
    {selectedOption?.color && (
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedOption.color }}></div>
    )}
    <span className="">
        {loading ? (
            <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">Loading...</span>
            </div>
        ) : selectedOption ? (
            selectedOption.label
        ) : (
            placeholder
        )}
    </span>
</div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-full min-w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border-gray-200 dark:border-gray-700 overflow-hidden"
                align="start"
            >
                <div className="flex flex-col">
                    {/* Search Header */}
                    <div className="border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 pl-9 pr-3 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <PerfectScrollbar className="max-h-[240px] w-full relative" options={{ wheelPropagation: false }}>
                        <div className="m-2">
                            {loading ? (
                                <div className="p-10 flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full border-2 border-primary/10 border-t-primary animate-spin"></div>
                                        <Loader2 className="absolute inset-0 m-auto h-4 w-4 text-primary border-b-primary animate-spin" />
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Fetching Data</p>
                                        <p className="text-[9px] text-gray-400 font-medium">Please wait a moment...</p>
                                    </div>
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="p-4 text-center flex flex-col items-center justify-center">
                                    <div className="w-20">
                                        <EmptyDataSmallIllustration />
                                    </div>
                                    <p className="text-xs text-gray-400">{emptyMessage}</p>
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={`
                                            relative
                                            flex
                                            items-center
                                            justify-between
                                            px-2
                                            py-2
                                            text-sm
                                            cursor-pointer
                                            rounded-sm
                                            transition-colors
                                            hover:bg-gray-100
                                            dark:hover:bg-gray-700
                                            ${value === option.value
                                                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                                : 'text-gray-700 dark:text-gray-300'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2 pr-6">
                                            {option.color && (
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: option.color }}></div>
                                            )}
                                            <span>{option.label}</span>
                                        </div>
                                        {value === option.value && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <Check className="h-4 w-4 text-primary" />
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </PerfectScrollbar>

                    {/* Results Count */}
                    {filteredOptions.length > 0 && !footer && (
                        <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">
                            {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''}
                        </div>
                    )}

                    {/* Footer / Create New Action */}
                    {footer && (
                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                            {footer}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}