import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { IconAlertTriangle, IconCheck, IconInfoCircle } from '@tabler/icons-react';

type ConfirmVariant = 'danger' | 'success' | 'warning' | 'default';

interface ConfirmationModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: ConfirmVariant;
    onConfirm: () => void;
    loading?: boolean;
}

const variantConfig: Record<ConfirmVariant, {
    icon: React.ReactNode;
    titleClass: string;
    buttonClass: string;
}> = {
    danger: {
        icon: <IconAlertTriangle size={20} />,
        titleClass: 'text-danger',
        buttonClass: 'bg-danger hover:bg-danger-focus border-none text-white shadow-[0px_10px_20px_-10px_rgba(231,81,90,0.5)]',
    },
    success: {
        icon: <IconCheck size={20} />,
        titleClass: 'text-success',
        buttonClass: 'bg-success hover:bg-success-focus border-none text-white shadow-[0px_10px_20px_-10px_rgba(29,201,183,0.5)]',
    },
    warning: {
        icon: <IconAlertTriangle size={20} />,
        titleClass: 'text-warning',
        buttonClass: 'bg-warning hover:bg-warning-focus border-none text-white shadow-[0px_10px_20px_-10px_rgba(226,160,63,0.5)]',
    },
    default: {
        icon: <IconInfoCircle size={20} />,
        titleClass: 'text-primary',
        buttonClass: 'bg-primary hover:bg-primary-focus border-none text-white shadow-[0px_10px_20px_-10px_rgba(67,97,238,0.5)]',
    },
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    setIsOpen,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'default',
    onConfirm,
    loading = false,
}) => {
    const variant = variantConfig[confirmVariant];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${variant.titleClass}`}>
                        {variant.icon}
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="pt-2 text-gray-600 dark:text-gray-400">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter className="mt-4 flex sm:justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={loading}
            
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className={variant.buttonClass}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationModal;
