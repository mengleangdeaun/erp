import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconSend, IconDeviceFloppy, IconPhoto, IconPaperclip, IconX, IconFile, IconWorld, IconBuilding, IconHierarchy, IconUsers } from '@tabler/icons-react';
import { IconInfoCircle, IconCircleCheck, IconAlertTriangle, IconAlertOctagon } from '@tabler/icons-react';
import dayjs from 'dayjs';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { DatePicker } from '../../../components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import SearchableMultiSelect from '../../../components/ui/SearchableMultiSelect';
import { CustomQuillEditor } from '../../../components/ui/custom-quill-editor';

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
    send_telegram: boolean;
}

const defaultForm: FormData = {
    title: '', type: 'info', short_description: '', content: '',
    start_date: '', end_date: '', is_featured: false,
    targeting_type: 'all', target_ids: [], published_at: '', status: 'draft',
    send_telegram: false,
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
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700/60 p-5 space-y-4">
                    {[80, 60, 200].map((h, i) => (
                        <div key={i} className={`h-${i === 2 ? '48' : '10'} bg-gray-100 dark:bg-gray-800 rounded-lg`} style={{ height: h === 200 ? 192 : h === 80 ? 40 : 40 }} />
                    ))}
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700/60 p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                    </div>
                    <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                </div>
            </div>
            <div className="space-y-5">
                {[2, 4, 2].map((rows, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700/60 p-5 space-y-3">
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
                send_telegram: false,
            });
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
            // Append basic fields
            Object.entries({ ...form, status }).forEach(([key, value]) => {
                if (key === 'target_ids') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            });

            // Append files
            if (featuredImage) {
                formData.append('featured_image', featuredImage);
            }
            attachments.forEach((file, i) => {
                formData.append(`attachments[${i}]`, file);
            });

            const url    = isEdit ? `/api/hr/announcements/${id}` : '/api/hr/announcements';
            
            // We use POST with _method=PUT to overcome PHP Multipart limitation for PUT
            const res    = await fetch(url, { 
                method: 'POST', 
                headers: authHeaders, 
                credentials: 'include', 
                body: formData 
            });

            if (isEdit) {
                formData.append('_method', 'PUT');
            }

            const actualRes = await fetch(url, { 
                method: 'POST', 
                headers: authHeaders, 
                credentials: 'include', 
                body: formData 
            });

            const data   = await actualRes.json();
            if (actualRes.ok) {
                toast.success(status === 'published' ? 'Announcement published!' : 'Saved as draft');
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
        <div>
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                >
                    <IconArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-white">
                        {isEdit ? 'Edit Announcement' : 'New Announcement'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isEdit ? 'Update announcement details' : 'Compose and distribute a company announcement'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ── Left: Main Content ──────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    <Card title="Content">
                        <div>
                            <Label required>Title</Label>
                            <Input
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                                placeholder="Announcement title..."
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label>Short Description</Label>
                            <textarea
                                value={form.short_description}
                                onChange={e => set('short_description', e.target.value)}
                                rows={2}
                                placeholder="Brief summary shown in notification previews..."
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                            />
                        </div>
                        <div>
                            <Label>Full Content</Label>
                            <CustomQuillEditor
                                variant='default'
                                value={form.content}
                                onChange={v => set('content', v)}
                                placeholder="Write the full announcement here..."
                            />
                        </div>
                    </Card>

                    <Card title="Schedule">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date</Label>
                                <DatePicker
                                    value={toDate(form.start_date)}
                                    onChange={d => set('start_date', toStr(d))}
                                    placeholder="Pick start date"
                                />
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <DatePicker
                                    value={toDate(form.end_date)}
                                    onChange={d => set('end_date', toStr(d))}
                                    placeholder="Pick end date"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Publish At</Label>
                            <DatePicker
                                value={toDate(form.published_at)}
                                onChange={d => set('published_at', toStr(d))}
                                placeholder="Pick publish date"
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                Leave empty to publish immediately when you click "Publish Now".
                            </p>
                        </div>
                    </Card>
                </div>

                {/* ── Right: Sidebar ──────────────────────────────────────────────── */}
                <div className="space-y-5">

                    <Card>
                        <Button onClick={() => handleSubmit('published')} disabled={saving} className="w-full gap-2">
                            <IconSend className="w-4 h-4" />
                            {saving ? 'Publishing...' : 'Publish Now'}
                        </Button>
                        <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={saving} className="w-full gap-2">
                            <IconDeviceFloppy className="w-4 h-4" />
                            Save as Draft
                        </Button>
                    </Card>

                    <Card title="Settings">
                        <div>
                            <Label>Type</Label>
                            <Select value={form.type} onValueChange={v => set('type', v)}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">
                                    <IconInfoCircle className="inline mr-2 h-4 w-4" /> Info
                                    </SelectItem>
                                    <SelectItem value="success">
                                    <IconCircleCheck className="inline mr-2 h-4 w-4" /> Success
                                    </SelectItem>
                                    <SelectItem value="warning">
                                    <IconAlertTriangle className="inline mr-2 h-4 w-4" /> Warning
                                    </SelectItem>
                                    <SelectItem value="danger">
                                    <IconAlertOctagon className="inline mr-2 h-4 w-4" /> Danger
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Toggle checked={form.is_featured} onChange={v => set('is_featured', v)}
                            label="Featured Announcement" sublabel="Shows as popup on employee first app open" />
                        
                        {form.is_featured && (
                            <div className="pt-2 animate-in zip-in-95 duration-200">
                                <Label>Featured Image</Label>
                                <div className="relative group">
                                    <div className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center overflow-hidden transition-colors group-hover:border-primary/50">
                                        {(featuredImage || preexistingImage) ? (
                                            <>
                                                <img 
                                                    src={featuredImage ? URL.createObjectURL(featuredImage) : `/storage/${preexistingImage}`} 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="secondary" size="sm" onClick={() => { setFeaturedImage(null); setPreexistingImage(null); }}>
                                                        <IconX className="w-4 h-4 mr-2" /> Change
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <IconPhoto className="w-8 h-8 text-gray-300 mb-2" />
                                                <p className="text-[10px] font-bold text-gray-400">UPLOAD IMAGE (16:9)</p>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={e => setFeaturedImage(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Toggle checked={form.send_telegram} onChange={v => set('send_telegram', v)}
                            label="Send to Telegram" sublabel="Broadcasts to linked group or topic" activeColor="bg-blue-500" />
                    </Card>

                    <Card title="Attachments">
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {preexistingAttachments.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-semibold">
                                        <IconFile className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="truncate max-w-[100px]">{file.name}</span>
                                    </div>
                                ))}
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold">
                                        <IconFile className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[100px]">{file.name}</span>
                                        <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                                            <IconX className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors">
                                <IconPaperclip className="w-6 h-6 text-gray-300 mb-1" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add Attachments</span>
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
                    </Card>

                    <Card title="Targeting">
                        <div>
                            <Label>Target Audience</Label>
                            <Select value={form.targeting_type} onValueChange={v => { 
                                set('targeting_type', v); 
                                set('target_ids', []);
                                setFilterBranchId('all');
                                setFilterDeptId('all');
                            }}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
      <SelectItem value="all">
        <IconWorld className="inline mr-2 h-4 w-4" /> All Employees
      </SelectItem>
      <SelectItem value="branch">
        <IconBuilding className="inline mr-2 h-4 w-4" /> Specific Branch
      </SelectItem>
      <SelectItem value="department">
        <IconHierarchy className="inline mr-2 h-4 w-4" /> Specific Department
      </SelectItem>
      <SelectItem value="employee">
        <IconUsers className="inline mr-2 h-4 w-4" /> Specific Employees
      </SelectItem>
    </SelectContent>
                            </Select>
                        </div>

                        {/* Hierarchical Filters */}
                        {form.targeting_type === 'department' && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <Label>Filter by Branch</Label>
                                <Select value={filterBranchId} onValueChange={setFilterBranchId}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any Branch</SelectItem>
                                        {dropdowns.branches.map(b => (
                                            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {form.targeting_type === 'employee' && (
                            <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label>Branch</Label>
                                        <Select value={filterBranchId} onValueChange={v => { setFilterBranchId(v); setFilterDeptId('all'); }}>
                                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any</SelectItem>
                                                {dropdowns.branches.map(b => (
                                                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Department</Label>
                                        <Select value={filterDeptId} onValueChange={setFilterDeptId}>
                                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any</SelectItem>
                                                {dropdowns.departments
                                                    .filter(d => filterBranchId === 'all' || (d.branches && d.branches.some((b: any) => String(b.id) === filterBranchId)))
                                                    .map(d => (
                                                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {form.targeting_type !== 'all' && (
                            <div>
                                <Label>
                                    Select {form.targeting_type === 'branch' ? 'Branches' : form.targeting_type === 'department' ? 'Departments' : 'Employees'}
                                </Label>
                                {targetOptions().length === 0 ? (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
                                        {`No ${form.targeting_type}s available. Make sure they are added in the system.`}
                                    </p>
                                ) : (
                                    <SearchableMultiSelect
                                        key={form.targeting_type}
                                        options={targetOptions()}
                                        allOptions={allTargetOptions()}
                                        value={form.target_ids}
                                        onChange={v => set('target_ids', v)}
                                        placeholder={`Select ${form.targeting_type}...`}
                                        searchPlaceholder="Search..."
                                    />
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
