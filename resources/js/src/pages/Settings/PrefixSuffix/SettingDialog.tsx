import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { IconDeviceFloppy, IconSettings, IconLoader2 } from '@tabler/icons-react';

interface SettingDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    setting: any;
    onSave: () => void;
}

export default function SettingDialog({ isOpen, setIsOpen, setting, onSave }: SettingDialogProps) {
    const [form, setForm] = useState({
        prefix: '',
        suffix: '',
        number_padding: 4,
        next_number: 1,
        is_yearly_reset: false,
        is_monthly_reset: false,
        date_format: '',
        separator: '-',
        include_branch_code: false,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (setting) {
            setForm({
                prefix: setting.prefix || '',
                suffix: setting.suffix || '',
                number_padding: setting.number_padding,
                next_number: setting.next_number,
                is_yearly_reset: !!setting.is_yearly_reset,
                is_monthly_reset: !!setting.is_monthly_reset,
                date_format: setting.date_format || '_NONE_',
                separator: setting.separator || '-',
                include_branch_code: !!setting.include_branch_code,
            });
        }
    }, [setting]);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                date_format: form.date_format === '_NONE_' ? '' : form.date_format
            };
            const res = await fetch(`/api/settings/document-numbers/${setting.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success('Settings updated successfully');
                onSave();
                setIsOpen(false);
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to update settings');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    const renderPreview = () => {
        const segments = [];
        
        // Simulating branch code preview if enabled
        if (form.include_branch_code) {
            segments.push('BR'); // Dummy branch code for preview
        }

        if (form.prefix) segments.push(form.prefix);
        if (form.date_format && form.date_format !== '_NONE_') {
            try {
                const dateFnsFormat = form.date_format
                    .replace(/YYYY/g, 'yyyy')
                    .replace(/YY/g, 'yy')
                    .replace(/DD/g, 'dd')
                    .replace(/D/g, 'd');
                segments.push(format(new Date(), dateFnsFormat));
            } catch {
                segments.push(form.date_format);
            }
        }
        segments.push(String(form.next_number).padStart(form.number_padding, '0'));
        if (form.suffix) segments.push(form.suffix);
        
        return segments.join(form.separator || '');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <IconSettings className="w-5 h-5" />
                        </div>
                        {setting?.label} Numbering
                    </DialogTitle>
                    <DialogDescription>
                        Define how {setting?.label} numbers are generated.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Prefix</Label>
                            <Input 
                                value={form.prefix} 
                                onChange={e => setForm({ ...form, prefix: e.target.value })}
                                placeholder="e.g. PO"
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Suffix</Label>
                            <Input 
                                value={form.suffix} 
                                onChange={e => setForm({ ...form, suffix: e.target.value })}
                                placeholder="e.g. HQ"
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Date Format</Label>
                            <Select value={form.date_format} onValueChange={v => setForm({ ...form, date_format: v })}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="No Date" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_NONE_">None</SelectItem>
                                    <SelectItem value="DDMMYYYY">DDMMYYYY</SelectItem>
                                    <SelectItem value="DDMMYY">DDMMYY</SelectItem>
                                    <SelectItem value="MMDDYY">MMDDYY</SelectItem>
                                    <SelectItem value="YYMMDD">YYMMDD</SelectItem>
                                    <SelectItem value="DDMMMYY">DDMMMYY</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                    <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                                    <SelectItem value="MMMM DD, YYYY">MMMM DD, YYYY</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Separator</Label>
                            <Input 
                                value={form.separator} 
                                onChange={e => setForm({ ...form, separator: e.target.value })}
                                placeholder="e.g. -"
                                className="h-10 text-center font-mono"
                                maxLength={5}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Digit Padding</Label>
                            <Input 
                                type="number"
                                value={form.number_padding} 
                                onChange={e => setForm({ ...form, number_padding: parseInt(e.target.value) })}
                                min="0" max="10"
                                className="h-10"
                            />
                            <p className="text-[10px] text-gray-500">e.g. 4 becomes 0001</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Next Number</Label>
                            <Input 
                                type="number"
                                value={form.next_number} 
                                onChange={e => setForm({ ...form, next_number: parseInt(e.target.value) })}
                                min="1"
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between group">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold">Yearly Reset</Label>
                                <p className="text-[10px] text-gray-500">Reset number to 1 on January 1st</p>
                            </div>
                            <Switch 
                                checked={form.is_yearly_reset} 
                                onCheckedChange={val => setForm({ ...form, is_yearly_reset: val, is_monthly_reset: val ? false : form.is_monthly_reset })} 
                            />
                        </div>
                        <div className="flex items-center justify-between group">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold">Monthly Reset</Label>
                                <p className="text-[10px] text-gray-500">Reset number to 1 on 1st of every month</p>
                            </div>
                            <Switch 
                                checked={form.is_monthly_reset} 
                                onCheckedChange={val => setForm({ ...form, is_monthly_reset: val, is_yearly_reset: val ? false : form.is_yearly_reset })} 
                            />
                        </div>

                        <div className="flex items-center justify-between group pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold text-primary">Include Branch Code</Label>
                                <p className="text-[10px] text-gray-500 italic">Automatically prepend branch code to final number</p>
                            </div>
                            <Switch 
                                checked={form.include_branch_code} 
                                onCheckedChange={val => setForm({ ...form, include_branch_code: val })} 
                            />
                        </div>
                    </div>

                    <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/10">
                        <Label className="text-[10px] uppercase text-primary font-bold mb-2 block">Live Preview</Label>
                        <div className="text-2xl font-mono font-bold tracking-tighter text-primary break-all">
                            {renderPreview()}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-10">Cancel</Button>
                        <Button type="submit" disabled={saving} className="h-10 gap-2 px-6 text-white font-bold">
                            {saving ? (
                                <>
                                    <IconLoader2 size={18} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <IconDeviceFloppy size={18} /> 
                                    Update Setting
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
