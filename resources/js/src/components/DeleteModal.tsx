import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { IconAlertTriangle } from '@tabler/icons-react';

interface DeleteModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
    title: string;
    message: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, setIsOpen, onConfirm, isLoading, title, message }) => {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <IconAlertTriangle size={20} />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteModal;
