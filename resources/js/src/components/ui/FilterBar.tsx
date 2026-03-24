import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconSearch, IconX, IconPlus, IconFilter, IconFilterOff, IconRefresh, IconAdjustmentsHorizontal } from '@tabler/icons-react';

interface FilterBarProps {
    // Title & Icon
    title?: string;
    description?: string;
    icon?: React.ReactNode; 

    // Search
    search: string;
    setSearch: (val: string) => void;
    placeholder?: string;

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

    // Extra Header Actions
    extraActions?: React.ReactNode;
}

const FilterBar: React.FC<FilterBarProps> = ({
    title,
    description,
    icon,
    search,
    setSearch,
    placeholder = 'Search records...',
    itemsPerPage,
    setItemsPerPage,
    onAdd,
    addLabel = 'Add New',
    onRefresh,
    hasActiveFilters = false,
    onClearFilters,
    children,
    extraActions
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (!onRefresh || isRefreshing) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setTimeout(() => setIsRefreshing(false), 300);
        }
    };

    return (
        <div className="flex flex-col gap-4 mb-4">
            {/* Header Row: Title & Primary Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left: Branding & Info */}
                <div className="flex items-center gap-3 min-w-0">
                    {icon && (
                        <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl shrink-0 border border-primary/20 shadow-sm">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                {icon}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col truncate">
                        {title && (
                            <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 truncate">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="text-xs sm:text-sm text-slate-500 truncate">{description}</p>
                        )}
                    </div>
                </div>

                {/* Right: Action Buttons Group */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-start md:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200 border-slate-200 dark:border-slate-800 shadow-sm 
                            ${showFilters ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
                    >
                        {showFilters ? <IconFilterOff size={18} className="mr-2" /> : <IconFilter size={18} className="mr-2" />}
                        <span className="hidden xs:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                        <span className="xs:hidden">Filters</span>
                    </Button>

                    {onRefresh && (
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="h-9 sm:h-10 w-9 sm:w-10 p-0 sm:px-3 sm:w-auto bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-primary border-slate-200 dark:border-slate-800 shadow-sm"
                            title="Refresh Data"
                        >
                            <IconRefresh size={18} className={isRefreshing ? 'animate-spin' : ''} />
                            <span className="hidden lg:inline ml-2">Refresh</span>
                        </Button>
                    )}

                    {extraActions}

                    {onAdd && (
                        <Button 
                            onClick={onAdd} 
                            className="bg-primary hover:bg-primary/90 text-white h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            <IconPlus size={18} className="mr-0 sm:mr-2 shrink-0" />
                            <span className="hidden sm:inline">{addLabel}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Drawer Section */}
            {showFilters && (
                <div className="p-4 sm:p-5 bg-white dark:bg-black border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-5 animate-in slide-in-from-top-3 fade-in duration-300">
                    
                    {/* Filter Grid: Use grid for children and components */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
                        
                        {/* 1. Global Search */}
                        <div className="space-y-1.5 flex flex-col w-full">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search Keywords</span>
                            <div className="relative group transition-all">
                                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder={placeholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 pr-9 h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30 focus-visible:border-primary shadow-sm"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-danger transition-colors"
                                    >
                                        <IconX size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. Custom Filters (Children) */}
                        {children && React.Children.map(children, child => (
                            <div className="space-y-1.5 flex flex-col w-full">
                                {child}
                            </div>
                        ))}

                        {/* 3. Items Per Page Selection */}
                        <div className="space-y-1.5 flex flex-col w-full sm:w-[150px]">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Limit</span>
                            <Select
                                value={String(itemsPerPage)}
                                onValueChange={(val) => setItemsPerPage(Number(val))}
                            >
                                <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                                    <SelectValue placeholder="15" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 15, 25, 50, 100].map(opt => (
                                        <SelectItem key={opt} value={String(opt)} className="font-medium">
                                            {opt} Records
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {/* 4. Reset Button - Only appears when needed, but placed in the grid on desktop */}
                        {(hasActiveFilters || search) && onClearFilters && (
                            <div className="flex items-end">
                                <Button
                                    variant="soft-destructive"
                                    onClick={() => {
                                        setSearch('');
                                        onClearFilters();
                                    }}
                                    className="h-10 w-full font-bold group"
                                >
                                    <IconAdjustmentsHorizontal size={18} className="mr-2 transition-transform" />
                                    Reset Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterBar;