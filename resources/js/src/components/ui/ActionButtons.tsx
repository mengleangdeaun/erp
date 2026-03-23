import React, { useState } from 'react';
import { Button } from './button';
import {
    IconEdit,
    IconTrash,
    IconInfoCircle,
    IconQrcode,
    IconDotsVertical,
    IconX,
    IconCheck,
    IconXboxA,
    IconEye,
    IconEyeOff,
    IconArchive,
    IconArchiveOff,
    IconMail,
    IconMailOpened,
    IconClock,
    IconClockCheck,
    IconLock,
    IconLockOpen,
    IconUser,
    IconBrandTelegram,
    IconChartBar,
    IconBox
} from '@tabler/icons-react';
import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';

export type ActionType = 'edit' | 'delete' | 'view' | 'qr' | 'approve' | 'reject' | 'status' | 'telegram' | 'stats' | 'receive';

interface ActionConfig {
    icon: React.ElementType;
    label: string;
    style: string;
    confirmMessage?: string;
}

interface ActionButtonsProps {
    // Core actions
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
    onQr?: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    onStatus?: () => void;
    onTelegram?: () => void;
    onStats?: () => void;
    onReceive?: () => void;

    // Custom labels
    editLabel?: string;
    deleteLabel?: string;
    viewLabel?: string;
    qrLabel?: string;
    approveLabel?: string;
    rejectLabel?: string;
    statusLabel?: string;
    telegramLabel?: string;
    statsLabel?: string;
    receiveLabel?: string;

    // Confirmation messages
    deleteConfirmMessage?: string;
    rejectConfirmMessage?: string;

    // State
    disabled?: boolean;
    loading?: boolean;

    // Variants and styling
    variant?: 'inline' | 'popover' | 'rounded';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    buttonClassName?: string;
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';

    // Custom ordering
    actionOrder?: ActionType[];

    // Conditional rendering
    showApproveReject?: boolean;

    // Confirm Skips
    skipDeleteConfirm?: boolean;
    skipRejectConfirm?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    // Actions
    onEdit,
    onDelete,
    onView,
    onQr,
    onApprove,
    onReject,
    onStatus,
    onTelegram,
    onStats,
    onReceive,

    // Labels
    editLabel = "Edit",
    deleteLabel = "Delete",
    viewLabel = "View Details",
    qrLabel = "Generate Login QR",
    approveLabel = "Approve",
    rejectLabel = "Reject",
    statusLabel = "Edit Staff Status",
    telegramLabel = "Edit Telegram ID",
    statsLabel = "View Statistics",
    receiveLabel = "Receive Goods",

    // Confirm messages
    deleteConfirmMessage = "Are you sure you want to delete this item?",
    rejectConfirmMessage = "Are you sure you want to reject this item?",

    // State
    disabled = false,
    loading = false,

    // Variants
    variant = 'inline',
    size = 'md',
    className = '',
    buttonClassName = '',
    tooltipPlacement = 'top',

    // Customization
    actionOrder = ['approve', 'reject', 'receive', 'view', 'stats', 'qr', 'status', 'telegram', 'edit', 'delete'],
    showApproveReject = true,

