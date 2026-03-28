import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusConfig } from '@/constants/statusConfig';

interface StatusBadgeProps {
    status: string;
    variant?: 'solid' | 'light';
    className?: string;
}

export const StatusBadge = ({ status, variant = 'solid', className }: StatusBadgeProps) => {
    const config = getStatusConfig(status);
    
    return (
        <Badge 
            className={cn(
                "text-[9px] font-black uppercase tracking-widest px-3 h-5 rounded-lg border shadow-sm transition-all flex items-center gap-1.5",
                variant === 'solid' 
                    ? `${config.solidBg} ${config.solidText} border-transparent` 
                    : `${config.bg} ${config.text} ${config.border}`,
                className
            )}
        >
            {variant !== 'solid' && <div className={cn("w-1 h-1 rounded-full shrink-0", config.dot)} />}
            {config.label}
        </Badge>
    );
};
