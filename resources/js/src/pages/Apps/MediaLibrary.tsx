import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import {
    IconFolder, IconFolderPlus, IconUpload, IconFile, IconFileTypePdf, IconFileTypeCsv,
    IconFileTypeXls, IconFileTypeTxt, IconTable, IconFileTypeDocx, IconLetterCase, IconFileTypePpt,
    IconPhoto, IconVideo, IconMusic, IconDownload, IconTrash, IconEdit,
    IconChevronRight, IconChevronDown, IconLayoutGrid, IconList,
    IconSearch, IconX, IconPlus, IconDots, IconCheck, IconRefresh,
    IconFolderOpen, IconAlertTriangle, IconShare, IconDotsVertical,
    IconStar, IconStarFilled, IconFoldersFilled, IconSettings, IconFolderSymlink
} from '@tabler/icons-react';
import {
    ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import DeleteModal from '../../components/DeleteModal';
import MediaLibrarySkeleton from '../../components/Skeletons/MediaLibrarySkeleton';

/* ────────────────────────────────────────
   TYPES
──────────────────────────────────────── */
interface MediaFolder {
    id: number;
    name: string;
    color: string;
    parent_id: number | null;
    children_recursive: MediaFolder[];
}
interface MediaFile {
    id: number;
    name: string;
    extension: string;
    file_type: 'photo' | 'video' | 'audio' | 'document' | 'other';
    size_bytes: number;
    size_human: string;
    mime_type: string;
    url: string;
    folder_id: number | null;
    created_at: string;
    is_favorite: boolean;
    disk: string;
    user?: { id: number; name: string; avatar?: string };
}
interface StorageInfo {
    used_bytes: number;
    used_human: string;
    limit_mb: number;
    limit_bytes: number;
    used_pct: number;
    unlimited: boolean;
}

/* ────────────────────────────────────────
   FILE TYPE ICON
──────────────────────────────────────── */
const FileIcon = ({ type, ext, size = 24 }: { type: string; ext: string; size?: number }) => {
    const cls = `shrink-0`;
    if (type === 'photo') return <IconPhoto size={size} className={`${cls} text-emerald-500`} />;
    if (type === 'video') return <IconVideo size={size} className={`${cls} text-purple-500`} />;
    if (type === 'audio') return <IconMusic size={size} className={`${cls} text-pink-500`} />;
    if (ext === 'pdf') return <IconFileTypePdf size={size} className={`${cls} text-red-500`} />;
    if (ext === 'csv') return <IconFileTypeCsv size={size} className={`${cls} text-green-600`} />;
    if (ext === 'docx') return <IconFileTypeDocx size={size} className={`${cls} text-blue-600`} />;
    if (ext === 'ttf' || ext === 'otf') return <IconLetterCase size={size} className={`${cls} text-amber-600`} />;
    if (ext === 'xlsx' || ext === 'xls') return <IconFileTypeXls size={size} className={`${cls} text-emerald-600`} />;
    if (ext === 'txt') return <IconFileTypeTxt size={size} className={`${cls} text-gray-500`} />;
    if (['doc', 'rtf', 'odt'].includes(ext)) return <IconFile size={size} className={`${cls} text-blue-500`} />;
    if (['ppt', 'pptx'].includes(ext)) return <IconFileTypePpt size={size} className={`${cls} text-orange-500`} />;
    if (type === 'document') return <IconFile size={size} className={`${cls} text-blue-500`} />;
    return <IconFile size={size} className={`${cls} text-gray-400`} />;
};

const TYPE_BADGE: Record<string, string> = {
    photo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    video: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    audio: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    document: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

/* ────────────────────────────────────────
   STORAGE BAR
──────────────────────────────────────── */
const StorageBar = ({ info, onSettingsClick }: { info: StorageInfo | null, onSettingsClick: () => void }) => {
    if (!info) return null;
    const isUnlimited = info.unlimited;
    const pct = isUnlimited ? 0 : info.used_pct;
    const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className={`flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 ${!isUnlimited ? 'mb-1.5' : ''}`}>
                <span className="font-medium flex items-center gap-1">
                    <IconFolderOpen size={14} /> Total Usage
                </span>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {info.used_human}
                        {!isUnlimited && ` / ${info.limit_mb} MB`}
                    </span>
                    <button onClick={onSettingsClick} className="text-gray-400 hover:text-indigo-500 transition-colors" title="Storage Configuration">
                        <IconSettings size={14} />
                    </button>
                </div>
            </div>
            {!isUnlimited && (
                <>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                            className={`${color} h-1.5 rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                    </div>
                    {pct >= 90 && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <IconAlertTriangle size={12} /> Storage nearly full
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

/* ────────────────────────────────────────
   FOLDER TREE NODE
──────────────────────────────────────── */
const FolderNode = ({
    folder, depth = 0, activeFolderId, onSelect, onRename, onDelete, onNewSub,
}: {
    folder: MediaFolder;
    depth?: number;
    activeFolderId: number | null;
    onSelect: (id: number | null) => void;
    onRename: (folder: MediaFolder) => void;
    onDelete: (folder: MediaFolder) => void;
    onNewSub: (parentId: number) => void;
}) => {
    const [open, setOpen] = useState(false);
    const hasChildren = folder.children_recursive?.length > 0;
    const isActive = activeFolderId === folder.id;

    return (
        <div>
            <div
                className={`group flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-all select-none
                    ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => onSelect(folder.id)}
            >
                {hasChildren ? (
                    <span onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} className="shrink-0">
                        {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                    </span>
                ) : <span className="w-3.5 shrink-0" />}
                <IconFolder size={15} className="shrink-0" style={{ color: folder.color }} />
                <span className="truncate flex-1">{folder.name}</span>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                        >
                            <IconDotsVertical size={14} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onNewSub(folder.id)}>
                            <IconFolderPlus size={14} className="mr-2" /> New Sub-folder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRename(folder)}>
                            <IconEdit size={14} className="mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(folder)} className="text-red-500">
                            <IconTrash size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {open && hasChildren && (
                <div>
                    {folder.children_recursive.map(child => (
                        <FolderNode key={child.id} folder={child} depth={depth + 1}
                            activeFolderId={activeFolderId} onSelect={onSelect}
                            onRename={onRename} onDelete={onDelete} onNewSub={onNewSub} />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────── */
const MediaLibrary = () => {
    const dispatch = useDispatch();

    /* ── State ── */
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [storage, setStorage] = useState<StorageInfo | null>(null);
    const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<{ type: 'folder' | 'file'; id: number; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Filter
    const [favoriteFilter, setFavoriteFilter] = useState(false);

    // Modals
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRows, setTotalRows] = useState(0);

    const [renameTarget, setRenameTarget] = useState<{ type: 'folder' | 'file'; id: number; name: string; color?: string } | null>(null);
    const [renameInput, setRenameInput] = useState('');
    const [renameColor, setRenameColor] = useState('#6366f1');
    const [renameSaving, setRenameSaving] = useState(false);

    const [moveTarget, setMoveTarget] = useState<MediaFile | null>(null);
    const [moveSaving, setMoveSaving] = useState(false);

    const [showFolderCreateModal, setShowFolderCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState('#6366f1');
    const [folderParentId, setFolderParentId] = useState<number | null>(null);
    const [newFolderSaving, setNewFolderSaving] = useState(false);

    const [showStorageSettings, setShowStorageSettings] = useState(false);
    const [storageSettings, setStorageSettings] = useState<any[]>([]);
    const [savingSettings, setSavingSettings] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        dispatch(setPageTitle('Media Library'));
        fetchAll();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [activeFolderId, typeFilter, search, favoriteFilter]);

    useEffect(() => {
        fetchFiles();
    }, [activeFolderId, typeFilter, search, page, pageSize, favoriteFilter]);

    /* ── Data fetchers ── */
    const fetchAll = () => {
        fetchFolders();
        fetchFiles();
        fetchStorage();
        fetchSettings();
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/storage');
            setStorageSettings(Array.isArray(res.data) ? res.data : []);
        } catch { }
    };

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('all');
    };

    const hasFilters = search !== '' || typeFilter !== 'all';

    const fetchFolders = async () => {
        try {
            const res = await api.get('/media/folders');
            setFolders(Array.isArray(res.data) ? res.data : []);
        } catch { }
    };

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const params: any = {
                file_type: typeFilter,
                search,
                page,
                per_page: pageSize,
                favorites: favoriteFilter
            };
            if (activeFolderId !== null) params.folder_id = activeFolderId;
            const res = await api.get('/media/files', { params });
            setFiles(res.data && Array.isArray(res.data.data) ? res.data.data : []);
            setTotalPages(res.data?.last_page || 1);
            setTotalRows(res.data?.total || 0);
        } catch { }
        setLoading(false);
    };

    const fetchStorage = async () => {
        try {
            const res = await api.get('/media/storage-info');
            setStorage(res.data);
        } catch { }
    };

    /* ── Upload ── */
    const handleUpload = useCallback(async (uploadFiles: FileList | null) => {
        if (!uploadFiles || uploadFiles.length === 0) return;
        setUploading(true);
        let successCount = 0;

        const uploadId = toast.loading(`Uploading ${uploadFiles.length} file(s)...`);

        for (const file of Array.from(uploadFiles)) {
            try {
                const fd = new FormData();
                fd.append('file', file);
                if (activeFolderId) fd.append('folder_id', String(activeFolderId));

                await api.post('/media/files/upload', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    _skipToast: true,
                } as any);
                successCount++;
            } catch (err: any) {
                const msg = err?.response?.data?.message || `Failed to upload ${file.name}`;
                toast.error(msg, { id: uploadId });
                setUploading(false);
                return;
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`, { id: uploadId });
        }

        setUploading(false);
        setShowUploadModal(false);
        fetchFiles();
        fetchStorage();
    }, [activeFolderId, fetchFiles]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleUpload(e.dataTransfer.files);
    };

    /* ── Rename / Create actions ── */
    const openCreateFolder = (parentId: number | null = null) => {
        setFolderParentId(parentId);
        setNewFolderName('');
        setNewFolderColor('#6366f1');
        setShowFolderCreateModal(true);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        setNewFolderSaving(true);
        try {
            await api.post('/media/folders', { name: newFolderName.trim(), parent_id: folderParentId, color: newFolderColor });
            toast.success('Folder created');
            setShowFolderCreateModal(false);
            fetchFolders();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create folder');
        }
        setNewFolderSaving(false);
    };

    const openRename = (type: 'folder' | 'file', item: any) => {
        setRenameTarget({ type, id: item.id, name: item.name, color: item.color });
        setRenameInput(item.name);
        setRenameColor(item.color || '#6366f1');
    };

    const handleSaveRename = async () => {
        if (!renameInput.trim() || !renameTarget) return;
        setRenameSaving(true);
        try {
            if (renameTarget.type === 'folder') {
                await api.put(`/media/folders/${renameTarget.id}`, { name: renameInput.trim(), color: renameColor });
            } else {
                await api.put(`/media/files/${renameTarget.id}`, { name: renameInput.trim() });
            }
            toast.success('Renamed successfully');
            setRenameTarget(null);
            fetchFolders();
            fetchFiles();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to rename');
        }
        setRenameSaving(false);
    };

    const handleSaveMove = async (newFolderId: number | null) => {
        if (!moveTarget) return;
        setMoveSaving(true);
        try {
            await api.put(`/media/files/${moveTarget.id}`, { folder_id: newFolderId });
            toast.success('Moved successfully');
            setMoveTarget(null);
            fetchFolders();
            fetchFiles();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to move');
        }
        setMoveSaving(false);
    };

    const handleShare = (file: MediaFile) => {
        const fullUrl = file.url.startsWith('http') ? file.url : window.location.origin + file.url;
        navigator.clipboard.writeText(fullUrl);
        toast.success('Link copied to clipboard');
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            if (deleteTarget.type === 'folder') {
                await api.delete(`/media/folders/${deleteTarget.id}`);
                if (activeFolderId === deleteTarget.id) setActiveFolderId(null);
                fetchFolders();
            } else {
                await api.delete(`/media/files/${deleteTarget.id}`);
            }
            fetchFiles();
            fetchStorage();
            toast.success('Deleted');
        } catch {
            toast.error('Failed to delete');
        }
        setDeleteLoading(false);
        setDeleteTarget(null);
    };

    const handleToggleFavorite = async (file: MediaFile) => {
        try {
            const res = await api.put(`/media/files/${file.id}/favorite`);
            setFiles(prev => prev.map(f => f.id === file.id ? res.data : f));
            toast.success(file.is_favorite ? 'Removed from favorites' : 'Added to favorites');
        } catch {
            toast.error('Failed to update favorite status');
        }
    };

    const handleSaveSettings = async (provider: string, isActive: boolean, credentials?: any) => {
        setSavingSettings(true);
        try {
            await api.put(`/settings/storage/${provider}`, { is_active: isActive, credentials });
            toast.success(`${provider.toUpperCase()} Settings Saved`);
            fetchSettings();
            if (isActive) setShowStorageSettings(false);
        } catch (err: any) {
            toast.error('Failed to save settings');
        }
        setSavingSettings(false);
    };

    /* ── Breadcrumb logic ── */
    const getFolderPath = (targetId: number | null): MediaFolder[] => {
        if (!targetId) return [];
        const path: MediaFolder[] = [];
        const find = (list: MediaFolder[]): boolean => {
            for (const f of list) {
                if (f.id === targetId) {
                    path.push(f);
                    return true;
                }
                if (f.children_recursive && find(f.children_recursive)) {
                    path.unshift(f);
                    return true;
                }
            }
            return false;
        };
        find(folders);
        return path;
    };

    const folderName = (id: number | null): string => {
        if (!id) return 'All Files';
        const path = getFolderPath(id);
        return path.length > 0 ? path[path.length - 1].name : 'Folder';
    };

    const COLORS = ['#6366f1', '#0866FF', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

    /* ── Render ── */
    return (
        <div className="flex h-[calc(100vh-100px)]">
            {/* ── Sidebar ── */}
            <aside className="w-60 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-y-auto">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="font-bold text-gray-800 dark:text-gray-300 text-sm flex items-center  gap-2">
                        <IconFolderOpen size={18} className="text-primary" />
                        Media Library
                    </h2>
                </div>

                <StorageBar info={storage} onSettingsClick={() => setShowStorageSettings(true)} />

                <ScrollArea className="flex-1">
                    <div className="p-3">
                        {/* All files */}
                        <button
                            onClick={() => { setActiveFolderId(null); setFavoriteFilter(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-1 transition-all
                                ${activeFolderId === null && !favoriteFilter ? 'bg-primary/10    dark:bg-primary/10 text-primary dark:text-primary font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <IconLayoutGrid size={15} /> All Files
                        </button>

                        <button
                            onClick={() => { setFavoriteFilter(true); setActiveFolderId(null); }}
                            className={`w-full mb-3  flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-1 transition-all
                                ${favoriteFilter ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <IconStar size={15} /> Favorites
                        </button>
                        <Separator />
                        {/* Report Sources */}
                        {folders.some(f => f.name.endsWith(' Source')) && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between px-3 mb-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Sources</span>
                                </div>
                                {folders.filter(f => f.name.endsWith(' Source')).map(f => {
                                    const isParentActive = activeFolderId === f.id;
                                    const isChildActive = f.children_recursive?.some(c => c.id === activeFolderId);
                                    const isExpanded = isParentActive || isChildActive;

                                    return (
                                        <div key={f.id}>
                                            <button
                                                onClick={() => { setActiveFolderId(f.id); setFavoriteFilter(false); }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-0.5 transition-all group
                                                    ${isParentActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                            >
                                                {f.children_recursive?.length > 0 ? (
                                                    isExpanded
                                                        ? <IconChevronDown size={13} className="shrink-0 text-gray-400" />
                                                        : <IconChevronRight size={13} className="shrink-0 text-gray-400" />
                                                ) : <span className="w-[13px] shrink-0" />}
                                                <IconFoldersFilled size={15} style={{ color: f.color }} className="shrink-0" />
                                                <span className="truncate">{f.name}</span>
                                            </button>

                                            {/* Sub-folders (Content Performance, Ads Performance) */}
                                            {isExpanded && f.children_recursive?.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => { setActiveFolderId(sub.id); setFavoriteFilter(false); }}
                                                    className={`w-full flex items-center gap-2 pl-10 pr-3 py-1.5 rounded-md text-xs mb-0.5 transition-all
                                                        ${activeFolderId === sub.id ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                                >
                                                    <IconFolder size={13} style={{ color: sub.color }} className="shrink-0" />
                                                    <span className="truncate">{sub.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Folder tree */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between px-3 mb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Folders</span>
                                <button onClick={() => openCreateFolder(null)} title="New root folder"
                                    className="text-gray-400 hover:text-indigo-500 transition-colors">
                                    <IconPlus size={13} />
                                </button>
                            </div>
                            {folders
                                .filter(f => !f.name.endsWith(' Source'))
                                .map(f => (
                                    <FolderNode
                                        key={f.id}
                                        folder={f}
                                        activeFolderId={activeFolderId}
                                        onSelect={(id) => { setActiveFolderId(id); setFavoriteFilter(false); }}
                                        onRename={(folder) => openRename('folder', folder)}
                                        onDelete={(folder) => setDeleteTarget({ type: 'folder', id: folder.id, name: folder.name })}
                                        onNewSub={(parentId) => openCreateFolder(parentId)}
                                    />
                                ))}
                            {folders.filter(f => !f.name.endsWith(' Source')).length === 0 && (
                                <p className="text-xs text-gray-400 px-3 py-2">No folders yet</p>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-3 flex flex-wrap items-center gap-3">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 flex-1 min-w-0">
                        <button onClick={() => { setActiveFolderId(null); setFavoriteFilter(false); }} className="hover:text-indigo-500 transition-colors font-medium">
                            All Files
                        </button>
                        {favoriteFilter && (
                            <>
                                <IconChevronRight size={14} />
                                <span className="text-gray-800 dark:text-white font-semibold flex items-center gap-1.5 transition-all">
                                    <IconStar size={14} className="text-amber-500" /> Favorites
                                </span>
                            </>
                        )}
                        {activeFolderId !== null && (
                            <>
                                {getFolderPath(activeFolderId).map((f) => (
                                    <div key={f.id} className="flex items-center gap-1.5 min-w-0">
                                        <IconChevronRight size={14} className="shrink-0" />
                                        <button
                                            onClick={() => setActiveFolderId(f.id)}
                                            className="hover:text-indigo-500 transition-colors font-medium truncate max-w-[100px] sm:max-w-[150px]"
                                            title={f.name}
                                        >
                                            {f.name}
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* View Mode Toggle */}
                        <Tabs
                            value={viewMode}
                            onValueChange={(v: string) => setViewMode(v as 'grid' | 'list')}
                            className="w-auto"
                        >
                            <TabsList className="grid w-full grid-cols-2 border bg-background">
                                <TabsTrigger value="list" aria-label="List view" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ">
                                    <IconList size={17} />
                                </TabsTrigger>
                                <TabsTrigger value="grid" aria-label="Grid view" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <IconLayoutGrid size={17} />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Search */}
                        <div className="relative">
                            <IconSearch size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search files..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 pr-8 h-9 text-sm w-44"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <IconX size={16} />
                                </button>
                            )}
                        </div>

                        {/* Type filter */}
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-32 h-9">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                <SelectItem value="photo">Photos</SelectItem>
                                <SelectItem value="video">Videos</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="document">Documents</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Folder trigger */}
                        <Button
                            variant="outline"
                            onClick={() => setShowFolderCreateModal(true)}
                            className="h-9 gap-1.5"
                        >
                            <IconFolderPlus size={15} />
                            New Folder
                        </Button>

                        {/* Upload trigger */}
                        <Button
                            onClick={() => setShowUploadModal(true)}
                            disabled={uploading}
                            className="h-9 gap-1.5 bg-primary hover:bg-primary-dark text-white shadow-sm transition-all hover:-translate-y-0.5"
                        >
                            <IconUpload size={15} />
                            {uploading ? 'Uploading…' : 'Upload'}
                        </Button>

                        {/* Refresh */}
                        <Button variant="ghost" size="icon" onClick={fetchAll} className="text-gray-400 h-9 w-9">
                            <IconRefresh size={16} />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-5">
                        {loading ? (
                            <MediaLibrarySkeleton viewMode={viewMode} />
                        ) : files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-80 text-center animate-in fade-in zoom-in duration-300">
                                {hasFilters ? (
                                    <>
                                        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center mb-4">
                                            <IconSearch size={28} className="text-amber-400" />
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium">{favoriteFilter ? 'No favorites found' : 'No results found'}</p>
                                        <p className="text-sm text-gray-400 mt-1 max-w-[250px]">We couldn't find anything matching your current {favoriteFilter ? 'favorited files' : ''} search or filters.</p>
                                        <button onClick={clearFilters}
                                            className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium">
                                            Clear Filters
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-800 rounded-2xl flex items-center justify-center mb-4">
                                            <IconUpload size={28} className="text-indigo-400" />
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium">{favoriteFilter ? 'No favorites yet' : 'No files here yet'}</p>
                                        <p className="text-sm text-gray-400 mt-1">{favoriteFilter ? 'Star your important files to find them easily' : 'Click the button below to upload your first file'}</p>
                                        {!favoriteFilter && (
                                            <button onClick={() => setShowUploadModal(true)}
                                                className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/80 transition-all shadow-sm">
                                                Upload Files
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : viewMode === 'grid' ? (
                            /* ── GRID VIEW ── */
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                <AnimatePresence>
                                    {files.map(file => (
                                        <motion.div
                                            key={file.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all"
                                        >
                                            {/* Preview */}
                                            <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden group-hover:bg-gray-100 dark:group-hover:bg-gray-800/80 transition-colors">
                                                {file.file_type === 'photo' ? (
                                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FileIcon type={file.file_type} ext={file.extension} size={40} />
                                                )}

                                                {/* Favorite Toggle Overlay */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(file); }}
                                                    className={`absolute top-2 left-2 p-1.5 rounded-full shadow-sm transition-all
                                                        ${file.is_favorite ? 'bg-amber-100/90 text-amber-500 opacity-100' : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'}`}
                                                >
                                                    {file.is_favorite ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                                                </button>

                                                {/* hover actions */}
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm">
                                                                <IconDots size={16} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem onClick={() => handleToggleFavorite(file)}>
                                                                {file.is_favorite ? (
                                                                    <><IconStarFilled size={14} className="mr-2 text-amber-500" /> Unfavorite</>
                                                                ) : (
                                                                    <><IconStar size={14} className="mr-2" /> Favorite</>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleShare(file)}>
                                                                <IconShare size={14} className="mr-2" /> Share Link
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openRename('file', file)}>
                                                                <IconEdit size={14} className="mr-2" /> Rename
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setMoveTarget(file)}>
                                                                <IconFolderSymlink size={14} className="mr-2" /> Move
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <a href={file.url} download={file.name}>
                                                                    <IconDownload size={14} className="mr-2" /> Download
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setDeleteTarget({ type: 'file', id: file.id, name: file.name })} className="text-red-500">
                                                                <IconTrash size={14} className="mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                            {/* Info */}
                                            <div className="p-3">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate" title={file.name}>{file.name}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(file.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">{file.size_human}</span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${TYPE_BADGE[file.file_type]}`}>
                                                        {file.file_type}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800">
                                                        {file.disk === 'gdrive' ? 'Google Drive' : file.disk === 's3' ? 'Amazon S3' : 'Local'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            /* ── LIST VIEW ── */
                            <Card className="overflow-hidden border-gray-100 dark:border-gray-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50/50 dark:bg-gray-800/30">
                                        <tr className="border-b border-gray-100 dark:border-gray-800">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {files.map(file => (
                                            <tr key={file.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleToggleFavorite(file)}
                                                            className={`transition-colors ${file.is_favorite ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'}`}
                                                        >
                                                            {file.is_favorite ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                                                        </button>
                                                        <FileIcon type={file.file_type} ext={file.extension} size={20} />
                                                        <span className="text-gray-800 dark:text-white font-medium truncate max-w-[300px]" title={file.name}>{file.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[file.file_type]}`}>
                                                            {file.file_type}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800">
                                                            {file.disk === 'gdrive' ? 'Google Drive' : file.disk === 's3' ? 'Amazon S3' : 'Local'}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-medium">{file.size_human}</td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">
                                                    {new Date(file.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                                                    <IconDotsVertical size={16} />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuItem onClick={() => handleToggleFavorite(file)}>
                                                                    {file.is_favorite ? (
                                                                        <><IconStarFilled size={14} className="mr-2 text-amber-500" /> Unfavorite</>
                                                                    ) : (
                                                                        <><IconStar size={14} className="mr-2" /> Favorite</>
                                                                    )}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleShare(file)}>
                                                                    <IconShare size={14} className="mr-2" /> Share Link
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openRename('file', file)}>
                                                                    <IconEdit size={14} className="mr-2" /> Rename
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setMoveTarget(file)}>
                                                                    <IconFolderSymlink size={14} className="mr-2" /> Move
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <a href={file.url} download={file.name}>
                                                                        <IconDownload size={14} className="mr-2" /> Download
                                                                    </a>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => setDeleteTarget({ type: 'file', id: file.id, name: file.name })} className="text-red-500">
                                                                    <IconTrash size={14} className="mr-2" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </div>
                </ScrollArea>

                {/* Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-4">
                        {/* Rows per page */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap uppercase font-semibold">Rows per page</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(value) => {
                                    setPageSize(Number(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px] text-xs">
                                    <SelectValue placeholder={pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[12, 24, 48, 96].map((size) => (
                                        <SelectItem key={size} value={String(size)} className="text-xs">
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                        <span className="text-xs text-muted-foreground font-medium">
                            Showing <span className="font-bold text-gray-900 dark:text-white">{(page - 1) * pageSize + 1}</span> - <span className="font-bold text-gray-900 dark:text-white">{Math.min(page * pageSize, totalRows)}</span> of <span className="font-bold text-gray-900 dark:text-white">{totalRows}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center justify-center text-xs font-bold h-8 min-w-[3rem] px-2 rounded-md border bg-background text-gray-900 dark:text-white">
                            {page} / {totalPages}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </main>

            {/* ── Upload Modal ── */}
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconUpload size={20} className="text-indigo-500" />
                            Upload Files
                        </DialogTitle>
                        <DialogDescription>
                            Upload your media files to {activeFolderId ? `"${folderName(activeFolderId)}"` : 'the root folder'}.
                        </DialogDescription>
                    </DialogHeader>

                    <div
                        className={`mt-4 border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
                            ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            handleDrop(e);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <IconUpload size={32} className={isDragging ? 'text-indigo-600' : 'text-gray-400'} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700 dark:text-gray-200">
                                    Click or drag & drop to upload
                                </p>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight font-medium">
                                    Images, Videos, Audio or Documents (Max 50MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={(e) => {
                            if (e.target.files?.length) {
                                handleUpload(e.target.files);
                                e.target.value = '';
                            }
                        }}
                        className="hidden"
                    />

                    {uploading && (
                        <div className="mt-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-indigo-600">Uploading file...</span>
                                <span className="animate-pulse">◌</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden relative">
                                <motion.div
                                    className="bg-indigo-600 h-full absolute top-0 left-0 bottom-0"
                                    initial={{ width: '30%', x: '-100%' }}
                                    animate={{ x: '350%' }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={showFolderCreateModal} onOpenChange={setShowFolderCreateModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconFolderPlus size={20} className="text-indigo-500" />
                            {folderParentId ? 'New Sub-folder' : 'New Folder'}
                        </DialogTitle>
                        <DialogDescription>
                            Create a new folder to organize your media files.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            autoFocus
                            placeholder="Folder name"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                        />
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Folder color</p>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewFolderColor(c)}
                                        className={`w-7 h-7 rounded-full transition-all flex items-center justify-center border-2 ${newFolderColor === c ? 'border-indigo-500 shadow-md scale-110' : 'border-transparent opacity-80'}`}
                                        style={{ backgroundColor: c }}
                                    >
                                        {newFolderColor === c && <IconCheck size={14} className="text-white drop-shadow-sm" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowFolderCreateModal(false)}>Cancel</Button>
                        <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || newFolderSaving}>
                            {newFolderSaving ? 'Creating...' : 'Create Folder'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Move Modal ── */}
            <Dialog open={!!moveTarget} onOpenChange={(open) => !open && setMoveTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconFolderSymlink size={20} className="text-indigo-500" />
                            Move "{moveTarget?.name}"
                        </DialogTitle>
                        <DialogDescription>
                            Select a destination folder to move this file to.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="mt-2 h-[300px] border border-gray-100 dark:border-gray-800 rounded-md">
                        <div className="py-2">
                            <button
                                onClick={() => handleSaveMove(null)}
                                disabled={moveSaving}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${moveTarget?.folder_id === null ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                            >
                                <IconLayoutGrid size={15} className="shrink-0" />
                                <span className="truncate">Root Directory (All Files)</span>
                                {moveTarget?.folder_id === null && <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">Current</span>}
                            </button>

                            {folders.map(f => {
                                const renderNode = (folder: MediaFolder, depth = 0) => {
                                    const isCurrent = folder.id === moveTarget?.folder_id;
                                    return (
                                        <div key={folder.id}>
                                            <button
                                                onClick={() => handleSaveMove(folder.id)}
                                                disabled={moveSaving}
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                                style={{ paddingLeft: `${12 + depth * 16}px` }}
                                            >
                                                <IconFolder size={15} style={{ color: folder.color }} className="shrink-0" />
                                                <span className="truncate">{folder.name}</span>
                                                {isCurrent && <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">Current</span>}
                                            </button>
                                            {folder.children_recursive?.map(child => renderNode(child, depth + 1))}
                                        </div>
                                    );
                                };
                                return renderNode(f);
                            })}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* ── Rename Modal ── */}
            <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconEdit size={20} className="text-indigo-500" />
                            Rename {renameTarget?.type}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            autoFocus
                            placeholder="New name"
                            value={renameInput}
                            onChange={e => setRenameInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveRename()}
                        />
                        {renameTarget?.type === 'folder' && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Folder color</p>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setRenameColor(c)}
                                            className={`w-7 h-7 rounded-full transition-all flex items-center justify-center border-2 ${renameColor === c ? 'border-indigo-500 shadow-md scale-110' : 'border-transparent opacity-80'}`}
                                            style={{ backgroundColor: c }}
                                        >
                                            {renameColor === c && <IconCheck size={14} className="text-white drop-shadow-sm" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
                        <Button onClick={handleSaveRename} disabled={!renameInput.trim() || renameSaving}>
                            {renameSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Storage Settings Modal ── */}
            <Dialog open={showStorageSettings} onOpenChange={setShowStorageSettings}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconSettings size={20} className="text-indigo-500" />
                            Cloud Storage Configuration
                        </DialogTitle>
                        <DialogDescription>
                            Configure where newly uploaded files should be stored. Existing files will remain accessible from their original source.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="local" className="mt-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="local">Local Disk</TabsTrigger>
                            <TabsTrigger value="s3">Amazon S3</TabsTrigger>
                            <TabsTrigger value="gdrive">Google Drive</TabsTrigger>
                        </TabsList>

                        {/* Local */}
                        <TabsContent value="local" className="py-4 space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Local Server Storage</h3>
                                <p className="text-sm text-gray-500 mb-4">Files will be uploaded directly to this server's public storage disk.</p>
                                <Button
                                    onClick={() => handleSaveSettings('local', true)}
                                    disabled={savingSettings}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {storageSettings.find(s => s.provider === 'local')?.is_active ? 'Currently Active' : 'Activate Local Storage'}
                                </Button>
                            </div>
                        </TabsContent>

                        {/* S3 */}
                        <TabsContent value="s3" className="py-2">
                            <form onSubmit={(e: any) => {
                                e.preventDefault();
                                const fd = new FormData(e.target);
                                const creds = Object.fromEntries(fd.entries());
                                // If activating, pass true, else false (just saving credentials)
                                handleSaveSettings('s3', !!e.nativeEvent.submitter.dataset.activate, creds);
                            }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">AWS Access Key ID</label>
                                        <Input name="key" required placeholder="AKIAIOSFODNN7EXAMPLE" defaultValue={storageSettings.find(s => s.provider === 's3')?.credentials?.key || ''} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">AWS Secret Key</label>
                                        <Input type="password" name="secret" required placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" defaultValue={storageSettings.find(s => s.provider === 's3')?.credentials?.secret || ''} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Default Region</label>
                                        <Input name="region" required placeholder="us-east-1" defaultValue={storageSettings.find(s => s.provider === 's3')?.credentials?.region || ''} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Bucket Name</label>
                                        <Input name="bucket" required placeholder="my-app-assets" defaultValue={storageSettings.find(s => s.provider === 's3')?.credentials?.bucket || ''} />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button type="submit" variant="outline" disabled={savingSettings}>Save Credentials</Button>
                                    <Button type="submit" data-activate="true" disabled={savingSettings} className="bg-orange-500 hover:bg-orange-600 text-white">
                                        {storageSettings.find(s => s.provider === 's3')?.is_active ? 'Active' : 'Save & Activate S3'}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        {/* Google Drive */}
                        <TabsContent value="gdrive" className="py-2">
                            <form onSubmit={(e: any) => {
                                e.preventDefault();
                                const fd = new FormData(e.target);
                                const creds = Object.fromEntries(fd.entries());
                                handleSaveSettings('gdrive', !!e.nativeEvent.submitter.dataset.activate, creds);
                            }} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Google Client ID</label>
                                        <Input name="clientId" required placeholder="...apps.googleusercontent.com" defaultValue={storageSettings.find(s => s.provider === 'gdrive')?.credentials?.clientId || ''} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Google Client Secret</label>
                                        <Input type="password" name="clientSecret" required placeholder="GOCSPX-..." defaultValue={storageSettings.find(s => s.provider === 'gdrive')?.credentials?.clientSecret || ''} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Refresh Token</label>
                                        <Input type="password" name="refreshToken" required placeholder="1//04..." defaultValue={storageSettings.find(s => s.provider === 'gdrive')?.credentials?.refreshToken || ''} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Target Folder ID</label>
                                        <Input name="folderId" required placeholder="1BxiMVs..." defaultValue={storageSettings.find(s => s.provider === 'gdrive')?.credentials?.folderId || ''} />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button type="submit" variant="outline" disabled={savingSettings}>Save Credentials</Button>
                                    <Button type="submit" data-activate="true" disabled={savingSettings} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                        {storageSettings.find(s => s.provider === 'gdrive')?.is_active ? 'Active' : 'Save & Activate Drive'}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Modal ── */}
            <DeleteModal
                isOpen={!!deleteTarget}
                setIsOpen={(open) => !open && setDeleteTarget(null)}
                onConfirm={confirmDelete}
                isLoading={deleteLoading}
                title={`Delete ${deleteTarget?.type}`}
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.${deleteTarget?.type === 'folder' ? ' All files inside will be permanently removed.' : ''}`}
            />
        </div>
    );
};

export default MediaLibrary;