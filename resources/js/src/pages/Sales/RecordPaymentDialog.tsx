import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    IconCoins, 
    IconUpload, 
    IconPhoto, 
    IconLoader2, 
    IconAlertTriangle, 
    IconCalculator, 
    IconCircleCheck,
    IconClock,
    IconWallet
} from '@tabler/icons-react';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import { usePaymentAccounts, useAddSalesOrderDeposit } from '@/hooks/usePOSData';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

interface RecordPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: any;
}

const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({ open, onOpenChange, order }) => {
    const { data: accounts = [] } = usePaymentAccounts(order?.branch_id);
    const addDepositMutation = useAddSalesOrderDeposit();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        amount: Number(order?.balance_amount || 0),
        payment_account_id: '',
        deposit_date: new Date() as Date | undefined,
        deposit_time: format(new Date(), 'HH:mm'),
        notes: '',
        receipt: null as File | null
    });

    const balanceAmount = Number(order?.balance_amount || 0);
    const isOverpaid = form.amount > balanceAmount;

    // Reset form when order changes or dialog opens
    React.useEffect(() => {
        if (open && order) {
            setForm({
                amount: Number(order.balance_amount || 0),
                payment_account_id: '',
                deposit_date: new Date(),
                deposit_time: format(new Date(), 'HH:mm'),
                notes: '',
                receipt: null
            });
        }
    }, [open, order]);

    const handleSubmit = async () => {
        if (!form.amount || !form.payment_account_id || isOverpaid) return;

        const formData = new FormData();
        formData.append('amount', form.amount.toString());
        formData.append('payment_account_id', form.payment_account_id);
        
        const dDate = form.deposit_date || new Date();
        const [hours, mins] = form.deposit_time.split(':').map(Number);
        const finalDate = setMinutes(setHours(dDate, hours), mins);
        
        formData.append('deposit_date', format(finalDate, 'yyyy-MM-dd HH:mm:ss'));
        
        formData.append('notes', form.notes);
        if (form.receipt) {
            formData.append('receipt', form.receipt);
        }

        addDepositMutation.mutate({ id: order.id, formData }, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Column: Form Inputs */}
                    <div className="flex-1 p-8 bg-white dark:bg-zinc-950">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <IconCoins size={26} stroke={2.5} />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">Record Payment</DialogTitle>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-0.5">Order #{order?.order_no}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex justify-between">
                                        Amount to Pay
                                        {isOverpaid && <span className="text-rose-500 flex items-center gap-1"><IconAlertTriangle size={10} /> Overpaid</span>}
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                        <Input 
                                            type="number" 
                                            value={form.amount}
                                            onChange={e => setForm({ ...form, amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                                            className={`pl-8 pr-12 font-black text-xl h-14 border-2 transition-all ${isOverpaid ? 'border-rose-500/50 bg-rose-50/10 focus:border-rose-500' : 'focus:border-emerald-500/50'}`}
                                        />
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => setForm({ ...form, amount: balanceAmount })}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 text-[9px] font-black uppercase text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                        >
                                            MAX
                                        </Button>
                                    </div>
                                    <p className="text-[9px] text-zinc-400 font-bold px-1 italic">Current Balance: ${balanceAmount.toFixed(2)}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Payment Date</Label>
                                    <DatePicker 
                                        value={form.deposit_date}
                                        onChange={date => setForm({ ...form, deposit_date: date })}
                                        className="h-14 border-2"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Payment Time</Label>
                                    <TimePicker 
                                        value={form.deposit_time}
                                        onChange={val => setForm({ ...form, deposit_time: val })}
                                        className="h-14 border-2 font-bold pl-12"
                                        icon={<IconClock size={18} className="text-zinc-400" />}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Payment Account</Label>
                                    <Select value={form.payment_account_id} onValueChange={val => setForm({ ...form, payment_account_id: val })}>
                                        <SelectTrigger className="h-14 font-bold border-2">
                                            <div className="flex items-center gap-2">
                                                <IconWallet size={18} className="text-zinc-400" />
                                                <SelectValue placeholder="Select Account" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((acc: any) => (
                                                <SelectItem key={acc.id} value={acc.id.toString()} className="font-bold py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span>{acc.name} {acc.account_no}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Notes</Label>
                                <Textarea 
                                    placeholder="Optional payment notes..."
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    className="resize-none h-24 text-[12px] font-bold border-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary & Receipt */}
                    <div className="w-full md:w-[280px] bg-zinc-50 dark:bg-zinc-900/50 p-8 border-l dark:border-zinc-800 flex flex-col gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <IconCalculator size={18} className="text-zinc-400" />
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Financial Summary</span>
                            </div>
                            <div className="bg-white dark:bg-zinc-800/50 rounded-lg p-4 border dark:border-zinc-700 shadow-sm space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-zinc-400">Total Due</span>
                                    <span className="font-black">${parseFloat(order?.grand_total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-zinc-400">Paid Already</span>
                                    <span className="font-black text-emerald-600">${parseFloat(order?.paid_amount || 0).toFixed(2)}</span>
                                </div>
                                <div className="pt-3 border-t dark:border-zinc-700 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-rose-500">Remaining</span>
                                    <span className="text-lg font-black tabular-nums">${balanceAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <IconPhoto size={18} className="text-zinc-400" />
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Receipt / Proof</span>
                            </div>
                            {!form.receipt ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square w-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center bg-white dark:bg-black/20 hover:border-emerald-500/50 transition-all cursor-pointer group hover:shadow-xl hover:shadow-emerald-500/5"
                                >
                                    <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-emerald-500 group-hover:bg-emerald-500/5 transition-all">
                                        <IconUpload size={24} stroke={2.5} />
                                    </div>
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter mt-3 text-center px-4 leading-tight">Attach Image / Proof</span>
                                </div>
                            ) : (
                                <div className="relative group rounded-lg overflow-hidden border-2 border-emerald-500/30 aspect-vertical shadow-lg">
                                    <img src={URL.createObjectURL(form.receipt)} className="w-full h-full object-cover" alt="Receipt" />
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full h-9 text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-zinc-100">
                                            REPLACE
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => setForm({ ...form, receipt: null })} className="w-full h-9 text-[10px] font-black uppercase tracking-widest">
                                            REMOVE
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={e => setForm({ ...form, receipt: e.target.files?.[0] || null })} className="hidden" accept="image/*" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-950 border-t dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold px-6 h-12">CANCEL</Button>
                    <Button 
                        disabled={addDepositMutation.isPending || !form.amount || !form.payment_account_id || isOverpaid}
                        onClick={handleSubmit}
                        className={`h-12 px-10 font-black transition-all ${isOverpaid ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95'}`}
                    >
                        {addDepositMutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <IconLoader2 className="animate-spin" size={18} />
                                <span className="tracking-widest uppercase text-[11px]">RECORDING...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <IconCircleCheck size={18} />
                                <span className="tracking-widest uppercase text-[11px]">CONFIRM PAYMENT</span>
                            </div>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RecordPaymentDialog;
