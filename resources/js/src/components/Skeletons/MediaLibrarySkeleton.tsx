import React from 'react';
import { Card } from '../ui/card';

interface SkeletonProps {
    viewMode: 'grid' | 'list';
}

const MediaLibrarySkeleton: React.FC<SkeletonProps> = ({ viewMode }) => {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800/50"></div>
                        <div className="p-3 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="flex justify-between">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                            </div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Card className="overflow-hidden border-gray-100 dark:border-gray-800 animate-pulse">
            <div className="w-full text-sm">
                <div className="bg-gray-100/50 dark:bg-gray-800/30 h-10 w-full border-b border-gray-100 dark:border-gray-800"></div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center px-4 py-3 h-12">
                            <div className="flex items-center gap-3 w-1/3">
                                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                            <div className="w-1/6 px-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                            <div className="w-1/6 px-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                            <div className="w-1/6 px-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                            <div className="w-1/6 px-4 flex justify-end">
                                <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default MediaLibrarySkeleton;
