import React from 'react';

interface HighlightTextProps {
    text: string | null | undefined;
    highlight: string | null | undefined;
    className?: string;
    activeClassName?: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({ 
    text, 
    highlight, 
    className = "", 
    activeClassName = "bg-yellow-200 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-100 rounded-px px-0.5 font-bold"
}) => {
    if (!text) return null;
    if (!highlight || !highlight.trim()) return <span className={className}>{text}</span>;

    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

    return (
        <span className={className}>
            {parts.map((part, i) => (
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className={activeClassName}>
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            ))}
        </span>
    );
};

export default HighlightText;