    skipDeleteConfirm = false,
    skipRejectConfirm = false,
}) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'delete' | 'reject';
        callback: () => void;
    } | null>(null);

    // Size mappings
    const sizeConfig = {
        sm: { icon: 16, button: 'h-7 w-7', gap: 'gap-0.5', popoverItem: 'py-1.5' },
        md: { icon: 18, button: 'h-8 w-8', gap: 'gap-1', popoverItem: 'py-2' },
        lg: { icon: 20, button: 'h-9 w-9', gap: 'gap-1.5', popoverItem: 'py-2.5' }
    };

    // Action configurations
    const actionConfigs: Record<ActionType, ActionConfig> = {
        approve: {
            icon: IconCheck,
            label: approveLabel,
            style: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50'
        },
        reject: {
            icon: IconX,
            label: rejectLabel,
            style: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50'
        },
        view: {
            icon: IconInfoCircle,
            label: viewLabel,
            style: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50'
        },
        qr: {
            icon: IconQrcode,
            label: qrLabel,
            style: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50'
        },
        status: {
            icon: IconUser,
            label: statusLabel,
            style: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/50'
        },
        telegram: {
            icon: IconBrandTelegram,
            label: telegramLabel,
            style: 'text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/50'
        },
        edit: {
            icon: IconEdit,
            label: editLabel,
            style: 'text-primary hover:text-primary/80 hover:bg-primary/10 dark:text-primary-400'
        },
        delete: {
            icon: IconTrash,
            label: deleteLabel,
            style: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50'
        },
        stats: {
            icon: IconChartBar,
            label: statsLabel,
            style: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/50'
        },
        receive: {
            icon: IconBox,
            label: receiveLabel,
            style: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/50'
        }
    };

    // Rounded variant styles
    const roundedStyles = variant === 'rounded'
        ? 'rounded-full shadow-sm hover:shadow-md transition-shadow'
        : 'rounded-md';

    // Loading spinner component
    const LoadingSpinner = () => (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    const TooltipWrapper = ({ children, content }: { children: React.ReactNode; content: string }) => (
        <Tooltip.Provider delayDuration={300}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    {children}
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
                        side={tooltipPlacement}
                        sideOffset={5}
                    >
                        {content}
                        <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );

    const ActionButton = ({
        onClick,
        icon: Icon,
        label,
        style,
        isLoading = false,
        confirmType
    }: {
        onClick?: () => void;
        icon: React.ElementType;
        label: string;
        style: string;
        isLoading?: boolean;
        confirmType?: 'delete' | 'reject';
    }) => {
        const handleClick = () => {
            if (confirmType && onClick) {
                setConfirmAction({ type: confirmType, callback: onClick });
            } else if (onClick) {
                onClick();
            }
        };

        return (
            <TooltipWrapper content={label}>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`
                        ${sizeConfig[size].button} 
                        ${roundedStyles}
                        ${style}
                        transition-all duration-200 ease-in-out
                        hover:scale-110 active:scale-95
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        ${isLoading ? 'animate-pulse' : ''}
                        ${buttonClassName}
                    `}
                    style={{ animationDuration: isLoading ? '3s' : undefined }}
                    onClick={handleClick}
                    disabled={disabled || isLoading || !onClick}
                >
                    {isLoading ? <LoadingSpinner /> : <Icon size={sizeConfig[size].icon} />}
                </Button>
            </TooltipWrapper>
        );
    };

    // Confirmation Dialog
    const ConfirmationDialog = () => {
        if (!confirmAction) return null;

        const messages = {
            delete: deleteConfirmMessage,
            reject: rejectConfirmMessage
        };

        const icons = {
            delete: IconTrash,
            reject: IconXboxA
        };

        const styles = {
            delete: 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400',
            reject: 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400'
        };

        const ConfirmIcon = icons[confirmAction.type];

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-full ${styles[confirmAction.type]}`}>
                                <ConfirmIcon size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Confirm {confirmAction.type === 'delete' ? 'Deletion' : 'Rejection'}
                            </h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {messages[confirmAction.type]}
                        </p>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmAction(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant={confirmAction.type === 'delete' ? 'destructive' : 'default'}
                                className={confirmAction.type === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                                onClick={() => {
                                    confirmAction.callback();
                                    setConfirmAction(null);
                                }}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Filter and order actions
    const getAvailableActions = (): ActionType[] => {
        const actionsMap: Record<ActionType, (() => void) | undefined> = {
            approve: onApprove,
            reject: onReject,
            view: onView,
            qr: onQr,
            status: onStatus,
            telegram: onTelegram,
            stats: onStats,
            receive: onReceive,
            edit: onEdit,
            delete: onDelete
        };

        return actionOrder.filter(type => {
            if (type === 'approve' || type === 'reject') {
                return showApproveReject && actionsMap[type];
            }
            return actionsMap[type];
        });
    };

    const availableActions = getAvailableActions();

    if (availableActions.length === 0) return null;

    // Inline variant
    if (variant === 'inline') {
        return (
            <>
                <div className={`flex items-center ${sizeConfig[size].gap} justify-end ${className}`}>
                    {availableActions.map(type => (
                        <ActionButton
                            key={type}
                            onClick={{
                                approve: onApprove,
                                reject: onReject,
                                view: onView,
                                qr: onQr,
                                status: onStatus,
                                telegram: onTelegram,
                                stats: onStats,
                                receive: onReceive,
                                edit: onEdit,
                                delete: onDelete
                            }[type]}
                            icon={actionConfigs[type].icon}
                            label={actionConfigs[type].label}
                            style={actionConfigs[type].style}
                            isLoading={loading}
                            confirmType={type === 'delete' && !skipDeleteConfirm ? 'delete' : type === 'reject' && !skipRejectConfirm ? 'reject' : undefined}
                        />
                    ))}
                </div>
                <ConfirmationDialog />
            </>
        );
    }

    // Popover variant
    if (variant === 'popover') {
        return (
            <>
                <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <TooltipWrapper content="Actions">
                        <Popover.Trigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`
                                    ${sizeConfig[size].button}
                                    rounded-full
                                    bg-gray-100 hover:bg-gray-200
                                    dark:bg-gray-800 dark:hover:bg-gray-700
                                    transition-all duration-200
                                    hover:scale-110 active:scale-95
                                    ${buttonClassName}
                                `}
                                disabled={disabled || loading}
                            >
                                {loading ? <LoadingSpinner /> : <IconDotsVertical size={sizeConfig[size].icon} />}
                            </Button>
                        </Popover.Trigger>
                    </TooltipWrapper>

                    <Popover.Portal>
                        <Popover.Content
                            className="
                                bg-white dark:bg-gray-900
                                rounded-lg shadow-xl
                                border border-gray-200 dark:border-gray-800
                                p-1 min-w-[200px]
                                z-50
                                animate-in fade-in-0 zoom-in-95
                                data-[side=top]:slide-in-from-bottom-2
                                data-[side=bottom]:slide-in-from-top-2
                            "
                            side="bottom"
                            align="end"
                            sideOffset={5}
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Actions
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                        onClick={() => setPopoverOpen(false)}
                                    >
                                        <IconX size={12} />
                                    </Button>
                                </div>

                                {availableActions.map(type => {
                                    const config = actionConfigs[type];
                                    const onClick = {
                                        approve: onApprove,
                                        reject: onReject,
                                        view: onView,
                                        qr: onQr,
                                        status: onStatus,
                                        telegram: onTelegram,
                                        stats: onStats,
                                        receive: onReceive,
                                        edit: onEdit,
                                        delete: onDelete
                                    }[type];

                                    const handleClick = () => {
                                        if ((type === 'delete' && !skipDeleteConfirm) || (type === 'reject' && !skipRejectConfirm)) {
                                            setConfirmAction({
                                                type: type as 'delete' | 'reject',
                                                callback: () => {
                                                    onClick?.();
                                                    setPopoverOpen(false);
                                                }
                                            });
                                        } else {
                                            onClick?.();
                                            setPopoverOpen(false);
                                        }
                                    };

                                    return (
                                        <button
                                            key={type}
                                            onClick={handleClick}
                                            className={`
                                                flex items-center gap-2 px-3 ${sizeConfig[size].popoverItem}
                                                text-sm text-gray-700 dark:text-gray-300
                                                ${config.style.replace('hover:', 'hover:').split(' ')[0]}
                                                transition-colors rounded-md w-full
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                            `}
                                            disabled={disabled || loading || !onClick}
                                        >
                                            <config.icon size={16} />
                                            {config.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <Popover.Arrow className="fill-white dark:fill-gray-900" />
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
                <ConfirmationDialog />
            </>
        );
    }

    // Rounded variant
    return (
        <>
            <div className={`flex items-center ${sizeConfig[size].gap} justify-end ${className}`}>
                {availableActions.map(type => (
                    <ActionButton
                        key={type}
                        onClick={{
                            approve: onApprove,
                            reject: onReject,
                            view: onView,
                            qr: onQr,
                            status: onStatus,
                            telegram: onTelegram,
                            stats: onStats,
                            receive: onReceive,
                            edit: onEdit,
                            delete: onDelete
                        }[type]}
                        icon={actionConfigs[type].icon}
                        label={actionConfigs[type].label}
                        style={actionConfigs[type].style}
                        isLoading={loading}
                        confirmType={type === 'delete' && !skipDeleteConfirm ? 'delete' : type === 'reject' && !skipRejectConfirm ? 'reject' : undefined}
                    />
                ))}
            </div>
            <ConfirmationDialog />
        </>
    );
};

export default ActionButtons;