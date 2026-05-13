/**
 * DocUpload utilities and sub-components
 */
import { FileText, Image, CheckCircle, XCircle, Trash2, Eye, Loader2 } from 'lucide-react';

export const MAX_FILE_SIZE_MB = 10;

export const ACCEPTED_TYPES = {
  'image/*': ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  '.pdf': ['application/pdf'],
};

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(type) {
  if (type?.startsWith('image/')) return <Image className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
}

export function validateFile(file) {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`;
  }
  const allAllowed = Object.values(ACCEPTED_TYPES).flat();
  const acceptedExts = ['.pdf'];
  const isValid = allAllowed.includes(file.type) || acceptedExts.some(ext => file.name.toLowerCase().endsWith(ext));
  if (!isValid) return 'Invalid file type. Use JPG, PNG, WEBP, or PDF.';
  return null;
}

export function UploadProgress({ progress }) {
  return (
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function StatusIndicator({ status }) {
  if (status === 'success') {
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  }
  if (status === 'error') {
    return <XCircle className="w-5 h-5 text-red-500" />;
  }
  return null;
}

export function UploadedFilePreview({ fileInfo, value, onRemove, onPreview }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600">
        {getFileIcon(fileInfo?.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileInfo?.name || 'Document'}</p>
        <p className="text-xs text-muted-foreground">
          {fileInfo ? formatBytes(fileInfo.size) : 'Uploaded'}
        </p>
      </div>
      <div className="flex gap-1">
        {value && (
          <button
            type="button"
            onClick={onPreview}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          title="Remove"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}

export function UploadingState({ fileInfo, progress }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileInfo?.name}</p>
        <UploadProgress progress={progress} />
      </div>
      <span className="text-xs text-muted-foreground">{progress}%</span>
    </div>
  );
}

export function ValidationError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
      <XCircle className="w-3 h-3" />
      {message}
    </p>
  );
}
