import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle, XCircle, Loader2, FileText, Image, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = {
  'image/*': ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  '.pdf': ['application/pdf'],
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type) {
  if (type?.startsWith('image/')) return <Image className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
}

export default function DocUpload({
  label,
  hint,
  icon: Icon,
  value,           // currently uploaded URL
  onChange,        // (url) => void
  accept = 'image/*,.pdf',
  capture,         // e.g. "user" for selfie
  disabled = false,
}) {
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [progress, setProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const validate = (file) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    const allAllowed = Object.values(ACCEPTED_TYPES).flat();
    const acceptedExts = ['.pdf'];
    const isValid = allAllowed.includes(file.type) || acceptedExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValid) return 'Invalid file type. Use JPG, PNG, WEBP, or PDF.';
    return null;
  };

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validate(file);
    if (error) {
      setErrorMsg(error);
      setStatus('error');
      return;
    }

    setFileInfo({ name: file.name, size: file.size, type: file.type });
    setStatus('uploading');
    setErrorMsg('');

    // Simulate progress ticks while uploading
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + Math.random() * 20, 85);
      setProgress(Math.round(p));
    }, 200);

    try {
       const { file_url } = await base44.integrations.Core.UploadFile({ file });
       clearInterval(interval);
       setProgress(100);
       setTimeout(() => {
         setStatus('success');
         onChange(file_url);
         toast.success('Document uploaded successfully');
       }, 300);
     } catch (err) {
       clearInterval(interval);
       setStatus('error');
       setErrorMsg('Upload failed. Please try again.');
       toast.error('Upload failed');
     }
  };

  const handleRemove = () => {
    onChange('');
    setStatus('idle');
    setFileInfo(null);
    setProgress(0);
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const isUploaded = status === 'success' || (value && status === 'idle');

  // Generate a simple blur hash placeholder (blurred background color)
  const blurPlaceholderColor = 'rgba(100, 116, 139, 0.1)';

  // Render different states as separate functions for clarity
  const renderUploadedState = () => (
    <div className="flex items-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
        <CheckCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-700">
          {fileInfo ? fileInfo.name : 'Document uploaded'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {fileInfo && (
            <span className="text-xs text-emerald-600">{formatBytes(fileInfo.size)}</span>
          )}
          <span className="text-xs text-emerald-600">· Securely stored</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
            title="Preview document"
          >
            <Eye className="w-4 h-4" />
          </a>
        )}
        {!disabled && (
          <button
            onClick={handleRemove}
            className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 hover:text-red-500 transition-colors"
            title="Remove document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  const renderUploadingState = () => (
    <div className="p-5 border-2 border-primary/30 bg-primary/5 rounded-2xl space-y-3">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileInfo?.name}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(fileInfo?.size || 0)}</p>
        </div>
        <span className="text-sm font-semibold text-primary">{progress}%</span>
      </div>
      <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">Uploading securely...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-600 flex-1">{errorMsg}</p>
      </div>
      <label className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <Upload className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Try again</span>
        <input ref={inputRef} type="file" accept={accept} capture={capture} className="hidden" onChange={handleChange} disabled={disabled} />
      </label>
    </div>
  );

  const renderIdleState = () => (
    <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
        {Icon ? <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" /> : <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">Tap to upload</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF · Max {MAX_FILE_SIZE_MB}MB</p>
      </div>
      <input ref={inputRef} type="file" accept={accept} capture={capture} className="hidden" onChange={handleChange} disabled={disabled} />
    </label>
  );

  // Determine which state to render
  const renderContent = () => {
    if (isUploaded) return renderUploadedState();
    if (status === 'uploading') return renderUploadingState();
    if (status === 'error') return renderErrorState();
    return renderIdleState();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-muted-foreground block">{label}</label>
      )}
      {renderContent()}
    </div>
  );
}