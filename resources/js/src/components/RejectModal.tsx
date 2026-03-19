import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface RejectModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: (reason: string) => void;
    loading?: boolean;
    placeholder?: string;
    label?: string;
}

const RejectModal: React.FC<RejectModalProps> = ({
    isOpen,
    setIsOpen,
    title,
    description,
    onConfirm,
    loading = false,
    placeholder = 'Please provide a reason...',
    label = 'Rejection Reason'
}) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setReason('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim()) {
            onConfirm(reason);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="pt-2 italic">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {label} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-lg resize-none h-32 focus:ring-primary/20"
                            placeholder={placeholder}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            variant="outline"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !reason.trim()}
                            variant="destructive"
                            className="shadow-sm"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Processing...</span>
                                </div>
                            ) : 'Confirm Rejection'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RejectModal;
