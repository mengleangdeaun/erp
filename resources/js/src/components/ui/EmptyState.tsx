import React from 'react';
import { IconDatabaseLeak, IconSearch } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    isSearch?: boolean;
    searchTerm?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    onClearFilter?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    isSearch = false,
    searchTerm = '',
    title,
    description,
    actionLabel,
    onAction,
    onClearFilter,
}) => {
    return (
        <div className="group relative flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
            {/* Subtle decorative element */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-900/20 pointer-events-none" />
            
            {/* Icon container with animated floating effect */}
            <div className="relative w-20 h-20 mb-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 shadow-inner">
                {isSearch ? (
                    <IconSearch size={36} stroke={1.25} className="relative z-10" />
                ) : (
                    <IconDatabaseLeak size={36} stroke={1.25} className="relative z-10" />
                )}
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/5 to-transparent dark:from-primary/10" />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {title || (isSearch ? 'No results found' : 'No data available')}
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
                {description || (isSearch
                    ? (searchTerm ? `We couldn't find anything matching "${searchTerm}". Try adjusting your search or filters.` : 'No records match your current search.')
                    : 'Get started by creating your first record. Your data will appear here once added.'
                )}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                {actionLabel && onAction && !isSearch && (
                    <Button
                        onClick={onAction}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
                    >
                        {actionLabel}
                    </Button>
                )}

                {isSearch && onClearFilter && (
                    <Button
                        onClick={onClearFilter}
                        variant="outline"
                        className="border hover:border-primary/50 dark:hover:border-primary/50 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 px-6"
                    >
                        Clear filters
                    </Button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;