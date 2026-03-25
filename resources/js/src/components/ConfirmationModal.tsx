import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface ConfirmationModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'success' | 'danger' | 'warning';
    loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    setIsOpen,
    title,
    description,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    loading = false
}) => {
    const getVariantClass = () => {
        switch (confirmVariant) {
            case 'success': return 'bg-success hover:bg-success/90 text-white';
            case 'danger': return 'bg-danger hover:bg-danger/90 text-white';
            case 'warning': return 'bg-warning hover:bg-warning/90 text-white';
            default: return 'bg-primary hover:bg-primary/90 text-white';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button 
                        onClick={onConfirm} 
                        disabled={loading}
                        className={getVariantClass()}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationModal;
