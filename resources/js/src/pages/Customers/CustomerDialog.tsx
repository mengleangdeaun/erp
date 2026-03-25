import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconUser, IconDeviceFloppy, IconPhone, IconMail, IconMapPin, IconBrandTelegram, IconCalendar, IconNotes, IconLoader2, IconClock } from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useCRMCreateCustomer, useCRMUpdateCustomer, useCRMCustomerNextCode } from '@/hooks/useCRMData';
import { useTranslation } from 'react-i18next';

interface CustomerType {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    customer_no: string;
    customer_code: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    telegram_user_id: string | null;
    joined_at: string | null;
    customer_type_id: number;
    status: 'ACTIVE' | 'INACTIVE';
    notes: string | null;
}

interface CustomerDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    customer: Customer | null;
    customerTypes: CustomerType[];
    onSave: () => void;
}

const CustomerDialog = ({ isOpen, setIsOpen, customer, customerTypes, onSave }: CustomerDialogProps) => {
    const { t } = useTranslation();
    const createMutation = useCRMCreateCustomer();
    const updateMutation = useCRMUpdateCustomer();
    const { data: nextCodeData, refetch: fetchNextCode, isFetching: isFetchingNextCode } = useCRMCustomerNextCode();

    const [form, setForm] = useState({
        customer_code: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        telegram_user_id: '',
        joined_at: format(new Date(), 'yyyy-MM-dd'),
        joined_time: format(new Date(), 'HH:mm'),
        customer_type_id: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
        notes: '',
    });

    const saving = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (!isOpen) return;

        if (customer) {
            const dateObj = customer.joined_at ? new Date(customer.joined_at) : new Date();
            setForm({
                customer_code: customer.customer_code || '',
                name: customer.name || '',
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                telegram_user_id: customer.telegram_user_id || '',
                joined_at: format(dateObj, 'yyyy-MM-dd'),
                joined_time: format(dateObj, 'HH:mm'),
                customer_type_id: String(customer.customer_type_id),
                status: customer.status,
                notes: customer.notes || '',
            });
        } else {
            const defaultType = customerTypes.find(t => (t as any).is_default)?.id || (customerTypes[0]?.id ? String(customerTypes[0].id) : '');
            setForm({
                customer_code: '',
                name: '',
                phone: '',
                email: '',
                address: '',
                telegram_user_id: '',
                joined_at: format(new Date(), 'yyyy-MM-dd'),
                joined_time: format(new Date(), 'HH:mm'),
                customer_type_id: String(defaultType),
                status: 'ACTIVE',
                notes: '',
            });
            fetchNextCode();
        }
    }, [isOpen, customer, customerTypes, fetchNextCode]);

    useEffect(() => {
        if (nextCodeData?.next_code && !customer && isOpen) {
            setForm(prev => ({ ...prev, customer_code: String(nextCodeData.next_code) }));
        }
    }, [nextCodeData, customer, isOpen]);

    const handleSubmit = async (e: React.FormEvent, createNew: boolean = false) => {
        if (e) e.preventDefault();
        
        // Combine date and time to UTC for the backend
        const combinedDateTime = new Date(`${form.joined_at}T${form.joined_time}:00`);
        const payload = {
            ...form,
            joined_at: form.joined_at ? format(combinedDateTime, 'yyyy-MM-dd') : null,
        };
        
        // Remove joined_time from payload as it's not a DB column
        delete (payload as any).joined_time;

        try {
            if (customer) {
                await updateMutation.mutateAsync({ id: customer.id, data: payload });
                toast.success(t('success_update_customer'));
            } else {
                await createMutation.mutateAsync(payload);
                toast.success(t('success_create_customer'));
            }

            onSave();
            if (createNew && !customer) {
                // Reset form and fetch next code for next customer
                const defaultType = customerTypes.find(t => (t as any).is_default)?.id || (customerTypes[0]?.id ? String(customerTypes[0].id) : '');
                setForm({
                    customer_code: '',
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    telegram_user_id: '',
                    joined_at: format(new Date(), 'yyyy-MM-dd'),
                    joined_time: format(new Date(), 'HH:mm'),
                    customer_type_id: String(defaultType),
                    status: 'ACTIVE',
                    notes: '',
                });
                fetchNextCode();
            } else {
                setIsOpen(false);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('failed_save_customer'));
        }
    };

    return (
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
    {/* Header – fixed at top */}
    <DialogHeader className="shrink-0 p-6 bg-primary/5 dark:bg-primary/10 border-b border-primary/10">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-sm">
          <IconUser className="w-6 h-6" />
        </div>
        <div>
          <DialogTitle className="text-xl font-bold">
            {customer ? t('edit_customer') : t('new_customer')}
          </DialogTitle>
          <DialogDescription>
            {customer ? t('update_details_for', { no: customer.customer_no }) : t('enter_personal_info')}
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

    {/* Scrollable content area */}
    <ScrollArea className="flex-1 min-h-0">
      <form id="customer-form" onSubmit={handleSubmit} className="p-6 !pt-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">{t('basic_info')}</h3>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('customer_code')} <span className="text-danger">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">#</span>
                <Input 
                  value={form.customer_code} 
                  onChange={e => setForm({ ...form, customer_code: e.target.value.toUpperCase() })}
                  placeholder={isFetchingNextCode ? t('fetching_code') : t('auto_increment')}
                  required
                  className={`pl-10 h-11 font-black ${isFetchingNextCode ? 'animate-pulse bg-gray-100 dark:bg-gray-800' : ''}`}
                  disabled={isFetchingNextCode}
                />
                {isFetchingNextCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <IconLoader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('full_name')}</Label>
              <div className="relative">
                <IconUser size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Sok Sabay"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('customer_type')} <span className="text-danger">*</span></Label>
              <Select value={form.customer_type_id} onValueChange={v => setForm({ ...form, customer_type_id: v })}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t('select_type')} />
                </SelectTrigger>
                <SelectContent>
                  {customerTypes.map(type => (
                    <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold mb-0 flex items-center gap-2">
                  <IconCalendar size={14} /> {t('join_date')}
                </Label>
                <DatePicker
                  className="h-11"
                  value={form.joined_at} 
                  onChange={date => setForm({ ...form, joined_at: date ? format(date, 'yyyy-MM-dd') : '' })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold mb-0 flex items-center gap-2">
                  <IconClock size={14} /> {t('join_time')}
                </Label>
                <TimePicker
                  className="h-11"
                  value={form.joined_time}
                  onChange={time => setForm({ ...form, joined_time: time })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('status')}</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t('active')}</SelectItem>
                  <SelectItem value="INACTIVE">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">{t('contact_details')}</h3>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('phone_number')} <span className="text-danger">*</span></Label>
              <div className="relative">
                <IconPhone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+855 12 345 678"
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('email_address')}</Label>
              <div className="relative">
                <IconMail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  type="email"
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={t('email_address')}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-primary flex items-center gap-2">
                <IconBrandTelegram size={16} /> {t('telegram_id')}
              </Label>
              <Input 
                value={form.telegram_user_id} 
                onChange={e => setForm({ ...form, telegram_user_id: e.target.value })}
                placeholder="e.g. 123456789"
                className="h-11"
              />
              <p className="text-[10px] text-gray-500">{t('telegram_desc')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">{t('additional_info')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('address_label')}</Label>
              <div className="relative">
                <IconMapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                <Textarea 
                  value={form.address} 
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder={t('enter_full_address')}
                  className="pl-10 min-h-[100px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('notes_label')}</Label>
              <div className="relative">
                <IconNotes size={18} className="absolute left-3 top-3 text-gray-400" />
                <Textarea 
                  value={form.notes} 
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder={t('internal_notes_placeholder')}
                  className="pl-10 min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hidden field for fallback submit if needed */}
      </form>
    </ScrollArea>

    {/* Sticky Footer */}
    <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 pt-4 border-t border-gray-100 dark:border-gray-800 bg-background">
      <p className="text-[11px] text-gray-400 italic order-3 sm:order-1">{t('required_fields_msg')}</p>
      <div className="flex gap-2 order-2">
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="h-11 px-6 hover:bg-gray-100 dark:hover:bg-gray-800">
          {t('cancel')}
        </Button>
        
        {!customer && (
          <Button 
            type="button"
            variant="outline"
            disabled={saving}
            onClick={(e) => handleSubmit(e as any, true)}
            className="h-11 px-6 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
          >
            {t('save_create_new')}
          </Button>
        )}

        <Button 
          type="submit" 
          form="customer-form"
          disabled={saving} 
          className="h-11 gap-2 px-8 shadow-lg shadow-primary/20"
        >
          {saving ? <IconLoader2 className="animate-spin" size={18} /> : <IconDeviceFloppy size={18} />}
          {customer ? t('update_customer_btn') : t('create_customer_btn')}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    );
};

export default CustomerDialog;
