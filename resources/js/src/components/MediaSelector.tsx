import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import api from '../utils/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

import {
    IconFolder,
    IconFile,
    IconFileTypePdf,
    IconFileTypeCsv,
    IconFileTypePpt,
    IconFileTypeXls,
    IconFileTypeTxt,
    IconFileTypeDocx,
    IconLetterCase,
    IconPhoto,
    IconVideo,
    IconMusic,
    IconLayoutGrid,
    IconSearch,
    IconX,
    IconFolderOpen,
    IconUpload,
    IconChevronRight,
    IconChevronDown,
    IconCheck,
    IconRefresh,
} from '@tabler/icons-react';

/* ────────────────────────────────────────
   TYPES
──────────────────────────────────────── */
export interface MediaFolder {
    id: number;
    name: string;
    color: string;
    parent_id: number | null;
    children_recursive: MediaFolder[];
}

export interface MediaFile {
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
    disk: string;
}

interface MediaSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (file: MediaFile) => void;
    acceptedType?: 'all' | 'photo' | 'video' | 'audio' | 'document';
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
    photo:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    video:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    audio:    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    document: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    other:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

/* ────────────────────────────────────────
   FOLDER TREE NODE (with animation)
──────────────────────────────────────── */
const FolderNode = ({
    folder,
    depth = 0,
    activeFolderId,
    onSelect,
}: {
    folder: MediaFolder;
    depth?: number;
    activeFolderId: number | null;
    onSelect: (id: number | null) => void;
}) => {
    const [open, setOpen] = useState(false);
    const hasChildren = folder.children_recursive?.length > 0;
    const isActive = activeFolderId === folder.id;

    return (
        <div>
            <motion.div
                className={`group flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-all select-none
                    ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => onSelect(folder.id)}
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
                {hasChildren ? (
                    <motion.span
                        animate={{ rotate: open ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                        className="shrink-0"
                    >
                        <IconChevronRight size={14} />
                    </motion.span>
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}
                <IconFolder size={15} className="shrink-0" style={{ color: folder.color }} />
                <span className="truncate flex-1">{folder.name}</span>
            </motion.div>

            <AnimatePresence initial={false}>
                {open && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        {folder.children_recursive.map(child => (
                            <FolderNode
                                key={child.id}
                                folder={child}
                                depth={depth + 1}
                                activeFolderId={activeFolderId}
                                onSelect={onSelect}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ────────────────────────────────────────
   BREADCRUMB COMPONENT
──────────────────────────────────────── */
const FolderBreadcrumb = ({
    folderId,
    folders,
    onNavigate,
}: {
    folderId: number | null;
    folders: MediaFolder[];
    onNavigate: (id: number | null) => void;
}) => {
    // Build path from root to current folder
    const buildPath = (): MediaFolder[] => {
        if (!folderId) return [];
        const path: MediaFolder[] = [];
        let current = folders.find(f => f.id === folderId);
        while (current) {
            path.unshift(current);
            current = folders.find(f => f.id === current?.parent_id);
        }
        return path;
    };

    const path = buildPath();

    return (
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <button
                onClick={() => onNavigate(null)}
                className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-1 py-0.5 rounded ${folderId === null ? 'font-medium text-indigo-600 dark:text-indigo-400' : ''}`}
            >
                All Files
            </button>
            {path.map((f, idx) => (
                <React.Fragment key={f.id}>
                    <IconChevronRight size={12} className="opacity-40" />
                    <button
                        onClick={() => onNavigate(f.id)}
                        className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-1 py-0.5 rounded truncate max-w-[120px] ${folderId === f.id ? 'font-medium text-indigo-600 dark:text-indigo-400' : ''}`}
                        title={f.name}
                    >
                        {f.name}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

/* ────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────── */
export default function MediaSelector({ open, onOpenChange, onSelect, acceptedType = 'all' }: MediaSelectorProps) {
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // In-modal filter (only when acceptedType === 'all')
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch data when modal opens
    useEffect(() => {
        if (open) {
            fetchFolders();
            fetchFiles();
        } else {
            // Reset when closed
            setSelectedFile(null);
            setSearch('');
            setPage(1);
            setTypeFilter(null);
        }
    }, [open]);

    // Refetch when folder, search, page, or type filter changes
    useEffect(() => {
        if (open) fetchFiles();
    }, [activeFolderId, search, page, typeFilter]);

    const fetchFolders = async () => {
        try {
            const res = await api.get('/media/folders');
            setFolders(Array.isArray(res.data) ? res.data : []);
        } catch { /* ignore */ }
    };

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const params: any = {
                file_type: acceptedType === 'all' && typeFilter ? typeFilter : acceptedType,
                search,
                page,
                per_page: 24,
            };
            if (activeFolderId !== null) params.folder_id = activeFolderId;
            const res = await api.get('/media/files', { params });
            setFiles(res.data && Array.isArray(res.data.data) ? res.data.data : []);
            setTotalPages(res.data?.last_page || 1);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setUploading(true);
        setUploadProgress(0);
        const uploadId = toast.loading('Uploading file...');

        // Simulate progress (you can replace with actual progress from axios)
        const interval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const fd = new FormData();
            fd.append('file', file);
            if (activeFolderId) fd.append('folder_id', String(activeFolderId));

            await api.post('/media/files/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                _skipToast: true,
            } as any);

            clearInterval(interval);
            setUploadProgress(100);
            setTimeout(() => {
                toast.success('File uploaded successfully', { id: uploadId });
                setUploading(false);
                fetchFiles();
            }, 500);
        } catch (err: any) {
            clearInterval(interval);
            const msg = err?.response?.data?.message || 'Failed to upload';
            toast.error(msg, { id: uploadId });
            setUploading(false);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleConfirm = () => {
        if (selectedFile) {
            onSelect(selectedFile);
            onOpenChange(false);
        }
    };

    const typeOptions = [
        { value: 'photo', label: 'Photos', icon: IconPhoto },
        { value: 'video', label: 'Videos', icon: IconVideo },
        { value: 'audio', label: 'Audio', icon: IconMusic },
        { value: 'document', label: 'Documents', icon: IconFile },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1000px] h-[80vh] flex flex-col p-0 overflow-hidden bg-gray-50 dark:bg-gray-900 border-none">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 pr-12 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div>
                        <DialogTitle className="text-lg font-bold">Select Media</DialogTitle>
                        <DialogDescription className="text-xs">Browse or upload a file from your media library.</DialogDescription>
                    </div>

                     <Separator orientation="vertical" />

                    {/* Right side: filter (if all types) + search + upload */}
                    <div className="flex items-center gap-3 ">
                        {acceptedType === 'all' && (
                            <div className="flex items-center gap-1 border p-1 rounded-lg">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTypeFilter(null)}
                                    className={`h-7 px-2 text-xs ${!typeFilter ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}
                                >
                                    All
                                </Button>
                                {typeOptions.map(opt => (
                                    <Button
                                        key={opt.value}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setTypeFilter(opt.value)}
                                        className={`h-7 px-2 text-xs ${typeFilter === opt.value ? 'bg-white text-gray-500 dark:text-gray-400 dark:bg-gray-900 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        <opt.icon size={14} className="mr-1" />
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="relative w-36">
                            <IconSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search files..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                className="pl-8 h-9 text-sm w-full "
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <IconX size={14} />
                                </button>
                            )}
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            size="sm"
                            className="h-9 whitespace-nowrap"
                        >
                            {uploading ? (
                                <IconRefresh size={16} className="mr-2 animate-spin" />
                            ) : (
                                <IconUpload size={16} className="mr-2" />
                            )}
                            Upload
                        </Button>
                    </div>
                </div>

                {/* Body Split */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Folder Tree */}
                    <div className="w-56 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col">
                        <ScrollArea className="flex-1 p-3">
                            <button
                                onClick={() => setActiveFolderId(null)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-1 transition-all
                                    ${activeFolderId === null
                                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <IconLayoutGrid size={15} /> All Files
                            </button>

                            <div className="mt-4">
                                <span className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 block">Folders</span>
                                {folders.map(folder => (
                                    <FolderNode
                                        key={folder.id}
                                        folder={folder}
                                        activeFolderId={activeFolderId}
                                        onSelect={setActiveFolderId}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Files Display grid */}
                    <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-gray-900/10">
                        {/* Breadcrumb */}
                        <div className="px-4 pt-3 pb-1">
                            <FolderBreadcrumb
                                folderId={activeFolderId}
                                folders={folders}
                                onNavigate={setActiveFolderId}
                            />
                        </div>

                        {/* Upload Progress Bar */}
                        {uploading && (
                            <div className="mx-4 mb-3">
                                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-indigo-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                            </div>
                        )}

                        <ScrollArea className="flex-1 px-4 pb-4">
                            {loading ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className="bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden animate-pulse">
                                            <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
                                            <div className="p-3 space-y-2">
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                                <div className="flex justify-between">
                                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : files.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-gray-400 py-16"
                                >
                                    <IconFolderOpen size={64} className="mb-4 opacity-30" />
                                    <p className="text-lg font-medium">No files found</p>
                                    <p className="text-sm">Try a different folder or upload a file.</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-4"
                                    >
                                        <IconUpload size={16} className="mr-2" /> Upload File
                                    </Button>
                                </motion.div>
                            ) : (
                                <div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                        <AnimatePresence mode="popLayout">
                                            {files.map(file => {
                                                const isSelected = selectedFile?.id === file.id;
                                                return (
                                                    <motion.div
                                                        key={file.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        transition={{ duration: 0.2 }}
                                                        onClick={() => setSelectedFile(file)}
                                                        className={`group relative flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all border-2
                                                            ${isSelected
                                                                ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-500/20'
                                                                : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-md'
                                                            }`}
                                                        whileHover={{ y: -2 }}
                                                    >
                                                        {/* Thumbnail */}
                                                        <div className="aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                                            {file.file_type === 'photo' ? (
                                                                <img
                                                                    src={file.url}
                                                                    alt={file.name}
                                                                    loading="lazy"
                                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                />
                                                            ) : (
                                                                <FileIcon type={file.file_type} ext={file.extension} size={48} />
                                                            )}

                                                            {/* Selection Overlay */}
                                                            {isSelected && (
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center backdrop-blur-[1px]"
                                                                >
                                                                    <div className="bg-indigo-500 text-white p-2 rounded-full shadow-lg">
                                                                        <IconCheck size={24} stroke={3} />
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="p-3 bg-white dark:bg-gray-800">
                                                            <p className="text-xs font-semibold text-gray-800 dark:text-white truncate" title={file.name}>
                                                                {file.name}
                                                            </p>
                                                            <div className="mt-1.5 flex items-center justify-between">
                                                                <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${TYPE_BADGE[file.file_type]}`}>
                                                                    {file.file_type}
                                                                </Badge>
                                                                <span className="text-[10px] text-gray-400 font-medium">{file.size_human}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="mt-6 flex items-center justify-center gap-2 pb-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                Prev
                                            </Button>
                                            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        {selectedFile ? (
                            <>
                                <span className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                    <FileIcon type={selectedFile.file_type} ext={selectedFile.extension} size={18} />
                                </span>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[300px]">
                                        {selectedFile.name}
                                    </span>
                                    <span className="text-xs">
                                        {selectedFile.size_human} • {selectedFile.extension.toUpperCase()}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <span className="italic">No file selected</span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            onClick={handleConfirm}
                            disabled={!selectedFile}
                            className="min-w-[120px]"
                        >
                            Select File
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}