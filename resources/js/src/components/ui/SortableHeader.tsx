import React from 'react';
import {IconSelector, IconSortDescending, IconSortAscending } from '@tabler/icons-react';

interface SortableHeaderProps {
    label: string;
    value: string;
    currentSortBy: string;
    currentDirection: 'asc' | 'desc';
    onSort: (value: string) => void;
    className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
    label,
    value,
    currentSortBy,
    currentDirection,
    onSort,
    className = "",
}) => {
    const isActive = currentSortBy === value;

    return (
        <th
            className={`cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${className}`}
            onClick={() => onSort(value)}
        >
            <div className="flex items-center gap-1">
                <span>{label}</span>
                <span className="inline-flex flex-col items-center justify-center w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                    {isActive ? (
                        currentDirection === 'asc' ? (
                            <IconSortAscending size={14} className="text-primary dark:text-primary" />
                        ) : (
                            <IconSortDescending size={14} className="text-primary dark:text-primary" />
                        )
                    ) : (
                        <IconSelector size={14} className="opacity-50" />
                    )}
                </span>
            </div>
        </th>
    );
};

export default SortableHeader;
