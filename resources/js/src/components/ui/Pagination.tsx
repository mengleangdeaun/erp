import React from 'react';
import { Button } from '@/components/ui/button';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}) => {
    if (totalPages <= 1) return null;

    // Calculate item range being shown
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to show (simple logic: show current, +/- 2 pages, first, last)
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{startItem}</span> to <span className="font-semibold text-gray-700 dark:text-gray-300">{endItem}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{totalItems}</span> entries
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <IconChevronLeft size={16} />
                </Button>

                {getPageNumbers().map((p, i) => (
                    <React.Fragment key={i}>
                        {p === '...' ? (
                            <span className="px-2 text-gray-400">...</span>
                        ) : (
                            <Button
                                variant={currentPage === p ? 'default' : 'outline'}
                                size="sm"
                                className={`h-8 w-8 p-0 ${currentPage === p ? 'bg-primary hover:bg-primary text-white border-transparent' : ''}`}
                                onClick={() => typeof p === 'number' && onPageChange(p)}
                            >
                                {p}
                            </Button>
                        )}
                    </React.Fragment>
                ))}

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <IconChevronRight size={16} />
                </Button>
            </div>
        </div>
    );
};

export default Pagination;
