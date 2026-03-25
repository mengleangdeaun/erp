import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { DatePicker } from '../../../components/ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import MediaSelector, { MediaFile } from '../../../components/MediaSelector';
import { format } from 'date-fns';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { useTranslation } from 'react-i18next';

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
};

interface EmployeeFormProps {
    employeeId?: number; // if provided → edit mode
}

const SECTIONS_KEYS = ['basic_info_tab', 'employment_details_tab', 'contact_info_tab', 'banking_info_tab', 'documents_tab'];

const initialFormState = {
    // Basic
    full_name: '',
    employee_id: '',
    employee_code: '',
    email: '',
    password: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    // Employment
    branch_id: '',
    department_id: '',
    designation_id: '',
    line_manager_id: '',
    date_of_joining: '',
    employment_type: '',
    is_active: true,
    working_shift_id: '',
    attendance_policy_id: '',
    // Contact
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    // Banking
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    tax_payer_id: '',
    base_salary: '',
};

const EmployeeForm = ({ employeeId }: EmployeeFormProps) => {
    const { t } = useTranslation();
    const isEdit = Boolean(employeeId);
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(0);
    const [formData, setFormData] = useState(initialFormState);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [profileImageFile, setProfileImageFile] = useState<File | string | null>(null);
    const [isProfileImageSelectorOpen, setIsProfileImageSelectorOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    // Refs for dropdown data
    const [branches, setBranches] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [designations, setDesignations] = useState<any[]>([]);
    const [documentTypes, setDocumentTypes] = useState<any[]>([]);
    const [workingShifts, setWorkingShifts] = useState<any[]>([]);
    const [attendancePolicies, setAttendancePolicies] = useState<any[]>([]);
    const [allEmployees, setAllEmployees] = useState<any[]>([]);

    const [loadingDropdowns, setLoadingDropdowns] = useState({
        branches: true,
        departments: true,
        designations: true,
        documentTypes: true,
        workingShifts: true,
        attendancePolicies: true,
        employees: true,
    });

    // Documents state
    const [documents, setDocuments] = useState<any[]>([]);
    const [pendingDocuments, setPendingDocuments] = useState<any[]>([]); // For "Create" mode
    const [docTypeId, setDocTypeId] = useState('');
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);

    // New Document Type State
    const [isDocTypeDialogOpen, setIsDocTypeDialogOpen] = useState(false);
    const [newDocTypeName, setNewDocTypeName] = useState('');
    const [newDocTypeRequired, setNewDocTypeRequired] = useState(true);
    const [isSavingDocType, setIsSavingDocType] = useState(false);

    const headers = {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
    };

    // Load dropdown data
    useEffect(() => {
        const abortController = new AbortController();

        const load = (url: string, setter: (d: any[]) => void, key: string) => {
            fetch(`${url}?compact=true`, {
                signal: abortController.signal,
                headers: { ...headers, 'Content-Type': 'application/json' },
                credentials: 'include'
            })
                .then(r => r.json())
                .then(d => {
                    if (Array.isArray(d)) setter(d);
                    setLoadingDropdowns(prev => ({ ...prev, [key]: false }));
                })
                .catch(err => {
                    if (err.name !== 'AbortError') {
                        console.error(err);
                        setLoadingDropdowns(prev => ({ ...prev, [key]: false }));
                    }
                });
        };

        load('/api/hr/branches', setBranches, 'branches');
        load('/api/hr/departments', setDepartments, 'departments');
        load('/api/hr/designations', setDesignations, 'designations');
        load('/api/hr/document-types', setDocumentTypes, 'documentTypes');
        load('/api/attendance/working-shifts', setWorkingShifts, 'workingShifts');
        load('/api/attendance/attendance-policies', setAttendancePolicies, 'attendancePolicies');
        load('/api/hr/employees', setAllEmployees, 'employees');

        return () => {
            abortController.abort();
        };
    }, []);

    // Load employee data in edit mode
    useEffect(() => {
        if (!isEdit) return;

        const abortController = new AbortController();

        fetch(`/api/hr/employees/${employeeId}`, {
            signal: abortController.signal,
            headers: { ...headers, 'Content-Type': 'application/json' },
            credentials: 'include',
        })
            .then(r => { if (r.status === 401) { window.location.href = '/auth/login'; return null; } return r.json(); })
            .then(data => {
                if (!data) return;
                setFormData({
                    ...initialFormState,
                    full_name: data.full_name || '',
                    employee_id: data.employee_id || '',
                    employee_code: data.employee_code || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    date_of_birth: data.date_of_birth ? data.date_of_birth.substring(0, 10) : '',
                    gender: data.gender || '',
                    branch_id: data.branch_id ? String(data.branch_id) : '',
                    department_id: data.department_id ? String(data.department_id) : '',
                    designation_id: data.designation_id ? String(data.designation_id) : '',
                    line_manager_id: data.line_manager_id ? String(data.line_manager_id) : '',
                    date_of_joining: data.date_of_joining ? data.date_of_joining.substring(0, 10) : '',
                    employment_type: data.employment_type || '',
                    is_active: !!data.is_active,
                    working_shift_id: data.working_shift_id ? String(data.working_shift_id) : '',
                    attendance_policy_id: data.attendance_policy_id ? String(data.attendance_policy_id) : '',
                    address_line_1: data.address_line_1 || '',
                    address_line_2: data.address_line_2 || '',
                    city: data.city || '',
                    state: data.state || '',
                    country: data.country || '',
                    postal_code: data.postal_code || '',
                    emergency_contact_name: data.emergency_contact_name || '',
                    emergency_contact_relationship: data.emergency_contact_relationship || '',
                    emergency_contact_phone: data.emergency_contact_phone || '',
                    bank_name: data.bank_name || '',
                    account_holder_name: data.account_holder_name || '',
                    account_number: data.account_number || '',
                    tax_payer_id: data.tax_payer_id || '',
                    base_salary: data.base_salary ? String(data.base_salary) : '',
                });
                if (data.profile_image) {
                    setProfileImagePreview(data.profile_image.startsWith('http') ? data.profile_image : `/storage/${data.profile_image}`);
                }
                if (data.documents) setDocuments(data.documents);
                setLoading(false);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    setLoading(false);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [employeeId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelect = (value: any, name: string) => {
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'branch_id') {
                next.department_id = '';
                next.designation_id = '';
            } else if (name === 'department_id') {
                next.designation_id = '';
            }
            return next;
        });
    };

    const handleSelectProfileImage = (file: MediaFile) => {
        setProfileImageFile(file.url);
        setProfileImagePreview(file.url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            await fetch('/sanctum/csrf-cookie');

            if (isEdit) {
                // Keep FormData for Edit (legacy support and file uploads)
                const body = new FormData();
                Object.entries(formData).forEach(([key, val]) => {
                    if (val !== '') {
                        if (typeof val === 'boolean') {
                            body.append(key, String(val));
                        } else {
                            body.append(key, val as string);
                        }
                    }
                });
                if (profileImageFile) body.append('profile_image', profileImageFile);
                body.append('_method', 'PUT');

                const response = await fetch(`/api/hr/employees/${employeeId}`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                    credentials: 'include',
                    body,
                });

                if (response.ok) {
                    toast.success(t('success_update_employee'));
                    navigate('/hr/employees');
                } else {
                    const data = await response.json();
                    toast.error(data.errors ? Object.values(data.errors).flat().join(', ') : data.message || t('error_occurred'));
                }
            } else {
                // Use JSON for Create to easily handle nested documents
                const payload = {
                    ...formData,
                    profile_image: typeof profileImageFile === 'string' ? profileImageFile : undefined,
                    documents: pendingDocuments.map(d => ({
                        document_type_id: d.document_type_id,
                        media_url: d.file_path,
                        media_name: d.original_name
                    }))
                };

                const response = await fetch('/api/hr/employees', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    toast.success(t('success_create_employee'));
                    navigate('/hr/employees');
                } else {
                    const data = await response.json();
                    toast.error(data.errors ? Object.values(data.errors).flat().join(', ') : data.message || t('error_occurred'));
                }
            }
        } catch (err) {
            console.error(err);
            toast.error(t('error_occurred'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectDocument = async (file: MediaFile) => {
        if (!docTypeId) {
            toast.error(t('select_type_first'));
            return;
        }

        if (!isEdit) {
            // "Create" mode: Add to pending documents locally
            const typeName = documentTypes.find(t => String(t.id) === docTypeId)?.name || 'Unknown';
            const newDoc = {
                id: Date.now(), // temporary ID
                document_type_id: docTypeId,
                document_type: { name: typeName },
                file_path: file.url,
                original_name: file.name,
                is_pending: true
            };
            setPendingDocuments(prev => [...prev, newDoc]);
            setDocTypeId('');
            toast.success(t('doc_added_to_list'));
            return;
        }

        // "Edit" mode: Immediate upload
        setIsUploadingDoc(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(`/api/hr/employees/${employeeId}/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    document_type_id: docTypeId,
                    media_url: file.url,
                    media_name: file.name
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(t('doc_linked_success'));
                setDocuments(prev => [...prev, data]);
                setDocTypeId('');
            } else {
                toast.error(data.message || t('doc_link_failed'));
            }
        } catch (err) { toast.error(t('error_occurred')); }
        finally { setIsUploadingDoc(false); }
    };

    const handleDeleteDocument = async (docId: any) => {
        if (!confirm(t('delete_doc_confirm'))) return;

        // If it's a pending document (creation mode)
        if (pendingDocuments.some(d => d.id === docId)) {
            setPendingDocuments(prev => prev.filter(d => d.id !== docId));
            toast.success(t('doc_removed_from_list'));
            return;
        }

        // Persistent document
        try {
            const res = await fetch(`/api/hr/employees/${employeeId}/documents/${docId}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (res.ok) {
                toast.success(t('doc_deleted'));
                setDocuments(prev => prev.filter(d => d.id !== docId));
            } else {
                toast.error(t('failed_delete_doc'));
            }
        } catch { toast.error(t('error_occurred')); }
    };

    const handleCreateDocType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDocTypeName.trim()) return;
        setIsSavingDocType(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch('/api/hr/document-types', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: newDocTypeName,
                    description: '',
                    is_required: newDocTypeRequired,
                    status: 'active'
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(t('doc_type_created'));
                setDocumentTypes(prev => [...prev, data]);
                setDocTypeId(String(data.id));
                setIsDocTypeDialogOpen(false);
                setNewDocTypeName('');
                setNewDocTypeRequired(true);
            } else {
                toast.error(data.message || t('failed_create_doc_type'));
            }
        } catch (err) {
            toast.error(t('error_occurred'));
        } finally {
            setIsSavingDocType(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-40 text-sm text-gray-500">{t('loading_employee_data')}</div>;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold">{isEdit ? t('edit_employee') : t('add_new_employee')}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{t('fill_info_cross_sections')}</p>
                </div>
                <Button className='flex items-center gap-2' variant="outline" type="button" onClick={() => navigate('/hr/employees')}>
                    <IconArrowNarrowLeft size={16} /> {t('back_btn_label')}
                </Button>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1 flex-wrap mb-6 border-b border-gray-200 dark:border-gray-700">
                {SECTIONS_KEYS.map((key, i) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActiveSection(i)}
                        className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${activeSection === i
                            ? 'border-b-2 border-primary text-primary bg-primary/5'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {t(key)}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit}>

                {/* ─── Section 0: Basic Information ─── */}
                {activeSection === 0 && (
                    <div className="space-y-5">
                        {/* Profile image */}
                        <div className="flex items-center gap-5 mb-2">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                                {profileImagePreview ? (
                                    <img src={profileImagePreview} alt={t('profile_alt')} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-400">
                                        {formData.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={() => setIsProfileImageSelectorOpen(true)}
                                >
                                    {t('select_photo_btn')}
                                </Button>
                                <p className="text-xs text-gray-400 mt-1">{t('pick_media_library')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="full_name">{t('full_name_label')} <span className="text-danger">*</span></label>
                                <Input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleChange} required />
                            </div>
                            <div>
                                <label htmlFor="employee_id">{t('employee_id_label')} <span className="text-danger">*</span></label>
                                <Input id="employee_id" name="employee_id" type="text" value={formData.employee_id} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="employee_code">{t('employee_code_label')}</label>
                                <Input id="employee_code" name="employee_code" type="text" value={formData.employee_code} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="email">{t('email_label')} <span className="text-danger">*</span></label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="password">
                                    {t('password_label')} {isEdit ? <span className="text-xs text-gray-400">{t('leave_blank_password')}</span> : <span className="text-danger">*</span>}
                                </label>
                                <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required={!isEdit} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="phone">{t('phone_label')}</label>
                                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div>
                                <label>{t('dob_label')}</label>
                                <DatePicker
                                    value={formData.date_of_birth}
                                    onChange={(dt) => handleSelect(dt ? format(dt, 'yyyy-MM-dd') : '', 'date_of_birth')}
                                    placeholder={t('select_dob_placeholder')}
                                />
                            </div>
                            <div>
                                <label htmlFor="gender">{t('gender_label')}</label>
                                <Select onValueChange={v => handleSelect(v, 'gender')} value={formData.gender}>
                                    <SelectTrigger><SelectValue placeholder={t('select_gender_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">{t('male')}</SelectItem>
                                        <SelectItem value="female">{t('female')}</SelectItem>
                                        <SelectItem value="other">{t('other')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Section 1: Employment Details ─── */}
                {activeSection === 1 && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label>{t('branch_label')}</label>
                                <Select onValueChange={v => handleSelect(v, 'branch_id')} value={formData.branch_id}>
                                    <SelectTrigger><SelectValue placeholder={t('select_branch_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.branches ? (
                                            <SelectItem value="loading" disabled>{t('loading_dots')}</SelectItem>
                                        ) : branches.length === 0 ? (
                                            <SelectItem value="empty" disabled>{t('no_branches_available')}</SelectItem>
                                        ) : (
                                            branches.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)
                                        )}
                                    </SelectContent>
                                </Select>
                                     <div>
                                <label>{t('department_label')}</label>
                                <Select onValueChange={v => handleSelect(v, 'department_id')} value={formData.department_id}>
                                    <SelectTrigger><SelectValue placeholder={t('select_department_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.departments ? (
                                            <SelectItem value="loading" disabled>{t('loading_dots')}</SelectItem>
                                        ) : (() => {
                                            const filteredDepartments = formData.branch_id
                                                ? departments.filter((d: any) =>
                                                    d.branches?.some((branch: any) => String(branch.id) === formData.branch_id)
                                                )
                                                : departments;
 
                                            if (filteredDepartments.length === 0) {
                                                return <SelectItem value="empty" disabled>{t('no_departments_available')}</SelectItem>;
                                            }
                                            return filteredDepartments.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>);
                                        })()}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label>{t('designation_label')}</label>
                                <Select onValueChange={v => handleSelect(v, 'designation_id')} value={formData.designation_id}>
                                    <SelectTrigger><SelectValue placeholder={t('select_designation_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.designations ? (
                                            <SelectItem value="loading" disabled>{t('loading_dots')}</SelectItem>
                                        ) : (() => {
                                            const filteredDesignations = formData.department_id
                                                ? designations.filter((d: any) =>
                                                    d.departments?.some((dept: any) => String(dept.id) === formData.department_id)
                                                )
                                                : designations;
 
                                            if (filteredDesignations.length === 0) {
                                                return <SelectItem value="empty" disabled>{t('no_designations_available')}</SelectItem>;
                                            }
                                            return filteredDesignations.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>);
                                        })()}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>{t('line_manager_label')}</label>
                                <SearchableSelect
                                    options={allEmployees
                                        .filter(e => !isEdit || String(e.id) !== String(employeeId))
                                        .map(e => ({ value: String(e.id), label: `${e.full_name} (${e.employee_id})` }))
                                    }
                                    value={formData.line_manager_id}
                                    onChange={(val) => handleSelect(String(val), 'line_manager_id')}
                                    placeholder={t('select_manager_placeholder')}
                                />
                            </div>
                        </div>
                   </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label>{t('doj_label')}</label>
                                <DatePicker
                                    value={formData.date_of_joining}
                                    onChange={(dt) => handleSelect(dt ? format(dt, 'yyyy-MM-dd') : '', 'date_of_joining')}
                                    placeholder={t('select_doj_placeholder')}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label>{t('employment_type_label')}</label>
                                <Select onValueChange={v => handleSelect(v, 'employment_type')} value={formData.employment_type}>
                                    <SelectTrigger><SelectValue placeholder={t('select_type_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full_time">{t('full_time')}</SelectItem>
                                        <SelectItem value="part_time">{t('part_time')}</SelectItem>
                                        <SelectItem value="contract">{t('contract')}</SelectItem>
                                        <SelectItem value="intern">{t('intern')}</SelectItem>
                                        <SelectItem value="freelance">{t('freelance')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>{t('active_status_label')}</label>
                                <Select onValueChange={v => handleSelect(v === 'true' ? true : false, 'is_active')} value={String(formData.is_active)}>
                                    <SelectTrigger><SelectValue placeholder={t('select_status_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">{t('active')}</SelectItem>
                                        <SelectItem value="false">{t('inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label>{t('working_shift_label')}</label>
                                <Select onValueChange={v => handleSelect(v, 'working_shift_id')} value={formData.working_shift_id}>
                                    <SelectTrigger><SelectValue placeholder={t('select_shift_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.workingShifts ? (
                                            <SelectItem value="loading" disabled>{t('loading_dots')}</SelectItem>
                                        ) : workingShifts.length === 0 ? (
                                            <SelectItem value="empty" disabled>{t('no_shifts_available')}</SelectItem>
                                        ) : (
                                            workingShifts.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>{t('attendance_policy_label')}</label>
                                <Select onValueChange={v => handleSelect(v, 'attendance_policy_id')} value={formData.attendance_policy_id}>
                                    <SelectTrigger><SelectValue placeholder={t('select_policy_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.attendancePolicies ? (
                                            <SelectItem value="loading" disabled>{t('loading_dots')}</SelectItem>
                                        ) : attendancePolicies.length === 0 ? (
                                            <SelectItem value="empty" disabled>{t('no_policies_available')}</SelectItem>
                                        ) : (
                                            attendancePolicies.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Section 2: Contact Information ─── */}
                {activeSection === 2 && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="address_line_1">{t('address_line_1_label')}</label>
                                <Input id="address_line_1" name="address_line_1" type="text" value={formData.address_line_1} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="address_line_2">{t('address_line_2_label')}</label>
                                <Input id="address_line_2" name="address_line_2" type="text" value={formData.address_line_2} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="city">{t('city_label')}</label>
                                <Input id="city" name="city" type="text" value={formData.city} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="state">{t('state_province_label')}</label>
                                <Input id="state" name="state" type="text" value={formData.state} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="country">{t('country_label')}</label>
                                <Input id="country" name="country" type="text" value={formData.country} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="postal_code">{t('postal_code_label')}</label>
                                <Input id="postal_code" name="postal_code" type="text" value={formData.postal_code} onChange={handleChange} />
                            </div>
                        </div>

                        <hr className="border-gray-200 dark:border-gray-700" />
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t('emergency_contact_title')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="emergency_contact_name">{t('contact_name_label')}</label>
                                <Input id="emergency_contact_name" name="emergency_contact_name" type="text" value={formData.emergency_contact_name} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="emergency_contact_relationship">{t('relationship_label')}</label>
                                <Input id="emergency_contact_relationship" name="emergency_contact_relationship" type="text" placeholder={t('relationship_placeholder')} value={formData.emergency_contact_relationship} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="emergency_contact_phone">{t('phone_label')}</label>
                                <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" value={formData.emergency_contact_phone} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Section 3: Banking Information ─── */}
                {activeSection === 3 && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="bank_name">{t('bank_name_label')}</label>
                                <Input id="bank_name" name="bank_name" type="text" value={formData.bank_name} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="account_holder_name">{t('account_holder_label')}</label>
                                <Input id="account_holder_name" name="account_holder_name" type="text" value={formData.account_holder_name} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="account_number">{t('account_number_label')}</label>
                                <Input id="account_number" name="account_number" type="text" value={formData.account_number} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="tax_payer_id">{t('tax_id_label')}</label>
                                <Input id="tax_payer_id" name="tax_payer_id" type="text" value={formData.tax_payer_id} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="base_salary">{t('base_salary_label')}</label>
                                <Input id="base_salary" name="base_salary" type="number" min="0" step="0.01" value={formData.base_salary} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Section 4: Documents ─── */}
                {activeSection === 4 && (
                    <div className="space-y-5">
                        {/* Upload new document */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="mb-0">{t('doc_type_label')}</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsDocTypeDialogOpen(true)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        {t('create_new_link')}
                                    </button>
                                </div>
                                <Select onValueChange={v => setDocTypeId(v)} value={docTypeId}>
                                    <SelectTrigger><SelectValue placeholder={t('select_type_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.documentTypes ? (
                                            <SelectItem value="loading" disabled>{t('loading_dots')}</SelectItem>
                                        ) : documentTypes.length === 0 ? (
                                            <SelectItem value="empty" disabled>{t('no_types_found')}</SelectItem>
                                        ) : (
                                            documentTypes.map((dt: any) => (
                                                <SelectItem key={dt.id} value={String(dt.id)}>{dt.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block mb-1.5 text-sm font-medium">{t('file_upload')}</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsMediaSelectorOpen(true)}
                                    className="w-full h-10 justify-start text-left font-normal text-muted-foreground"
                                >
                                    {t('browse_media_library')}
                                </Button>
                            </div>
                            <div>
                                <Button
                                    type="button"
                                    onClick={() => setIsMediaSelectorOpen(true)}
                                    disabled={isUploadingDoc || !docTypeId}
                                    className="w-full h-10"
                                >
                                    {isUploadingDoc ? t('linking_dots') : t('select_file_btn')}
                                </Button>
                            </div>
                        </div>

                        {/* Documents list */}
                        {([...documents, ...pendingDocuments]).length > 0 ? (
                            <div className="table-responsive">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>{t('document_type')}</th>
                                            <th>{t('file_name')}</th>
                                            <th>{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {([...documents, ...pendingDocuments]).map((doc: any, i: number) => (
                                            <tr key={doc.id}>
                                                <td>{i + 1}</td>
                                                <td>{doc.document_type?.name || '—'}</td>
                                                <td>
                                                    <a
                                                        href={doc.file_path?.startsWith('http') ? doc.file_path : `/storage/${doc.file_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-primary underline text-sm"
                                                    >
                                                        {doc.original_name}
                                                    </a>
                                                </td>
                                                <td>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                    >
                                                        {t('delete_btn_label')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-6">{t('no_documents_uploaded')}</p>
                        )}
                    </div>
                )}

                {/* Navigation & Submit */}
                <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        {activeSection > 0 && (
                            <Button className='flex items-center gap-2' variant="outline" type="button" onClick={() => setActiveSection(s => s - 1)}>
                                <IconArrowNarrowLeft size={16} /> {t('previous_btn_label')}
                            </Button>
                        )}
                        {activeSection < SECTIONS_KEYS.length - 1 && (
                            <Button className='flex items-center gap-2' type="button" onClick={() => setActiveSection(s => s + 1)}>
                                {t('next_btn_label')} <IconArrowNarrowRight size={16} />
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="" type="button" onClick={() => navigate('/hr/employees')}>
                            {t('cancel_btn_label')}
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? t('saving_dots') : isEdit ? t('edit_employee') : t('add_new_employee')}
                        </Button>
                    </div>
                </div>
            </form>

            <Dialog open={isDocTypeDialogOpen} onOpenChange={setIsDocTypeDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('create_doc_type_title')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateDocType} className="space-y-4 pt-4">
                        <div>
                            <label htmlFor="newDocTypeName">{t('name_label')} <span className="text-danger">*</span></label>
                            <Input
                                id="newDocTypeName"
                                type="text"
                                value={newDocTypeName}
                                onChange={e => setNewDocTypeName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                id="newDocTypeRequired"
                                type="checkbox"
                                className="form-checkbox"
                                checked={newDocTypeRequired}
                                onChange={e => setNewDocTypeRequired(e.target.checked)}
                            />
                            <label htmlFor="newDocTypeRequired" className="mb-0 cursor-pointer">{t('is_required_label')}</label>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" type="button" onClick={() => setIsDocTypeDialogOpen(false)}>{t('cancel_btn_label')}</Button>
                            <Button type="submit" disabled={isSavingDocType}>
                                {isSavingDocType ? t('saving_dots') : t('create_btn_label')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <MediaSelector
                open={isMediaSelectorOpen}
                onOpenChange={setIsMediaSelectorOpen}
                onSelect={handleSelectDocument}
                acceptedType="all"
            />

            <MediaSelector
                open={isProfileImageSelectorOpen}
                onOpenChange={setIsProfileImageSelectorOpen}
                onSelect={handleSelectProfileImage}
                acceptedType="photo"
            />
        </div>
    );
};

export default EmployeeForm;
