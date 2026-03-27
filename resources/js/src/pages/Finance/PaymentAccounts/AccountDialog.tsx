import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconWallet, IconBuilding } from '@tabler/icons-react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { toast } from 'sonner';

interface AccountDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    editingAccount: any;
    onSave: () => void;
}

const AccountDialog = ({ isOpen, setIsOpen, editingAccount, onSave }: AccountDialogProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        name: '',
        account_no: '',
        branch_id: '',
        balance: '0',
        is_active: true,
    });

    useEffect(() => {
        fetch('/api/hr/branches?all=true')
            .then(res => res.json())
            .then(data => setBranches(Array.isArray(data) ? data : (data.data || [])));
    }, []);

    useEffect(() => {
        if (editingAccount) {
            setFormData({
                name: editingAccount.name,
                account_no: editingAccount.account_no || '',
                branch_id: editingAccount.branch_id.toString(),
                balance: editingAccount.balance.toString(),
                is_active: editingAccount.is_active,
            });
        } else {
            setFormData({
                name: '',
                account_no: '',
                branch_id: '',
                balance: '0',
                is_active: true,
            });
        }
    }, [editingAccount, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingAccount ? `/api/finance/payment-accounts/${editingAccount.id}` : '/api/finance/payment-accounts';
        const method = editingAccount ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(`Account ${editingAccount ? 'updated' : 'created'} successfully`);
                setIsOpen(false);
                onSave();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to save account');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]  max-h-[90vh] h-auto flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-xl shadow-sm">
                        <IconWallet className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                            {editingAccount ? 'Edit Payment Account' : 'Add New Payment Account'}
                        </DialogTitle>
                        <p className="text-xs text-gray-500 mt-0.5">Define account details and branch link.</p>
                    </div>
                </div>

                <PerfectScrollbar className="flex-1 min-h-0">
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Account Name <span className="text-red-500">*</span></Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                placeholder="e.g. Main Cash Box, ABA Bank..."
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="account_no">Account / Card No.</Label>
                            <Input 
                                id="account_no" 
                                value={formData.account_no} 
                                onChange={e => setFormData({ ...formData, account_no: e.target.value })} 
                                placeholder="e.g. 000 123 456"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="branch">Linked Branch <span className="text-red-500">*</span></Label>
                            <Select 
                                value={formData.branch_id} 
                                onValueChange={val => setFormData({ ...formData, branch_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="balance">Initial Balance</Label>
                                <Input 
                                    id="balance" 
                                    type="number" 
                                    value={formData.balance} 
                                    onChange={e => setFormData({ ...formData, balance: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="status">Status</Label>
                                <Select 
                                    value={formData.is_active ? 'active' : 'inactive'} 
                                    onValueChange={val => setFormData({ ...formData, is_active: val === 'active' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="bg-primary text-white hover:bg-primary/90">
                            {isSaving ? 'Saving...' : (editingAccount ? 'Update Account' : 'Create Account')}
                        </Button>
                    </div>
                </form>
                </PerfectScrollbar>
            </DialogContent>
        </Dialog>
    );
};

export default AccountDialog;
