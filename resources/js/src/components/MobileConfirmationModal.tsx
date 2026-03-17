import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface MobileConfirmationModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    variant?: 'danger' | 'primary' | 'info';
    children?: React.ReactNode;
}

const MobileConfirmationModal: React.FC<MobileConfirmationModalProps> = ({
    isOpen,
    setIsOpen,
    title,
    message,
    onConfirm,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isLoading = false,
    variant = 'primary',
    children
}) => {
    const variantStyles = {
        danger: {
            bg: 'bg-red-50 dark:bg-red-950/30',
            text: 'text-red-600 dark:text-red-400',
            button: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 dark:shadow-none',
        },
        primary: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            text: 'text-primary dark:text-blue-400',
            button: 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 dark:shadow-none',
        },
        info: {
            bg: 'bg-gray-50 dark:bg-gray-900',
            text: 'text-gray-900 dark:text-white',
            button: 'bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200 dark:shadow-none',
        }
    };

    const currentVariant = variantStyles[variant];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent 
                className="max-w-[100%] sm:max-w-md w-full rounded-t-[2.5rem] rounded-b-none sm:rounded-b-[2.5rem] p-0 overflow-hidden border-none shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-500 bottom-0 top-auto sm:top-[50%] translate-y-0 sm:translate-y-[-50%] bg-white dark:bg-[#0e1726] sm:bg-white sm:dark:bg-[#0e1726]"
                hideClose
            >
                <div className="p-7 sm:p-8 pt-10 sm:pt-8 bg-white dark:bg-[#0e1726] relative">
                    {/* Visual Indicator */}
                    <div className={cn("w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6", currentVariant.bg)}>
                        <div className={cn("font-black text-xl sm:text-2xl", currentVariant.text)}>!</div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-3">
                        {title}
                    </h2>
                    
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                        {message}
                    </p>

                    {children}

                    <div className="mt-8 sm:mt-10 flex flex-col gap-3">
                        <Button 
                            disabled={isLoading}
                            onClick={onConfirm}
                            className={cn(
                                "h-14 rounded-2xl font-black text-base transition-all active:scale-95 shadow-none",
                                currentVariant.button
                            )}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </div>
                            ) : confirmLabel}
                        </Button>
                        
                        <Button
                            variant="ghost"
                            disabled={isLoading}
                            onClick={() => setIsOpen(false)}
                            className="h-14 rounded-2xl font-bold text-gray-400 dark:hover:bg-gray-800 transition-all active:scale-95"
                        >
                            {cancelLabel}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MobileConfirmationModal;
