/**
 * DocUpload - Document upload component (refactored)
 */
import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  validateFile,
  formatBytes,
  UploadedFilePreview,
  UploadingState,
  ValidationError
} from './DocUploadParts';

export default function DocUpload({
  label,
  hint,
  icon: Icon,
  value,
  onChange,
  accept = 'image/*,.pdf',
  capture,
  disabled = false,
}) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrorMsg(error);
      setStatus('error');
      return;
    }

    setFileInfo({ name: file.name, size: file.size, type: file.type });
    setStatus('uploading');
    setErrorMsg('');

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
      setErrorMsg(err.message || 'Upload failed. Please try again.');
      toast.error('Upload failed');
    }
  };

  const handleRemove = () => {
    setStatus('idle');
    setProgress(0);
    setFileInfo(null);
    setErrorMsg('');
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handlePreview = () => {
    if (value) window.open(value, '_blank');
  };

  const handleClick = () => {
    if (!disabled && status !== 'uploading') inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm font-medium">{label}</span>
      </div>

      {/* Upload area or preview */}
      {status === 'success' && value ? (
        <UploadedFilePreview
          fileInfo={fileInfo}
          value={value}
          onRemove={handleRemove}
          onPreview={handlePreview}
        />
      ) : status === 'uploading' ? (
        <UploadingState fileInfo={fileInfo} progress={progress} />
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={`
            w-full p-6 border-2 border-dashed rounded-xl transition-colors
            flex flex-col items-center gap-2 text-center
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5 cursor-pointer'}
            ${status === 'error' ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-border'}
          `}
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {capture === 'user' ? 'Take selfie' : 'Tap to upload'}
            </p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </button>
      )}

      <ValidationError message={errorMsg} />

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
