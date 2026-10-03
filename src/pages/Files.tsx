import { apiFetch } from '@/lib/api';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { useProject } from '../lib/projectContext';
import { FileText, Image as ImageIcon, Video, Upload, Folder, Plus, ChevronRight, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function Files() {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{id: string, name: string}[]>([]);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allFiles = [], isLoading } = useQuery({
    queryKey: ['files', activeProject?.id],
    queryFn: async () => {
      if (!activeProject) return [];
      const res = await apiFetch(`/api/files?projectId=${activeProject.id}`);
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json();
    },
    enabled: !!activeProject
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', activeProject?.id || '');
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      const res = await apiFetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload file');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', activeProject?.id] });
      setIsUploading(false);
      toast.success('File uploaded successfully');
    },
    onError: () => {
      setIsUploading(false);
      toast.error('Failed to upload file');
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string, folderId: string | null, projectId: string }) => {
      const res = await apiFetch('/api/files/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create folder');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', activeProject?.id] });
      toast.success('Folder created');
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await apiFetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', activeProject?.id] });
      setPreviewFile(null);
      setFileToDelete(null);
      toast.success('Deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    uploadFileMutation.mutate(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !activeProject) return;
    
    createFolderMutation.mutate({
      name: newFolderName.trim(),
      folderId: currentFolderId,
      projectId: activeProject.id
    });
    setNewFolderName('');
    setIsNewFolderDialogOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, file: any) => {
    e.stopPropagation();
    setFileToDelete(file);
  };

  const handleFileClick = (file: any) => {
    if (file.type === 'FOLDER') {
      navigateToFolder(file.id, file.name);
    } else {
      setPreviewFile(file);
    }
  };

  const renderPreview = (file: any) => {
    if (!file || !file.url) return null;

    if (file.type === 'IMAGE') {
      return (
        <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
          <img src={file.url} alt={file.name} className="max-w-full max-h-[70vh] object-contain" />
        </div>
      );
    }

    if (file.type === 'VIDEO') {
      return (
        <div className="flex items-center justify-center">
          <video src={file.url} controls className="max-w-full max-h-[70vh]" />
        </div>
      );
    }

    // PDF files
    if (file.mimeType === 'application/pdf') {
      return (
        <iframe src={file.url} className="w-full h-[70vh] border-0" title={file.name} />
      );
    }

    // Other files — show info card
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-16 w-16 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-[#111111]">{file.name}</h3>
        <p className="text-sm text-slate-500 mt-2">{formatSize(file.size)} • {file.mimeType}</p>
        <a
          href={file.url}
          download={file.name}
          className="mt-6 px-6 py-3 bg-[#1F4D3A] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#1F4D3A]/90 transition-colors"
        >
          Download File
        </a>
      </div>
    );
  };

  const currentLevelFiles = allFiles.filter((f: any) => f.parentId === currentFolderId);
  const folders = currentLevelFiles.filter((f: any) => f.type === 'FOLDER').sort((a: any, b: any) => a.name.localeCompare(b.name));
  const files = currentLevelFiles.filter((f: any) => f.type !== 'FOLDER').sort((a: any, b: any) => a.name.localeCompare(b.name));
  const combined = [...folders, ...files];

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'FOLDER': return <Folder className="h-6 w-6 text-[#1F4D3A]" />;
      case 'IMAGE': return <ImageIcon className="h-6 w-6 text-[#1F4D3A]" />;
      case 'VIDEO': return <Video className="h-6 w-6 text-[#1F4D3A]" />;
      default: return <FileText className="h-6 w-6 text-[#1F4D3A]" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    setCurrentFolderId(folderId);
  };

  const navigateUp = (index: number) => {
    if (index === -1) {
      setFolderPath([]);
      setCurrentFolderId(null);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1].id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D1CDC4] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] flex items-center gap-3">
            <FileText className="h-8 w-8 text-[#1F4D3A]" />
            Files Repository
          </h1>
          <div className="flex items-center text-sm font-bold uppercase tracking-widest text-slate-500 mt-3 flex-wrap">
            <button onClick={() => navigateUp(-1)} className="hover:text-[#111111] transition-colors">Root</button>
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-2 text-[#D1CDC4]" />
                <button 
                  onClick={() => navigateUp(index)} 
                  className={index === folderPath.length - 1 ? 'text-[#111111]' : 'hover:text-[#111111] transition-colors'}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
            <DialogTrigger render={<Button className="shrink-0 bg-white hover:bg-slate-50 text-[#111111] font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-none border border-[#111111]" />}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFolder} className="space-y-4 pt-4">
                <Input 
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                />
                <Button type="submit" disabled={!newFolderName.trim()}>Create</Button>
              </form>
            </DialogContent>
          </Dialog>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="shrink-0 bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#111111] font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-none border border-[#C6A15B]"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading files...</div>
      ) : combined.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#D1CDC4] bg-white">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold">No files here</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">Upload a file or create a folder to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {combined.map((file: any) => (
            <div 
              key={file.id} 
              className="bg-white border border-[#D1CDC4] h-full flex flex-col hover:bg-[#FAF9F6] transition-colors relative group cursor-pointer"
              onClick={() => handleFileClick(file)}
            >
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 border border-[#D1CDC4]">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#111111] truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {file.type === 'FOLDER' ? 'Folder' : `${formatSize(file.size)} • ${file.type}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-auto px-6 py-4 border-t border-[#D1CDC4] bg-slate-50 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-slate-200 flex items-center justify-center text-[#111111] font-bold">
                    {file.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[80px]" title={file.user.name}>{file.user.name}</span>
                </div>
                <span>
                  {format(new Date(file.createdAt), 'MMM d, yyyy')}
                </span>
                
                {/* Delete button — only shown to the uploader */}
                {file.uploaderId === user?.id && (
                  <button
                    onClick={(e) => handleDelete(e, file)}
                    className="absolute top-3 right-3 bg-red-500 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 rounded-sm"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline File Preview Dialog */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
          <div className="bg-white w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1CDC4]">
              <div className="flex items-center gap-3">
                {getFileIcon(previewFile.type)}
                <div>
                  <h3 className="text-sm font-bold text-[#111111]">{previewFile.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {formatSize(previewFile.size)} • {previewFile.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewFile.uploaderId === user?.id && (
                  <button
                    onClick={() => setFileToDelete(previewFile)}
                    className="p-2 text-red-500 hover:bg-red-50 transition-colors rounded-sm"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-500 hover:text-[#111111] transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              {renderPreview(previewFile)}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#111111]">
              Are you sure you want to delete <span className="font-bold">"{fileToDelete?.name}"</span>?
            </p>
            {fileToDelete?.type === 'FOLDER' && (
              <p className="text-red-500 text-sm mt-2 font-bold uppercase tracking-widest">
                Warning: All files inside this folder will also be deleted.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setFileToDelete(null)}>Cancel</Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => deleteFileMutation.mutate(fileToDelete.id)}
              disabled={deleteFileMutation.isPending}
            >
              {deleteFileMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
