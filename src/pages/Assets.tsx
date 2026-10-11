import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useProject } from '../lib/projectContext';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';
import { 
  Layers, 
  Upload, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  ExternalLink, 
  Palette, 
  Type, 
  FileImage, 
  BookOpen, 
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const BRAND_COLORS = [
  { name: 'Forest Green', role: 'Primary Brand / Header Accent', hex: '#1F4D3A', textClass: 'text-white' },
  { name: 'Vintage Gold', role: 'Primary CTA / Status Highlight', hex: '#C6A15B', textClass: 'text-stone-900' },
  { name: 'Midnight Charcoal', role: 'Dark Background & Text', hex: '#111111', textClass: 'text-white' },
  { name: 'Warm Parchment', role: 'Light Canvas Background', hex: '#FAF9F6', textClass: 'text-stone-900', border: true },
  { name: 'Muted Sand', role: 'Input Background & Badges', hex: '#F5F1E8', textClass: 'text-stone-900', border: true },
  { name: 'Border Stone', role: 'Structural Dividers & Outlines', hex: '#D1CDC4', textClass: 'text-stone-900', border: true },
  { name: 'Ruby Alert', role: 'Errors, Overdue & Critical Items', hex: '#A21F1F', textClass: 'text-white' },
  { name: 'Emerald Success', role: 'Completed & Verified Statuses', hex: '#10B981', textClass: 'text-white' },
];

const TYPOGRAPHY_SPECS = [
  { level: 'Display Header (H1)', size: '32px / 2rem', weight: 'Bold (700)', sample: 'Workspace Performance & Activity', usage: 'Page titles and high-impact headings' },
  { level: 'Section Title (H2)', size: '20px / 1.25rem', weight: 'Bold (700)', sample: 'Active Tasks & Timeline Milestone', usage: 'Major card headers and grouping titles' },
  { level: 'Body Typography', size: '14px / 0.875rem', weight: 'Regular (400)', sample: 'Collaborate with your team seamlessly across every milestone.', usage: 'Paragraphs, comments, descriptions' },
  { level: 'Micro Labels & Badges', size: '10px / 0.625rem', weight: 'Bold Uppercase (700)', sample: 'IN PROGRESS · HIGH PRIORITY · DUE OCT 15', usage: 'Status pills, timestamps, column headers' },
];

export function Assets() {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'media' | 'colors' | 'typography' | 'guidelines'>('media');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all files scoped to the active project
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

  // Filter image/visual assets
  const mediaAssets = allFiles.filter((f: any) => 
    !f.isFolder && (
      f.mimeType?.startsWith('image/') ||
      f.mimeType?.startsWith('video/') ||
      f.name?.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|pdf)$/i)
    )
  );

  const uploadAssetMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeProject) throw new Error('No active project');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', activeProject.id);

      const res = await apiFetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload asset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', activeProject?.id] });
      setIsUploading(false);
      toast.success('Asset uploaded successfully');
    },
    onError: (err: any) => {
      setIsUploading(false);
      toast.error(err.message || 'Failed to upload asset');
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await apiFetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete asset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', activeProject?.id] });
      setSelectedAsset(null);
      toast.success('Asset deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete asset');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    uploadAssetMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
        Please select a project to view its brand & digital assets.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D1CDC4] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] flex items-center gap-3">
            <Layers className="h-7 w-7 sm:h-8 sm:w-8 text-[#1F4D3A]" />
            Brand & Digital Assets
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Central repository for design tokens, brand guidelines, and media assets for <span className="font-semibold text-stone-800">{activeProject.name}</span>.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="w-full sm:w-auto">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,video/*,.svg,.pdf" 
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto bg-[#1F4D3A] hover:bg-[#1F4D3A]/90 text-white font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-none border border-[#1F4D3A]"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Brand Asset'}
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#D1CDC4] gap-2 overflow-x-auto pb-[-1px]">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'media'
              ? 'border-[#1F4D3A] text-[#1F4D3A] bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileImage className="h-4 w-4" />
          Media & Graphics ({mediaAssets.length})
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'colors'
              ? 'border-[#1F4D3A] text-[#1F4D3A] bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Palette className="h-4 w-4" />
          Color Palette
        </button>

        <button
          onClick={() => setActiveTab('typography')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'typography'
              ? 'border-[#1F4D3A] text-[#1F4D3A] bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Type className="h-4 w-4" />
          Typography
        </button>

        <button
          onClick={() => setActiveTab('guidelines')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'guidelines'
              ? 'border-[#1F4D3A] text-[#1F4D3A] bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Brand Guidelines
        </button>
      </div>

      {/* Tab 1: Media & Graphics Gallery */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
              Loading project assets...
            </div>
          ) : mediaAssets.length === 0 ? (
            <div className="border border-dashed border-[#D1CDC4] bg-white p-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-[#F5F1E8] text-[#1F4D3A] flex items-center justify-center rounded-full">
                <FileImage className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">No media assets uploaded yet</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                  Upload logos, banners, icon sets, and product screenshots for {activeProject.name}. All team members can preview and download them.
                </p>
              </div>
              {user?.role === 'ADMIN' && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-stone-900 font-bold uppercase tracking-widest text-xs px-6 py-2 rounded-none border border-[#C6A15B]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Asset
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaAssets.map((asset: any) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="bg-white border border-[#D1CDC4] group hover:border-[#1F4D3A] transition-all cursor-pointer flex flex-col overflow-hidden"
                >
                  <div className="h-40 bg-stone-100/70 border-b border-[#D1CDC4] flex items-center justify-center p-4 relative overflow-hidden">
                    {asset.mimeType?.startsWith('image/') || asset.name?.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i) ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <FileImage className="h-12 w-12 text-slate-400" />
                    )}
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/75 text-white font-bold text-[9px] uppercase tracking-wider rounded">
                      {asset.name.split('.').pop() || 'FILE'}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-stone-900 truncate" title={asset.name}>
                        {asset.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatFileSize(asset.size)}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#1F4D3A] font-semibold">
                      <span>View details</span>
                      <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Color Palette */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          <div className="bg-[#FAF9F6] border border-[#D1CDC4] p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#C6A15B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Project Design System Tokens
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Click any color swatch or hex value to copy to clipboard
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BRAND_COLORS.map((color) => {
              const isCopied = copiedHex === color.hex;
              return (
                <div
                  key={color.hex}
                  onClick={() => copyToClipboard(color.hex, color.name)}
                  className="bg-white border border-[#D1CDC4] hover:border-[#1F4D3A] cursor-pointer transition-all overflow-hidden group"
                >
                  <div
                    className={`h-24 p-3 flex flex-col justify-between relative ${color.border ? 'border-b border-[#D1CDC4]' : ''}`}
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/20 w-fit ${color.textClass}`}>
                      {color.hex}
                    </span>
                    <div className="self-end">
                      {isCopied ? (
                        <span className="bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-400" /> Copied!
                        </span>
                      ) : (
                        <Copy className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${color.textClass}`} />
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <h4 className="font-bold text-xs text-stone-900">{color.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{color.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Typography */}
      {activeTab === 'typography' && (
        <div className="space-y-6">
          <div className="border border-[#D1CDC4] bg-white">
            <div className="p-4 border-b border-[#D1CDC4] bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-widest text-[#111111]">
                Typography Scale & Hierarchy
              </h3>
              <span className="text-xs font-semibold text-slate-500">Font Family: Geist / Inter / Sans-Serif</span>
            </div>

            <div className="divide-y divide-[#D1CDC4]">
              {TYPOGRAPHY_SPECS.map((spec, i) => (
                <div key={i} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors">
                  <div className="space-y-1 md:w-1/3">
                    <div className="font-bold text-xs uppercase tracking-wider text-[#1F4D3A]">{spec.level}</div>
                    <div className="text-[11px] text-slate-500">Size: <span className="font-semibold text-stone-800">{spec.size}</span> · Weight: <span className="font-semibold text-stone-800">{spec.weight}</span></div>
                    <div className="text-[11px] text-slate-400">{spec.usage}</div>
                  </div>
                  <div className="md:w-2/3 border-l md:border-[#D1CDC4] md:pl-6">
                    <div className="text-stone-900 truncate" style={{ fontSize: spec.level.includes('H1') ? '1.5rem' : spec.level.includes('H2') ? '1.125rem' : '0.875rem' }}>
                      {spec.sample}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Brand Guidelines */}
      {activeTab === 'guidelines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#D1CDC4] p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D1CDC4] pb-3">
              <Info className="h-5 w-5 text-[#1F4D3A]" />
              <h3 className="font-bold text-sm uppercase tracking-widest text-stone-900">Visual Principles</h3>
            </div>
            <ul className="space-y-3 text-xs text-stone-700 leading-relaxed list-disc pl-4">
              <li><strong className="text-stone-900">Editorial Modernism:</strong> Clean typographic rules with crisp `#D1CDC4` hairline borders and `#111111` structural elements.</li>
              <li><strong className="text-stone-900">Color Purpose:</strong> `#1F4D3A` (Forest Green) represents enterprise authority; `#C6A15B` (Gold) indicates active engagement and call to actions.</li>
              <li><strong className="text-stone-900">Status Rigor:</strong> Always use standardized status badges (Todo: Slate, In Progress: Blue, Review: Amber, Completed: Green, Overdue: Red).</li>
            </ul>
          </div>

          <div className="bg-white border border-[#D1CDC4] p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D1CDC4] pb-3">
              <Sparkles className="h-5 w-5 text-[#C6A15B]" />
              <h3 className="font-bold text-sm uppercase tracking-widest text-stone-900">Asset Specifications</h3>
            </div>
            <ul className="space-y-3 text-xs text-stone-700 leading-relaxed list-disc pl-4">
              <li><strong className="text-stone-900">Vector Formats:</strong> Use SVG for vector icons and logos for infinite sharpness across all device pixel densities.</li>
              <li><strong className="text-stone-900">Raster Imagery:</strong> Export screenshots and photos as WebP or high-resolution PNG with transparent backgrounds.</li>
              <li><strong className="text-stone-900">Storage Location:</strong> All project assets are securely stored on AWS S3 with fast distribution through project tenant isolation.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Asset Preview Modal */}
      <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[600px] p-0 overflow-hidden rounded-none border-[#D1CDC4]">
          {selectedAsset && (
            <div className="flex flex-col">
              <DialogHeader className="p-4 border-b border-[#D1CDC4] bg-slate-50">
                <DialogTitle className="text-base font-bold text-stone-900 truncate" title={selectedAsset.name}>
                  {selectedAsset.name}
                </DialogTitle>
                <div className="text-xs text-slate-500 mt-0.5">
                  Uploaded {selectedAsset.createdAt ? new Date(selectedAsset.createdAt).toLocaleDateString() : ''} · {formatFileSize(selectedAsset.size)}
                </div>
              </DialogHeader>

              {/* Image Preview Box */}
              <div className="p-6 bg-stone-100 flex items-center justify-center min-h-[220px] max-h-[350px] overflow-hidden">
                {selectedAsset.mimeType?.startsWith('image/') || selectedAsset.name?.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i) ? (
                  <img
                    src={selectedAsset.url}
                    alt={selectedAsset.name}
                    className="max-h-[300px] max-w-full object-contain shadow-sm bg-white p-2"
                  />
                ) : (
                  <FileImage className="h-20 w-20 text-slate-400" />
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-[#D1CDC4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => copyToClipboard(selectedAsset.url, 'Asset URL')}
                    variant="outline"
                    className="flex-1 sm:flex-none text-xs rounded-none border-[#D1CDC4]"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy URL
                  </Button>
                  <a
                    href={selectedAsset.url}
                    target="_blank"
                    rel="noreferrer"
                    download={selectedAsset.name}
                    className="flex-1 sm:flex-none"
                  >
                    <Button variant="outline" className="w-full text-xs rounded-none border-[#D1CDC4]">
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download
                    </Button>
                  </a>
                </div>

                {user?.role === 'ADMIN' && (
                  <Button
                    onClick={() => deleteAssetMutation.mutate(selectedAsset.id)}
                    disabled={deleteAssetMutation.isPending}
                    variant="destructive"
                    className="w-full sm:w-auto text-xs rounded-none"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    {deleteAssetMutation.isPending ? 'Deleting...' : 'Delete Asset'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
