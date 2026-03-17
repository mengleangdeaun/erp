import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconSearch, IconX, IconPlus, IconFilter, IconFilterOff, IconRefresh, IconAdjustmentsHorizontal } from '@tabler/icons-react';

interface FilterBarProps {
    // Title & Icon
    title?: string;
    description?: string;
    icon?: React.ReactNode; // Optional icon with background (should include text-primary class)

    // Search
    search: string;
    setSearch: (val: string) => void;

    // Items Per Page
    itemsPerPage: number;
    setItemsPerPage: (val: number) => void;

    // Actions
    onAdd?: () => void;
    addLabel?: string;
    onRefresh?: () => void | Promise<void>;

    // State for Clearing
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;

    // Additional Custom Filters
    children?: React.ReactNode;
}

const FilterBar: React.FC<FilterBarProps> = ({
    title,
    description,
    icon,
    search,
    setSearch,
    itemsPerPage,
    setItemsPerPage,
    onAdd,
    addLabel = 'Add New',
    onRefresh,
    hasActiveFilters = false,
    onClearFilters,
    children
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (!onRefresh || isRefreshing) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            // Ensure spinner is visible for at least 300ms for UX
            setTimeout(() => setIsRefreshing(false), 300);
        }
    };

    return (
        <div className="flex flex-col gap-4 mb-4">
            {/* Top Row: Primary Search & Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between w-full">

                {/* Left Side: Icon with Background + Title + Description */}
                <div className="w-full sm:w-auto flex items-start gap-3">
                    {icon && (
                        <div className="bg-primary/20 p-3 rounded-xl shrink-0">
                            {icon}
                        </div>
                    )}
                    <div className="flex flex-col">
                        {title && <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">{title}</h1>}
                        {description && <p className="text-sm text-gray-500">{description}</p>}
                    </div>
                </div>

                {/* Right Side: Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`h-10 px-3 bg-white dark:bg-black transition-colors ${showFilters ? 'border-primary text-primary' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        {showFilters ? <IconFilterOff size={18} className="mr-2" /> : <IconFilter size={18} className="mr-2" />}
                        {showFilters ? 'Hide Filter' : 'Filter'}
                    </Button>

                    {onRefresh && (
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="h-10 px-3 bg-white dark:bg-black text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                            title="Refresh Data"
                        >
                            <IconRefresh size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        </Button>
                    )}

                    {onAdd && (
                        <Button onClick={onAdd} className="bg-primary hover:bg-primary-dark text-white h-10 shadow-sm transition-all hover:-translate-y-0.5">
                            <IconPlus size={18} className="mr-2 shrink-0" />
                            {addLabel}
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Panel (Expandable) */}
            {showFilters && (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-lg animate-in slide-in-from-top-2 fade-in duration-200">

                    {/* Search Input */}
                    <div className="relative w-full sm:max-w-xs transition-all">
                        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                            placeholder="Search records..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-9 h-10 w-full focus-visible:ring-primary shadow-sm"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <IconX size={14} />
                            </button>
                        )}
                    </div>

                    {/* Custom Filters (Children) */}
                    {children}

                    {/* Items Per Page */}
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Show:</span>
                        <Select
                            value={String(itemsPerPage)}
                            onValueChange={(val) => setItemsPerPage(Number(val))}
                        >
                            <SelectTrigger className="h-10 w-[90px] shadow-sm">
                                <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map(opt => (
                                    <SelectItem key={opt} value={String(opt)}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Clear Filters */}
                    {(hasActiveFilters || search) && onClearFilters && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSearch('');
                                onClearFilters();
                            }}
                            className="h-10 text-danger hover:bg-danger/10 hover:text-danger w-full sm:w-auto transition-colors"
                        >
                            <IconAdjustmentsHorizontal size={16} className="mr-2" />
                            Clear Filters
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilterBar;