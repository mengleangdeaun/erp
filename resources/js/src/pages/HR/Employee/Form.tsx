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

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
};

interface EmployeeFormProps {
    employeeId?: number; // if provided → edit mode
}

const SECTIONS = ['Basic Information', 'Employment Details', 'Contact Information', 'Banking Information', 'Documents'];

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

    const handleSelect = (value: string, name: string) => {
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
                    if (val !== '') body.append(key, val);
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
                    toast.success('Employee updated successfully');
                    navigate('/hr/employees');
                } else {
                    const data = await response.json();
                    toast.error(data.errors ? Object.values(data.errors).flat().join(', ') : data.message || 'Error');
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
                    toast.success('Employee created successfully');
                    navigate('/hr/employees');
                } else {
                    const data = await response.json();
                    toast.error(data.errors ? Object.values(data.errors).flat().join(', ') : data.message || 'Error');
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectDocument = async (file: MediaFile) => {
        if (!docTypeId) {
            toast.error('Please select a Document Type first');
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
            toast.success('Document added to list');
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
                toast.success('Document linked successfully');
                setDocuments(prev => [...prev, data]);
                setDocTypeId('');
            } else {
                toast.error(data.message || 'Linking failed');
            }
        } catch (err) { toast.error('An error occurred'); }
        finally { setIsUploadingDoc(false); }
    };

    const handleDeleteDocument = async (docId: any) => {
        if (!confirm('Delete this document?')) return;

        // If it's a pending document (creation mode)
        if (pendingDocuments.some(d => d.id === docId)) {
            setPendingDocuments(prev => prev.filter(d => d.id !== docId));
            toast.success('Document removed from list');
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
                toast.success('Document deleted');
                setDocuments(prev => prev.filter(d => d.id !== docId));
            } else {
                toast.error('Failed to delete document');
            }
        } catch { toast.error('An error occurred'); }
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
                toast.success('Document Type created');
                setDocumentTypes(prev => [...prev, data]);
                setDocTypeId(String(data.id));
                setIsDocTypeDialogOpen(false);
                setNewDocTypeName('');
                setNewDocTypeRequired(true);
            } else {
                toast.error(data.message || 'Failed to create Document Type');
            }
        } catch (err) {
            toast.error('An error occurred');
        } finally {
            setIsSavingDocType(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-40 text-sm text-gray-500">Loading employee data...</div>;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Fill in the information across all sections</p>
                </div>
                <Button className='flex items-center gap-2' variant="outline" type="button" onClick={() => navigate('/hr/employees')}>
                    <IconArrowNarrowLeft size={16} /> Back
                </Button>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1 flex-wrap mb-6 border-b border-gray-200 dark:border-gray-700">
                {SECTIONS.map((s, i) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setActiveSection(i)}
                        className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${activeSection === i
                            ? 'border-b-2 border-primary text-primary bg-primary/5'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {s}
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
                                    <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
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
                                    Select Photo
                                </Button>
                                <p className="text-xs text-gray-400 mt-1">Pick from Media Library</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="full_name">Full Name <span className="text-danger">*</span></label>
                                <Input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleChange} required />
                            </div>
                            <div>
                                <label htmlFor="employee_id">Employee ID <span className="text-danger">*</span></label>
                                <Input id="employee_id" name="employee_id" type="text" value={formData.employee_id} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="employee_code">Employee Code</label>
                                <Input id="employee_code" name="employee_code" type="text" value={formData.employee_code} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="email">Email <span className="text-danger">*</span></label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="password">
                                    Password {isEdit ? <span className="text-xs text-gray-400">(leave blank to keep current)</span> : <span className="text-danger">*</span>}
                                </label>
                                <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required={!isEdit} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="phone">Phone Number</label>
                                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div>
                                <label>Date of Birth</label>
                                <DatePicker
                                    value={formData.date_of_birth}
                                    onChange={(dt) => handleSelect(dt ? format(dt, 'yyyy-MM-dd') : '', 'date_of_birth')}
                                    placeholder="Select Date of Birth"
                                />
                            </div>
                            <div>
                                <label htmlFor="gender">Gender</label>
                                <Select onValueChange={v => handleSelect(v, 'gender')} value={formData.gender}>
                                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
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
                                <label>Branch</label>
                                <Select onValueChange={v => handleSelect(v, 'branch_id')} value={formData.branch_id}>
                                    <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.branches ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : branches.length === 0 ? (
                                            <SelectItem value="empty" disabled>No branches available</SelectItem>
                                        ) : (
                                            branches.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>Department</label>
                                <Select onValueChange={v => handleSelect(v, 'department_id')} value={formData.department_id}>
                                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.departments ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : (() => {
                                            const filteredDepartments = formData.branch_id
                                                ? departments.filter((d: any) =>
                                                    d.branches?.some((branch: any) => String(branch.id) === formData.branch_id)
                                                )
                                                : departments;

                                            if (filteredDepartments.length === 0) {
                                                return <SelectItem value="empty" disabled>No departments available</SelectItem>;
                                            }
                                            return filteredDepartments.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>);
                                        })()}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label>Designation</label>
                                <Select onValueChange={v => handleSelect(v, 'designation_id')} value={formData.designation_id}>
                                    <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.designations ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : (() => {
                                            const filteredDesignations = formData.department_id
                                                ? designations.filter((d: any) =>
                                                    d.departments?.some((dept: any) => String(dept.id) === formData.department_id)
                                                )
                                                : designations;

                                            if (filteredDesignations.length === 0) {
                                                return <SelectItem value="empty" disabled>No designations available</SelectItem>;
                                            }
                                            return filteredDesignations.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>);
                                        })()}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>Line Manager</label>
                                <SearchableSelect
                                    options={allEmployees
                                        .filter(e => !isEdit || String(e.id) !== String(employeeId))
                                        .map(e => ({ value: String(e.id), label: `${e.full_name} (${e.employee_id})` }))
                                    }
                                    value={formData.line_manager_id}
                                    onChange={(val) => handleSelect(String(val), 'line_manager_id')}
                                    placeholder="Select Manager"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label>Date of Joining</label>
                                <DatePicker
                                    value={formData.date_of_joining}
                                    onChange={(dt) => handleSelect(dt ? format(dt, 'yyyy-MM-dd') : '', 'date_of_joining')}
                                    placeholder="Select Date of Joining"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label>Employment Type</label>
                                <Select onValueChange={v => handleSelect(v, 'employment_type')} value={formData.employment_type}>
                                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full_time">Full Time</SelectItem>
                                        <SelectItem value="part_time">Part Time</SelectItem>
                                        <SelectItem value="contract">Contract</SelectItem>
                                        <SelectItem value="intern">Intern</SelectItem>
                                        <SelectItem value="freelance">Freelance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>Active Status</label>
                                <Select onValueChange={v => handleSelect(v === 'true' ? true : false, 'is_active')} value={String(formData.is_active)}>
                                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label>Working Shift</label>
                                <Select onValueChange={v => handleSelect(v, 'working_shift_id')} value={formData.working_shift_id}>
                                    <SelectTrigger><SelectValue placeholder="Select Shift" /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.workingShifts ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : workingShifts.length === 0 ? (
                                            <SelectItem value="empty" disabled>No shifts available</SelectItem>
                                        ) : (
                                            workingShifts.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>Attendance Policy</label>
                                <Select onValueChange={v => handleSelect(v, 'attendance_policy_id')} value={formData.attendance_policy_id}>
                                    <SelectTrigger><SelectValue placeholder="Select Policy" /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.attendancePolicies ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : attendancePolicies.length === 0 ? (
                                            <SelectItem value="empty" disabled>No policies available</SelectItem>
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
                                <label htmlFor="address_line_1">Address Line 1</label>
                                <Input id="address_line_1" name="address_line_1" type="text" value={formData.address_line_1} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="address_line_2">Address Line 2</label>
                                <Input id="address_line_2" name="address_line_2" type="text" value={formData.address_line_2} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="city">City</label>
                                <Input id="city" name="city" type="text" value={formData.city} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="state">State / Province</label>
                                <Input id="state" name="state" type="text" value={formData.state} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="country">Country</label>
                                <Input id="country" name="country" type="text" value={formData.country} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="postal_code">Postal / ZIP Code</label>
                                <Input id="postal_code" name="postal_code" type="text" value={formData.postal_code} onChange={handleChange} />
                            </div>
                        </div>

                        <hr className="border-gray-200 dark:border-gray-700" />
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Emergency Contact</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="emergency_contact_name">Contact Name</label>
                                <Input id="emergency_contact_name" name="emergency_contact_name" type="text" value={formData.emergency_contact_name} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="emergency_contact_relationship">Relationship</label>
                                <Input id="emergency_contact_relationship" name="emergency_contact_relationship" type="text" placeholder="e.g. Spouse, Parent" value={formData.emergency_contact_relationship} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="emergency_contact_phone">Phone Number</label>
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
                                <label htmlFor="bank_name">Bank Name</label>
                                <Input id="bank_name" name="bank_name" type="text" value={formData.bank_name} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="account_holder_name">Account Holder Name</label>
                                <Input id="account_holder_name" name="account_holder_name" type="text" value={formData.account_holder_name} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="account_number">Account Number</label>
                                <Input id="account_number" name="account_number" type="text" value={formData.account_number} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="tax_payer_id">Tax Payer ID</label>
                                <Input id="tax_payer_id" name="tax_payer_id" type="text" value={formData.tax_payer_id} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="base_salary">Base Salary</label>
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
                                    <label className="mb-0">Document Type</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsDocTypeDialogOpen(true)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        + Create New
                                    </button>
                                </div>
                                <Select onValueChange={v => setDocTypeId(v)} value={docTypeId}>
                                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                    <SelectContent>
                                        {loadingDropdowns.documentTypes ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : documentTypes.length === 0 ? (
                                            <SelectItem value="empty" disabled>No types found</SelectItem>
                                        ) : (
                                            documentTypes.map((dt: any) => (
                                                <SelectItem key={dt.id} value={String(dt.id)}>{dt.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block mb-1.5 text-sm font-medium">File Upload</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsMediaSelectorOpen(true)}
                                    className="w-full h-10 justify-start text-left font-normal text-muted-foreground"
                                >
                                    Browse Media Library...
                                </Button>
                            </div>
                            <div>
                                <Button
                                    type="button"
                                    onClick={() => setIsMediaSelectorOpen(true)}
                                    disabled={isUploadingDoc || !docTypeId}
                                    className="w-full h-10"
                                >
                                    {isUploadingDoc ? 'Linking...' : 'Select File'}
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
                                            <th>Document Type</th>
                                            <th>File Name</th>
                                            <th>Action</th>
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
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-6">No documents uploaded yet.</p>
                        )}
                    </div>
                )}

                {/* Navigation & Submit */}
                <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        {activeSection > 0 && (
                            <Button className='flex items-center gap-2' variant="outline" type="button" onClick={() => setActiveSection(s => s - 1)}>
                                <IconArrowNarrowLeft size={16} /> Previous
                            </Button>
                        )}
                        {activeSection < SECTIONS.length - 1 && (
                            <Button className='flex items-center gap-2' type="button" onClick={() => setActiveSection(s => s + 1)}>
                                Next <IconArrowNarrowRight size={16} />
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="" type="button" onClick={() => navigate('/hr/employees')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
                        </Button>
                    </div>
                </div>
            </form>

            <Dialog open={isDocTypeDialogOpen} onOpenChange={setIsDocTypeDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Document Type</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateDocType} className="space-y-4 pt-4">
                        <div>
                            <label htmlFor="newDocTypeName">Name <span className="text-danger">*</span></label>
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
                            <label htmlFor="newDocTypeRequired" className="mb-0 cursor-pointer">Is Required</label>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" type="button" onClick={() => setIsDocTypeDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSavingDocType}>
                                {isSavingDocType ? 'Saving...' : 'Create'}
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
