import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconSend, IconDeviceFloppy, IconPhoto, IconPaperclip, IconUpload, IconX, IconFile, IconWorld, IconBuilding, IconHierarchy, IconUsers } from '@tabler/icons-react';
import { IconInfoCircle, IconCircleCheck, IconAlertTriangle, IconAlertOctagon } from '@tabler/icons-react';
import dayjs from 'dayjs';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { DatePicker } from '../../../components/ui/date-picker';
import { TimePicker } from '../../../components/ui/time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import SearchableMultiSelect from '../../../components/ui/SearchableMultiSelect';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { CustomQuillEditor } from '../../../components/ui/custom-quill-editor';
import MediaSelector, { MediaFile } from '../../../components/MediaSelector';

interface FormData {
    title: string;
    type: string;
    short_description: string;
    content: string;
    start_date: string;
    end_date: string;
    is_featured: boolean;
    targeting_type: string;
    target_ids: string[];
    published_at: string;
    status: string;
    is_published: boolean;
    send_notification: boolean;
    send_telegram: boolean;
}

const defaultForm: FormData = {
    title: '', type: 'info', short_description: '', content: '',
    start_date: '', end_date: '', is_featured: false,
    targeting_type: 'all', target_ids: [], published_at: '', status: 'draft',
    is_published: true, send_notification: true, send_telegram: false,
};

const toDate = (val: string): Date | undefined => {
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
};

const toStr = (d: Date | undefined): string =>
    d ? dayjs(d).format('YYYY-MM-DD') : '';

// ─── Stable sub-components (defined outside to prevent remount flicker) ─────
const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="text-sm font-semibold mb-1.5 block text-gray-700 dark:text-gray-300">
        {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
);

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-700/60 p-5 shadow-sm space-y-4">
        {title && <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{title}</h2>}
        {children}
    </div>
);

