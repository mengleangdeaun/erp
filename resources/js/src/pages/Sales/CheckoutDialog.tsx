import React, { useMemo, useRef } from 'react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { 
    IconTools, IconPackage, IconCheck, IconLoader2, IconX, 
    IconCoins, IconUser, IconCar, IconPlus, IconReceipt2,
    IconTrash, IconFileDescription, IconUpload, IconPhoto, IconCalculator
} from '@tabler/icons-react';

interface CheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: any;
    setForm: (form: any) => void;
    customers: any[];
    vehicles: any[];
    paymentAccounts: any[];
    saving: boolean;
    onSubmit: () => void;
    services: any[];
    products: any[];
    manualGrandTotal: number | null;
    setManualGrandTotal: (val: number | null) => void;
    onAddVehicle: () => void;
    removeItem: (idx: number) => void;
    updateItem: (idx: number, changes: any) => void;
    addDeposit: () => void;
    updateDeposit: (idx: number, changes: any) => void;
    receiptFile: File | null;
    setReceiptFile: (file: File | null) => void;
    loadingVehicles?: boolean;
}

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
    open,
    onOpenChange,
    form,
    setForm,
    customers,
    vehicles,
    paymentAccounts,
    saving,
    onSubmit,
    services,
    products,
    manualGrandTotal,
    setManualGrandTotal,
    onAddVehicle,
    removeItem,
    updateItem,
    addDeposit,
    updateDeposit,
    receiptFile,
    setReceiptFile,
    loadingVehicles = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Use pre-calculated totals from form (Calculated in Create.tsx)
    const finalTax = form.tax_total;
    const finalGrandTotal = form.grand_total;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1240px] w-[98vw] max-h-[98vh] p-0 overflow-hidden border-none rounded-2xl shadow-2xl [&>button]:hidden">
                <div className="bg-white dark:bg-zinc-950 flex flex-col h-full lg:h-[750px] transition-all">
                    {/* Header */}
                    <div className="px-8 py-4 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-black/40 backdrop-blur-sm shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                                <IconReceipt2 size={24} stroke={2.5} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">Checkout Terminal</h1>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1 opacity-70">Sales Order Settlement</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onOpenChange(false)} 
                            className="rounded-full h-8 w-8 p-0 text-zinc-400"
                        >
                            <IconX size={18} />
                        </Button>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* Column 1: Identity & Manual Overrides */}
                        <div className="w-full lg:w-[320px] p-6 border-r dark:border-zinc-800 flex flex-col space-y-6 bg-zinc-50/20 dark:bg-black/10 overflow-y-auto shrink-0">
                            <section className="space-y-2">
                                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                    <IconUser size={15} className="text-primary" /> Customer
                                </h3>
                                <SearchableSelect 
                                    options={customers.map(c => ({ value: c.id, label: `${c.name || 'No Name'} (${c.customer_code})` }))}
                                    value={form.customer_id}
                                    onChange={(val) => { setForm({ ...form, customer_id: val as number, vehicle_id: null }); }}
                                    placeholder="Pick Customer..."
                                    className="h-10 bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800 font-bold text-sm"
                                />
                            </section>

                            <section className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                            <IconCar size={15} className="text-primary" /> Vehicle Assets
                                        </h3>
                                        {loadingVehicles && <IconLoader2 size={12} className="animate-spin text-primary" />}
                                    </div>
                                    <Button 
                                        variant="outline" size="sm" onClick={onAddVehicle} disabled={!form.customer_id}
                                        className="h-6 px-2 text-[9px] font-black text-primary border-primary/20 hover:bg-primary/5 shadow-sm"
                                    >
                                        <IconPlus size={10} className="mr-1" /> NEW
                                    </Button>
                                </div>
                                <SearchableSelect 
                                    options={vehicles.map(v => ({ 
                                        value: v.id, 
                                        label: `${v.plate_number || 'NO PLATE'} - ${v.brand?.name || ''} ${v.model?.name || ''}`.trim() || `Vehicle #${v.id}`
                                    }))}
                                    value={form.vehicle_id}
                                    onChange={(val) => setForm({ ...form, vehicle_id: val as number })}
                                    loading={loadingVehicles}
                                    placeholder={form.customer_id ? (loadingVehicles ? "Syncing..." : "Select Vehicle...") : "Customer Required"}
                                    disabled={!form.customer_id || loadingVehicles}
                                    className="h-10 bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800 font-bold text-sm"
                                />
                            </section>

                            <section className="space-y-5 pt-4 border-t dark:border-zinc-800">
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                        <IconCalculator size={14} className="text-primary" /> Terminal Override
                                    </h3>
                                    <div className="relative group">
                                        <IconCoins className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                        <Input 
                                            type="number" 
                                            placeholder="Auto Calculated"
                                            value={manualGrandTotal || ''}
                                            onChange={(e) => setManualGrandTotal(e.target.value ? parseFloat(e.target.value) : null)}
                                            className="h-11 pl-9 pr-12 text-base font-black bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm focus:ring-primary/20"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-300 uppercase">USD</span>
                                    </div>
                                    {manualGrandTotal === null && (
                                        <p className="text-[9px] text-zinc-400 font-bold pl-1 italic">Currently following system calc</p>
                                    )}
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center space-x-3 bg-white dark:bg-black/30 p-3 rounded-lg border dark:border-zinc-800">
                                        <Checkbox 
                                            id="use_tax_dialog"
                                            checked={form.use_tax} 
                                            onCheckedChange={(checked) => setForm({ ...form, use_tax: !!checked })}
                                            className="w-5 h-5 border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-primary"
                                        />
                                        <Label htmlFor="use_tax_dialog" className="text-xs font-black text-zinc-600 dark:text-zinc-300 cursor-pointer flex flex-col">
                                            <span>Apply Order VAT/Tax</span>
                                            <span className="text-[9px] font-bold text-zinc-400 underline decoration-primary/30">Auto-calculated: ${finalTax.toFixed(2)}</span>
                                        </Label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest pl-1">Global Discount</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 flex items-center bg-zinc-100 dark:bg-black/50 rounded-lg p-1 border dark:border-zinc-800">
                                                <button 
                                                    onClick={() => setForm({ ...form, global_discount_type: 'FIXED' })}
                                                    className={`flex-1 py-2 rounded text-[10px] font-bold transition-all ${form.global_discount_type === 'FIXED' ? 'bg-primary text-white shadow-sm' : 'text-zinc-500'}`}
                                                >
                                                    FIXED
                                                </button>
                                                <button 
                                                    onClick={() => setForm({ ...form, global_discount_type: 'PERCENT' })}
                                                    className={`flex-1 py-2 rounded text-[10px] font-bold transition-all ${form.global_discount_type === 'PERCENT' ? 'bg-primary text-white shadow-sm' : 'text-zinc-500'}`}
                                                >
                                                    % PERC
                                                </button>
                                            </div>
                                            <Input 
                                                type="number" 
                                                value={form.global_discount_value}
                                                onChange={(e) => setForm({ ...form, global_discount_value: parseFloat(e.target.value) || 0 })}
                                                className="w-20 h-10 font-black text-xs text-right border-zinc-200 dark:border-zinc-800"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Column 2: Basket Review */}
                        <div className="flex-1 p-6 flex flex-col border-r dark:border-zinc-800 bg-white dark:bg-zinc-950 min-w-0">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Order Review</h3>
                                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-tight">{form.items.length} ITEMS</Badge>
                            </div>

                            <ScrollArea className="flex-1 -mx-2 px-2">
                                <div className="space-y-2 pr-2">
                                    {form.items.map((item: any, idx: number) => {
                                        const s = item.service_id ? services.find(x => x.id === item.service_id) : null;
                                        const p = item.product_id ? products.find(x => x.id === item.product_id) : null;
                                        return (
                                            <div key={idx} className="group relative flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-black/20 hover:border-primary/20 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.service_id ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                                        {item.service_id ? <IconTools size={14} /> : <IconPackage size={14} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-zinc-900 dark:text-white text-[10px] truncate w-full tracking-tight">{s ? s.name : p ? p.name : 'Unknown'}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className="flex items-center bg-white dark:bg-black/40 rounded-md border dark:border-zinc-800 scale-90 origin-left">
                                                                <button onClick={() => updateItem(idx, { qty: Math.max(1, item.qty - 1) })} className="w-6 h-6 flex items-center justify-center text-zinc-400">-</button>
                                                                <span className="w-7 text-center text-[10px] font-black">{item.qty}</span>
                                                                <button onClick={() => updateItem(idx, { qty: item.qty + 1 })} className="w-6 h-6 flex items-center justify-center text-zinc-400">+</button>
                                                            </div>
                                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-none mt-0.5">@ ${item.unit_price.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-zinc-900 dark:text-white text-xs tracking-tight">${((item.qty * item.unit_price) - item.discount).toFixed(2)}</span>
                                                    <button 
                                                        onClick={() => removeItem(idx)}
                                                        className="p-1.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <IconTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>

                            <div className="mt-4 pt-4 border-t dark:border-zinc-800 space-y-2">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-zinc-400">Calculated Subtotal</span>
                                    <span className="text-zinc-900 dark:text-white font-black">${form.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-rose-500 font-black">Discounts</span>
                                    <span className="text-rose-500 font-black">-${form.discount_total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-zinc-400">VAT / Tax</span>
                                    <span className="text-zinc-900 dark:text-white font-black">${finalTax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base font-black pt-2 border-t border-dashed dark:border-zinc-800">
                                    <span className="text-zinc-900 dark:text-white tracking-tight">System Total</span>
                                    <span className="text-primary tracking-tighter">${finalGrandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Assets & Finalize (Fixed Bottom) */}
                        <div className="w-full lg:w-[380px] flex flex-col bg-zinc-50/30 dark:bg-black/10 overflow-hidden shrink-0">
                            <ScrollArea className="flex-1">
                                <div className="space-y-6 p-6">
                                    <section className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                                <IconCoins size={14} className="text-primary" /> Payments
                                            </h3>
                                            <Button 
                                                variant="ghost" size="sm" onClick={addDeposit}
                                                className="h-6 px-2 text-[8px] font-black text-primary border border-primary/20"
                                            >
                                                <IconPlus size={10} className="mr-1" /> ADD LINE
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            {form.deposits.length === 0 ? (
                                                <div className="p-4 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">No advanced payments</p>
                                                </div>
                                            ) : form.deposits.map((dep: any, idx: number) => (
                                                <div key={idx} className="p-3 rounded-lg bg-white dark:bg-black/40 border dark:border-zinc-800 relative group/dep">
                                                    <button 
                                                        onClick={() => setForm({ ...form, deposits: form.deposits.filter((_: any, i: number) => i !== idx) })}
                                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover/dep:opacity-100 transition-all z-10"
                                                    >
                                                        <IconX size={10} stroke={4} />
                                                    </button>
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            type="number" 
                                                            value={dep.amount}
                                                            onChange={(e) => updateDeposit(idx, { amount: parseFloat(e.target.value) || 0 })}
                                                            className="h-9 w-24 text-xs font-bold rounded-md border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20"
                                                        />
                                                        <Select 
                                                            value={dep.payment_account_id?.toString()} 
                                                            onValueChange={(val) => updateDeposit(idx, { payment_account_id: parseInt(val) })}
                                                        >
                                                            <SelectTrigger className="h-9 flex-1 text-[10px] font-bold border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20">
                                                                <SelectValue placeholder="Account..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {paymentAccounts.map(acc => (
                                                                    <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="space-y-3 mb-4">
                                        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                            <IconPhoto size={14} className="text-primary" /> Receipt Image
                                        </h3>
                                        
                                        <div className="space-y-2">
                                            {!receiptFile ? (
                                                <div 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="group cursor-pointer border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center bg-white dark:bg-black/40 hover:border-primary/50 transition-all duration-300"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-all">
                                                        <IconUpload size={20} />
                                                    </div>
                                                    <span className="mt-3 text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Capture Receipt</span>
                                                </div>
                                            ) : (
                                                <div className="relative aspect-vertical rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden bg-black/5 group/img">
                                                    <img src={URL.createObjectURL(receiptFile)} alt="Receipt" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="h-7 text-[9px] font-bold">REPLACE</Button>
                                                        <Button size="sm" variant="destructive" onClick={() => setReceiptFile(null)} className="h-7 text-[9px] font-bold">REMOVE</Button>
                                                    </div>
                                                </div>
                                            )}
                                            <input type="file" ref={fileInputRef} onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="hidden" />
                                        </div>

                                        <Textarea 
                                            value={form.notes}
                                            onChange={e => setForm({ ...form, notes: e.target.value })}
                                            className="w-full h-24 p-3 text-[10px] font-medium resize-none"
                                            placeholder="Internal staff notes..."
                                        />
                                    </section>
                                </div>
                            </ScrollArea>

                            {/* Fixed Bottom Section */}
                            <div className="p-6 bg-zinc-50/80 dark:bg-black backdrop-blur-md border-t dark:border-zinc-800 shrink-0">
                                <div className="p-3 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black space-y-3 shadow-2xl mb-4 relative overflow-hidden group">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-40">
                                        <span>Terminal Net Total</span>
                                        {manualGrandTotal !== null && <Badge className="bg-primary text-white h-4 text-[7px] border-0">OVERRIDE</Badge>}
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-3xl font-black tracking-tighter">${finalGrandTotal.toFixed(2)}</span>
                                        <IconCheck size={24} className="text-primary" stroke={3} />
                                    </div>
                                </div>

                                <Button 
                                    disabled={saving || !form.customer_id || form.items.length === 0}
                                    onClick={onSubmit}
                                    className="w-full h-15 bg-primary hover:bg-primary/95 text-white font-black shadow-sm shadow-primary/30 active:scale-[0.98] transition-all text-sm tracking-wide"
                                >
                                    {saving ? (
                                        <div className="flex items-center gap-3">
                                            <IconLoader2 className="animate-spin" size={20} />
                                            <span>SYNCHRONIZING...</span>
                                        </div>
                                    ) : "AUTHORIZE & FINALIZE ORDER"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CheckoutDialog;
