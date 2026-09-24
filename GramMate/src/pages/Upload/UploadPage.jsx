import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Video as VideoIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight,
  FileText,
  FolderUp,
  LogIn,
  RefreshCw
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { uploadVideo } from '../../services/supabaseService';

const CATEGORIES = [
  'Entertainment',
  'Tech & AI',
  'Music & Beats',
  'Gaming',
  'Lifestyle & Travel',
  'Education & Tips',
];

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Upload Pipeline Stages (idle, selecting, validating, uploading, processing, saving, success, error, cancelled)
export default function UploadPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Upload States
  const [uploadStage, setUploadStage] = useState('idle'); // idle | selecting | validating | uploading | processing | saving | success | error | cancelled
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadedVideoId, setUploadedVideoId] = useState(null);

  const fileInputRef = useRef(null);
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const isUploading = ['uploading', 'processing', 'saving'].includes(uploadStage);

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const validateAndSetFile = (file) => {
    if (!file) {
      setUploadStage('idle');
      return;
    }

    setUploadStage('validating');
    setPreviewError(false);

    const fileName = (file.name || '').toLowerCase();
    const fileExt = fileName.split('.').pop() || '';
    const allowedExtensions = ['mp4', 'webm', 'mov', 'mkv', 'm4v', 'mpeg', 'mpg', 'ogg'];
    const hasValidType = file.type && file.type.startsWith('video/');
    const hasValidExt = allowedExtensions.includes(fileExt);

    if (!hasValidType && !hasValidExt) {
      setErrorMsg('Please select a valid video file (MP4, WebM, MOV, or MKV).');
      setUploadStage('error');
      return;
    }

    // 500MB platform limit
    if (file.size > 500 * 1024 * 1024) {
      setErrorMsg('Video file size exceeds the 500MB platform limit. Please choose a smaller file.');
      setUploadStage('error');
      return;
    }

    if (file.size <= 0) {
      setErrorMsg('Selected video file is empty. Please choose a valid file.');
      setUploadStage('error');
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(file);
    setErrorMsg('');
    try {
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    } catch {
      setPreviewError(true);
    }
    setUploadStage('idle');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const clearSelectedFile = () => {
    if (isUploading) {
      setUploadStage('cancelled');
      toast.info('Upload cancelled.');
    }
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrorMsg('');
    setUploadProgress(0);
    setUploadStatusText('');
    setPreviewError(false);
    setUploadStage('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to publish content.');
      navigate('/login');
      return;
    }

    if (!videoFile) {
      setErrorMsg('Please choose a video to upload.');
      setUploadStage('error');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('A video title is required.');
      setUploadStage('error');
      return;
    }

    setUploadStage('uploading');
    setErrorMsg('');
    setUploadProgress(10);
    setUploadStatusText('Preparing video for upload...');

    try {
      const result = await uploadVideo(videoFile, user.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        onProgress: (pct) => {
          setUploadProgress(pct);
        },
        onStatus: (statusText) => {
          setUploadStatusText(statusText);
          if (statusText.toLowerCase().includes('poster') || statusText.toLowerCase().includes('processing')) {
            setUploadStage('processing');
          } else if (statusText.toLowerCase().includes('publishing') || statusText.toLowerCase().includes('database')) {
            setUploadStage('saving');
          }
        },
      });

      setUploadProgress(100);
      setUploadStatusText('Published successfully!');
      setUploadedVideoId(result?.id);
      setUploadStage('success');
      toast.success('Your video is live on GramMate!');
    } catch (err) {
      console.error('[UploadPage] Upload pipeline error:', err);
      setUploadStage('error');
      const friendly = err?.message || 'Unable to upload your video right now. Please try again.';
      setErrorMsg(friendly);
      toast.error('Upload failed. See details below.');
    }
  };

  // If user is not authenticated and auth check finished
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md gm-card p-8 text-center border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] shadow-lg">
          <div className="w-12 h-12 rounded-full bg-[var(--gm-brand-subtle)] text-[var(--gm-brand)] flex items-center justify-center mx-auto mb-4">
            <VideoIcon size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-[var(--gm-text)]">Creator Studio</h2>
          <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed mb-6">
            Sign in to your GramMate account to publish videos, build your audience, and start earning rewards.
          </p>
          <Link
            to="/login"
            state={{ from: { pathname: '/upload' } }}
            className="gm-btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 font-bold"
          >
            <LogIn size={14} />
            <span>Sign In to Continue</span>
          </Link>
        </div>
      </div>
    );
  }

  if (uploadStage === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md gm-card p-8 text-center border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] shadow-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-[var(--gm-text)]">Video Published!</h2>
          <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed mb-6">
            Your short video has been uploaded successfully and is now live in the GramMate community feed.
          </p>

          <div className="space-y-3">
            <Link to="/" className="gm-btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2 font-bold">
              <span>View in Feed</span>
              <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={() => {
                clearSelectedFile();
                setTitle('');
                setDescription('');
                setUploadStage('idle');
              }}
              className="gm-btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2 font-semibold"
            >
              <RefreshCw size={14} />
              <span>Upload Another Video</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 pb-24 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[var(--gm-border)]">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--gm-text)]">
            Creator Studio
          </h1>
          <p className="text-xs text-[var(--gm-text-secondary)] mt-1">
            Publish high-quality short-form video to your community.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-3">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1 font-medium">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="p-1 hover:bg-red-500/10 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Video Dropzone & Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[var(--gm-text-secondary)] uppercase tracking-wider">
              Video File
            </label>
            {videoFile && (
              <span className="text-[11px] font-semibold text-[var(--gm-text-tertiary)]">
                {formatBytes(videoFile.size)}
              </span>
            )}
          </div>

          {videoPreview ? (
            <div className="space-y-3">
              <div className="relative aspect-[9/16] max-h-[460px] w-full rounded-xl overflow-hidden bg-black border border-[var(--gm-border-strong)] mx-auto shadow-md flex items-center justify-center">
                {previewError ? (
                  <div className="p-6 text-center text-xs text-[var(--gm-text-secondary)] space-y-2">
                    <VideoIcon size={32} className="mx-auto text-[var(--gm-brand)] opacity-80" />
                    <p className="font-semibold text-[var(--gm-text)]">{videoFile.name}</p>
                    <p className="text-[11px] text-[var(--gm-text-tertiary)]">
                      In-browser preview not supported for this codec/container ({videoFile.type || 'video'}), but file is ready to upload.
                    </p>
                  </div>
                ) : (
                  <video
                    src={videoPreview}
                    controls
                    playsInline
                    onError={() => setPreviewError(true)}
                    className="w-full h-full object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  disabled={isUploading}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors disabled:opacity-50 z-10"
                  title="Remove video"
                >
                  <X size={16} />
                </button>
              </div>

              {/* File details card */}
              <div className="p-3 rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--gm-brand-subtle)] text-[var(--gm-brand)] flex items-center justify-center shrink-0">
                    <VideoIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--gm-text)] truncate">
                      {videoFile.name}
                    </p>
                    <p className="text-[10px] text-[var(--gm-text-tertiary)]">
                      {formatBytes(videoFile.size)} • {videoFile.type || 'video'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearSelectedFile}
                  disabled={isUploading}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-[var(--gm-surface)] transition-colors disabled:opacity-50"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-[9/16] max-h-[460px] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                isDragOver 
                  ? 'border-[var(--gm-brand)] bg-[var(--gm-brand-subtle)]' 
                  : 'border-[var(--gm-border-strong)] bg-[var(--gm-surface-elevated)] hover:border-[var(--gm-text-secondary)]'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--gm-surface)] border border-[var(--gm-border)] flex items-center justify-center text-[var(--gm-brand)] mb-4 shadow-sm">
                <Upload size={24} />
              </div>
              <h4 className="text-sm font-bold text-[var(--gm-text)] mb-1">
                Select video to upload
              </h4>
              <p className="text-xs text-[var(--gm-text-secondary)] mb-4">
                Or drag and drop file here
              </p>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="gm-btn-secondary text-xs px-4 py-2 mb-3 pointer-events-auto"
              >
                Browse Video
              </button>

              <span className="text-[11px] text-[var(--gm-text-tertiary)]">
                MP4, WebM, or MOV up to 500MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Right Column: Metadata Details */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[var(--gm-text-secondary)] uppercase tracking-wider">
                Title
              </label>
              <span className="text-[10px] text-[var(--gm-text-tertiary)]">
                {title.length}/120
              </span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a compelling title..."
              className="gm-input text-sm"
              maxLength={120}
              disabled={isUploading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[var(--gm-text-secondary)] uppercase tracking-wider">
                Description
              </label>
              <span className="text-[10px] text-[var(--gm-text-tertiary)]">
                {description.length}/500
              </span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what this video is about, add tags or credits..."
              className="gm-input text-sm resize-none"
              maxLength={500}
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="gm-input text-sm"
              disabled={isUploading}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Upload Progress Bar (shown when uploading) */}
          {isUploading && (
            <div className="p-4 rounded-xl bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--gm-text)]">
                  {uploadStatusText || 'Uploading video...'}
                </span>
                <span className="font-bold text-[var(--gm-brand)]">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-[var(--gm-surface)] rounded-full overflow-hidden border border-[var(--gm-border)]">
                <div 
                  className="h-full bg-[var(--gm-brand)] transition-all duration-200 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--gm-border)] flex items-center gap-3">
            {videoFile && (
              <button
                type="button"
                onClick={clearSelectedFile}
                disabled={isUploading}
                className="gm-btn-secondary text-xs py-3 px-4 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isUploading || !videoFile || !title.trim()}
              className="gm-btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} />
              <span>{isUploading ? 'Publishing to GramMate...' : 'Publish Video'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