const Toggle = ({ checked, onChange, label, sublabel, activeColor = 'bg-primary' }:
    { checked: boolean; onChange: (v: boolean) => void; label: string; sublabel?: string; activeColor?: string }) => (
    <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative shrink-0">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
            <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${checked ? activeColor : 'bg-gray-200 dark:bg-gray-600'}`} />
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
        </div>
        <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
            {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </div>
    </label>
);

// ── Skeleton ─────────────────────────────────────────────────────────────────
const FormSkeleton = () => (
    <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-1.5">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3.5 w-64 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700/60 p-5 space-y-4">
                    {[80, 60, 200].map((h, i) => (
                        <div key={i} className={`h-${i === 2 ? '48' : '10'} bg-gray-100 dark:bg-gray-800 rounded-lg`} style={{ height: h === 200 ? 192 : h === 80 ? 40 : 40 }} />
                    ))}
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700/60 p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                    </div>
                    <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                </div>
            </div>
            <div className="space-y-5">
                {[2, 4, 2].map((rows, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700/60 p-5 space-y-3">
                        {Array.from({ length: rows }).map((_, j) => (
                            <div key={j} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default function AnnouncementForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    // ── Security: reject non-numeric IDs immediately ─────────────────────────
    useEffect(() => {
        if (isEdit && !/^\d+$/.test(id ?? '')) {
            toast.error('Invalid announcement ID');
            navigate('/hr/announcements', { replace: true });
        }
    }, [id]);

    const [form, setForm] = useState<FormData>(defaultForm);
    const [dropdowns, setDropdowns] = useState<{ branches: any[]; departments: any[]; employees: any[] }>({
        branches: [], departments: [], employees: [],
    });
    const [loadingForm, setLoadingForm] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    
    // Media State
    const [featuredImage, setFeaturedImage] = useState<File | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [preexistingImage, setPreexistingImage] = useState<string | null>(null);
    const [preexistingAttachments, setPreexistingAttachments] = useState<any[]>([]);
    
    // Filtering for targeting
    const [filterBranchId, setFilterBranchId] = useState<string>('all');
    const [filterDeptId, setFilterDeptId] = useState<string>('all');

    const [publishMethod, setPublishMethod] = useState<'now' | 'schedule'>('now');
    const [publishTime, setPublishTime] = useState<string>(dayjs().format('HH:mm'));

    // Media Selector State
    const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
    const [mediaSelectorType, setMediaSelectorType] = useState<'hero' | 'attachment'>('hero');

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const authHeaders = {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
    };

    useEffect(() => {
        if (isEdit && !/^\d+$/.test(id ?? '')) return; // already redirecting

        const dropdownFetch = fetch('/api/hr/announcements-form-data', {
            headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(async r => {
                if (!r.ok) return;
                const data = await r.json();
                setDropdowns({
                    branches:    Array.isArray(data.branches)    ? data.branches    : [],
                    departments: Array.isArray(data.departments) ? data.departments : [],
                    employees:   Array.isArray(data.employees)   ? data.employees   : [],
                });
            })
            .catch(() => {});

        if (!isEdit) return;

        // Load the announcement being edited — wait for both to finish
        setLoadingForm(true);
        const announcementFetch = fetch(`/api/hr/announcements/${id}`, {
            headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        }).then(async r => {
            if (r.status === 404) {
                toast.error('Announcement not found');
                navigate('/hr/announcements', { replace: true });
                return;
            }
            if (r.status === 403) {
                toast.error('You do not have permission to edit this announcement');
                navigate('/hr/announcements', { replace: true });
                return;
            }
            if (!r.ok) {
                toast.error('Failed to load announcement');
                navigate('/hr/announcements', { replace: true });
                return;
            }
            const data = await r.json();
            setForm({
                title:            data.title            || '',
                type:             data.type             || 'info',
                short_description:data.short_description|| '',
                content:          data.content          || '',
                start_date:   data.start_date   ? dayjs(data.start_date).format('YYYY-MM-DD')   : '',
                end_date:     data.end_date     ? dayjs(data.end_date).format('YYYY-MM-DD')     : '',
                is_featured:      data.is_featured      || false,
                targeting_type:   data.targeting_type   || 'all',
                target_ids:       data.target_ids       || [],
                published_at: data.published_at ? dayjs(data.published_at).format('YYYY-MM-DD') : '',
                status:           data.status           || 'draft',
                is_published:     Boolean(data.is_published),
                send_notification: true, // Always default to true on edit load
                send_telegram:    data.send_telegram    || false,
            });
            if (data.published_at && dayjs(data.published_at).isAfter(dayjs())) {
                setPublishMethod('schedule');
                setPublishTime(dayjs(data.published_at).format('HH:mm'));
            } else {
                setPublishMethod('now');
                setPublishTime(dayjs().format('HH:mm'));
            }
            setPreexistingImage(data.featured_image || null);
            setPreexistingAttachments(Array.isArray(data.attachments) ? data.attachments : []);
        }).catch(() => {
            toast.error('Failed to load announcement');
            navigate('/hr/announcements', { replace: true });
        });

        Promise.all([dropdownFetch, announcementFetch]).finally(() => setLoadingForm(false));
    }, [id]);

    const set = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }));

    const handleSubmit = async (status: 'draft' | 'published') => {
        if (!form.title.trim()) return toast.error('Title is required');
        setSaving(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            
            const formData = new FormData();
            
            let finalPublishedAt = form.published_at;
            let finalIsPublished = form.is_published;

            if (status === 'published') {
                finalIsPublished = true;
                if (publishMethod === 'now') {
                    finalPublishedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
                } else if (form.published_at) {
                    const scheduledTime = dayjs(`${form.published_at} ${publishTime}`);
                    const minLeadTime = dayjs().add(15, 'minute');
                    
                    if (scheduledTime.isBefore(minLeadTime)) {
                        setSaving(false);
                        return toast.error('Scheduled time must be at least 15 minutes in the future');
                    }
                    
                    finalPublishedAt = scheduledTime.format('YYYY-MM-DD HH:mm:ss');
                }
            }

            // Append basic fields
            const submitStatus = (isEdit && status === 'draft') ? form.status : status;
            
            Object.entries({ ...form, status: submitStatus, published_at: finalPublishedAt, is_published: finalIsPublished }).forEach(([key, value]) => {
                if (key === 'target_ids') {
                    // Laravel expects array fields as target_ids[] when using FormData
                    if (Array.isArray(value)) {
                        value.forEach((val, index) => {
                            formData.append(`target_ids[${index}]`, String(val));
                        });
                    }
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, String(value ?? ''));
                }
            });

            // Append files
            if (featuredImage) {
                formData.append('featured_image', featuredImage);
            }
            attachments.forEach((file, i) => {
                formData.append(`attachments[${i}]`, file);
            });

            // Append pre-existing or media library selected images/files
            if (preexistingImage && !featuredImage) {
                formData.append('preexisting_featured_image', preexistingImage);
            }
            if (preexistingAttachments.length > 0) {
                preexistingAttachments.forEach((file, i) => {
                    formData.append(`preexisting_attachments[${i}]`, file.url || file.path || file);
                });
            }

            if (isEdit) {
                formData.append('_method', 'PUT');
            }

            const url = isEdit ? `/api/hr/announcements/${id}` : '/api/hr/announcements';
            const res = await fetch(url, { 
                method: 'POST', 
                headers: authHeaders, 
                credentials: 'include', 
                body: formData 
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(isEdit ? 'Announcement updated!' : (status === 'published' ? 'Announcement published!' : 'Saved as draft'));
                navigate('/hr/announcements');
            } else {
                toast.error(data.message || 'Save failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    const targetOptions = () => {
        switch (form.targeting_type) {
            case 'branch':
                return dropdowns.branches.map(b => ({ value: String(b.id), label: b.name }));
            case 'department':
                return dropdowns.departments
                    .filter(d => filterBranchId === 'all' || (d.branches && d.branches.some((b: any) => String(b.id) === filterBranchId)))
                    .map(d => ({ value: String(d.id), label: d.name }));
            case 'employee':
                return dropdowns.employees
                    .filter(e => (filterBranchId === 'all' || String(e.branch_id) === filterBranchId) &&
                                (filterDeptId === 'all' || String(e.department_id) === filterDeptId))
                    .map(e => ({ 
                        value: String(e.id), 
                        label: `${e.full_name} (${e.employee_id})`,
                        description: `Dept: ${dropdowns.departments.find(d => d.id === e.department_id)?.name || 'N/A'}`
                    }));
            default: return [];
        }
    };

    const allTargetOptions = () => {
        switch (form.targeting_type) {
            case 'branch':     return dropdowns.branches.map(b => ({ value: String(b.id), label: b.name }));
            case 'department': return dropdowns.departments.map(d => ({ value: String(d.id), label: d.name }));
            case 'employee':   return dropdowns.employees.map(e => ({ value: String(e.id), label: `${e.full_name} (${e.employee_id})` }));
            default: return [];
        }
    };

    // Show skeleton while loading edit data
    if (loadingForm) return <FormSkeleton />;

    return (
        <div className="pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all text-gray-500 shadow-sm"
                    >
                        <IconArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            {isEdit ? 'Update Announcement' : 'Draft New Announcement'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {isEdit ? 'Modify existing communication' : 'Create a new broadcast for your employees'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => handleSubmit('draft')} isLoading={saving} className="px-5 h-11 border-gray-200 dark:border-gray-800 shadow-sm hover:bg-gray-50 bg-white dark:bg-black font-semibold">
                        <IconDeviceFloppy className="w-4.5 h-4.5 mr-2" />
                        {isEdit ? 'Save Changes' : 'Save as Draft'}
                    </Button>
                    <Button onClick={() => handleSubmit('published')} isLoading={saving} className="px-6 h-11 shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 text-white">
                        <IconSend className="w-4.5 h-4.5 mr-2" />
                        {form.is_published && isEdit ? 'Update Broadcast' : (publishMethod === 'now' ? 'Publish Now' : 'Schedule Broadcast')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Left: Main Content (8 cols) ──────────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-6">
                    <Card title="Announcement Details">
                        <div className="space-y-4">
                            <div>
                                <Label required>Headline / Title</Label>
                                <Input
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    placeholder="Enter a compelling title..."
                                    className="h-12 text-base font-medium focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <Label>Snippet / Short Description</Label>
                                <Textarea
                                    value={form.short_description}
                                    onChange={e => set('short_description', e.target.value)}
                                    rows={3}
                                    placeholder="Used for mobile notifications and list previews..."
                                    className="w-full px-4 py-3 bg-white dark:bg-black text-sm transition-all focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                />
                            </div>
                            <div>
                                <Label>Full Body Content</Label>
                                <div className="overflow-hidden">
                                    <CustomQuillEditor
                                        variant='default'
                                        value={form.content}
                                        onChange={v => set('content', v)}
                                        placeholder="Detailed announcement content..."
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Right: Sidebar (4 cols) ──────────────────────────────────────────────── */}
                <div className="lg:col-span-4 space-y-6">

                    <Card title="Visibility & Scheduling">
                        <div className="space-y-6">
                            <div>
                                <Label>Effective Date Range</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Starts On</span>
                                        <DatePicker
                                            value={toDate(form.start_date)}
                                            onChange={d => set('start_date', toStr(d))}
                                            placeholder="Begin date"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Expires On</span>
                                        <DatePicker
                                            value={toDate(form.end_date)}
                                            onChange={d => set('end_date', toStr(d))}
                                            placeholder="End date"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2 italic ml-1">
                                    {form.end_date ? 'Will be hidden automatically after this date.' : 'No expiration set.'}
                                </p>
                            </div>

                            <div>
                                <Label>Publication Strategy</Label>
                                <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-lg mb-4">
                                    <button 
                                        onClick={() => setPublishMethod('now')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${publishMethod === 'now' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Publish Now
                                    </button>
                                    <button 
                                        onClick={() => setPublishMethod('schedule')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${publishMethod === 'schedule' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Schedule
                                    </button>
                                </div>

                                {publishMethod === 'schedule' ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Release Date</span>
                                                <DatePicker
                                                    value={toDate(form.published_at)}
                                                    onChange={d => set('published_at', toStr(d))}
                                                    placeholder="Select Date"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Release Time</span>
                                                <TimePicker
                                                    value={publishTime}
                                                    onChange={setPublishTime}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/10 flex items-start gap-3 animate-in fade-in zoom-in-95">
                                        <IconCircleCheck className="w-4 h-4 text-green-500 mt-0.5" />
                                        <p className="text-[11px] text-green-600/80 leading-relaxed font-medium">
                                            Visible immediately upon saving.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card title="Audience Targeting">
                         <div className="space-y-4">
                            <div>
                                <Label>Target Scope</Label>
                                <Select value={form.targeting_type} onValueChange={v => { 
                                    set('targeting_type', v); 
                                    set('target_ids', []);
                                    setFilterBranchId('all');
                                    setFilterDeptId('all');
                                }}>
                                    <SelectTrigger className="h-11 border-gray-200 dark:border-gray-800"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all"><IconWorld className="inline mr-2 h-4 w-4" /> All Employees</SelectItem>
                                        <SelectItem value="branch"><IconBuilding className="inline mr-2 h-4 w-4" /> Specific Branches</SelectItem>
                                        <SelectItem value="department"><IconHierarchy className="inline mr-2 h-4 w-4" /> Specific Departments</SelectItem>
                                        <SelectItem value="employee"><IconUsers className="inline mr-2 h-4 w-4" /> Specific Individuals</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {form.targeting_type === 'department' && (
                                <div className="animate-in fade-in slide-in-from-left-2">
                                    <Label>Filter Branch</Label>
                                    <SearchableSelect
                                        options={[
                                            { value: 'all', label: 'Any Branch' },
                                            ...dropdowns.branches.map(b => ({ value: String(b.id), label: b.name }))
                                        ]}
                                        value={filterBranchId}
                                        onChange={v => setFilterBranchId(String(v))}
                                        placeholder="Search..."
                                    />
                                </div>
                            )}

                            {form.targeting_type === 'employee' && (
                                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-left-2">
                                    <div>
                                        <Label>Branch</Label>
                                        <SearchableSelect
                                            options={[
                                                { value: 'all', label: 'Any' },
                                                ...dropdowns.branches.map(b => ({ value: String(b.id), label: b.name }))
                                            ]}
                                            value={filterBranchId}
                                            onChange={v => { 
                                                const newBranchId = String(v);
                                                setFilterBranchId(newBranchId); 
                                                setFilterDeptId('all'); 
                                            }}
                                            placeholder="Any..."
                                        />
                                    </div>
                                    <div>
                                        <Label>Dept.</Label>
                                        <SearchableSelect
                                            options={[
                                                { value: 'all', label: 'Any' },
                                                ...dropdowns.departments
                                                    .filter(d => filterBranchId === 'all' || (d.branches && d.branches.some((b: any) => String(b.id) === filterBranchId)))
                                                    .map(d => ({ value: String(d.id), label: d.name }))
                                            ]}
                                            value={filterDeptId}
                                            onChange={v => setFilterDeptId(String(v))}
                                            placeholder="Any..."
                                        />
                                    </div>
                                </div>
                            )}

                            {form.targeting_type !== 'all' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Label>Selection List</Label>
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-2 bg-gray-50/30 dark:bg-black/20">
                                        <SearchableMultiSelect
                                            key={form.targeting_type}
                                            options={targetOptions()}
                                            allOptions={allTargetOptions()}
                                            value={form.target_ids}
                                            onChange={v => set('target_ids', v)}
                                            placeholder={`Find ${form.targeting_type}s...`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Publication Status">
                        <div className="space-y-4">
                            <Toggle 
                                checked={form.is_published} 
                                onChange={v => set('is_published', v)}
                                label="Live / Published" 
                                sublabel="If off, hidden from all devices regardless of dates"
                                activeColor="bg-green-500"
                            />
                            
                            <hr className="border-gray-100 dark:border-gray-800" />
                            
                            <Toggle 
                                checked={form.send_notification} 
                                onChange={v => set('send_notification', v)}
                                label="Push Notification" 
                                sublabel="Broadcast push alert on publication"
                            />
                            
                             <Toggle 
                                checked={form.send_telegram} 
                                onChange={v => set('send_telegram', v)}
                                label="Telegram Sync" 
                                sublabel="Post to official Telegram channel" 
                                activeColor="bg-blue-500" 
                            />
                        </div>
                    </Card>

                    <Card title="Presentation">
                        <div className="space-y-6">
                            <div>
                                <Label>Broadcast Level</Label>
                                <Select value={form.type} onValueChange={v => set('type', v)}>
                                    <SelectTrigger className="h-11 rounded-md border-gray-200 dark:border-gray-800"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-md">
                                        <SelectItem value="info"><IconInfoCircle className="inline mr-2 h-4 w-4 text-blue-500" /> Information</SelectItem>
                                        <SelectItem value="success"><IconCircleCheck className="inline mr-2 h-4 w-4 text-green-500" /> High Priority / Success</SelectItem>
                                        <SelectItem value="warning"><IconAlertTriangle className="inline mr-2 h-4 w-4 text-amber-500" /> Warning</SelectItem>
                                        <SelectItem value="danger"><IconAlertOctagon className="inline mr-2 h-4 w-4 text-red-500" /> Urgent / Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                <Toggle 
                                    checked={form.is_featured} 
                                    onChange={v => set('is_featured', v)}
                                    label="Highlight Feature" 
                                    sublabel="Show as popup on app startup" 
                                />
                                
                                {form.is_featured && (
                                    <div className="pt-4 animate-in slide-in-from-top-2 duration-300">
                                        <Label>Hero Image (Mobile App)</Label>
                                        <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-black transition-all hover:border-primary/40">
                                            {(featuredImage || preexistingImage) ? (
                                                <div className="aspect-[16/9]">
                                                    <img 
                                                        src={featuredImage ? URL.createObjectURL(featuredImage) : `/storage/${preexistingImage}`} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-2">
                                                        <Button variant="secondary" size="sm" className="rounded-xl px-4" onClick={() => { setFeaturedImage(null); setPreexistingImage(null); }}>
                                                            <IconX className="w-4 h-4 mr-2" /> Replace
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="rounded-xl px-4 bg-white/20 text-white border-white/40 hover:bg-white/40" onClick={() => { setMediaSelectorType('hero'); setMediaSelectorOpen(true); }}>
                                                            <IconPhoto className="w-4 h-4 mr-2" /> From Library
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative aspect-[16/9] flex flex-col items-center justify-center p-6 text-center">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                                                        <IconPhoto className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-500">UPLOAD HERO IMAGE</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">Recommended: 1200x675px</p>
                                                    <div className="flex gap-2 mt-4 relative z-10">
                                                        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold" onClick={(e) => { e.preventDefault(); setMediaSelectorType('hero'); setMediaSelectorOpen(true); }}>
                                                            <IconPhoto className="w-3.5 h-3.5 mr-1" /> LIBRARY
                                                        </Button>
                                                        <Button size="sm" className="h-8 text-[10px] font-bold relative overflow-hidden">
                                                            <IconUpload className="w-3.5 h-3.5 mr-1" /> UPLOAD
                                                            <input 
                                                                type="file" 
                                                                accept="image/*"
                                                                onChange={e => setFeaturedImage(e.target.files?.[0] || null)}
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                            />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card title="Resources">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                {preexistingAttachments.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-medium group">
                                        <div className="flex items-center gap-2 truncate">
                                            <IconFile className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">Existing</span>
                                    </div>
                                ))}
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-primary/5 text-primary border border-primary/10 rounded-xl text-xs font-bold animate-in slide-in-from-right-2">
                                        <div className="flex items-center gap-2 truncate">
                                            <IconFile className="w-4 h-4" />
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="p-1 hover:bg-primary/10 rounded-lg">
                                            <IconX className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                                <div className="flex gap-2 w-full">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 h-20 flex-col gap-2 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all group"
                                        onClick={() => { setMediaSelectorType('attachment'); setMediaSelectorOpen(true); }}
                                    >
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <IconPhoto className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Library</span>
                                    </Button>

                                    <label className="flex-1 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-all group">
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-0 group-hover:scale-110 transition-transform">
                                            <IconPaperclip className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Local</span>
                                        <input 
                                            type="file" 
                                            multiple 
                                            className="hidden" 
                                            onChange={e => {
                                                if (e.target.files) {
                                                    setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                        </div>
                    </Card>
                </div>
            </div>

            <MediaSelector
                open={mediaSelectorOpen}
                onOpenChange={setMediaSelectorOpen}
                onSelect={(file: MediaFile) => {
                    if (mediaSelectorType === 'hero') {
                        setPreexistingImage(file.url.replace('/storage/', '')); // Store relative path
                        setFeaturedImage(null);
                    } else {
                        setPreexistingAttachments(prev => [...prev, { name: file.name, path: file.url.replace('/storage/', ''), url: file.url }]);
                    }
                }}
                acceptedType={mediaSelectorType === 'hero' ? 'photo' : 'all'}
            />
        </div>
    );
}
