import React from 'react';

interface TableSkeletonProps {
    columns: number;
    rows?: number;
    rowsOnly?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5, rowsOnly = false }) => {
    const renderRows = () => (
        <>
            {Array.from({ length: rows }).map((_, rIndex) => (
                <tr key={rIndex} className="animate-pulse border-b border-gray-100 dark:border-gray-800 last:border-0">
                    {Array.from({ length: columns }).map((_, cIndex) => (
                        <td key={cIndex} className="py-4">
                            <div
                                className="h-3 bg-gray-200 dark:bg-gray-700/50 rounded-full"
                                style={{
                                    width: `${Math.floor(Math.random() * 40) + 40}%` // Random width between 40% and 80%
                                }}
                            ></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );

    if (rowsOnly) {
        return renderRows();
    }

    return (
        <div className="table-responsive w-full overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-800">
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="py-3 px-4">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700/50 rounded-full w-2/3"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {renderRows()}
                </tbody>
            </table>
        </div>
    );
};

export default TableSkeleton;
