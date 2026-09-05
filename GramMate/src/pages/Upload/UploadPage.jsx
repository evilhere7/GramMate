import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Video as VideoIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight,
  Sparkles
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

export default function UploadPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState(null);

  const fileInputRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const validateAndSetFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file (MP4, WebM, or MOV).');
      return;
    }

    // 500MB max
    if (file.size > 500 * 1024 * 1024) {
      setErrorMsg('Video file size exceeds the 500MB platform limit.');
      return;
    }

    setVideoFile(file);
    setErrorMsg('');
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
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
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      return;
    }
    if (!title.trim()) {
      setErrorMsg('A video title is required.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      const result = await uploadVideo(videoFile, user.id, {
        title: title.trim(),
        description: description.trim(),
        category,
      });

      setUploadedVideoId(result?.id);
      setUploadSuccess(true);
      toast.success('Your video is live on GramMate!');
    } catch (err) {
      console.error('[UploadPage] Upload error:', err);
      setErrorMsg(err.message || 'Failed to upload video. Please try again.');
      toast.error('Upload failed. Check your connection.');
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md gm-card p-8 text-center border border-[var(--gm-border)]">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Video Published!</h2>
          <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed mb-6">
            Your short video has been uploaded and added to the GramMate global feed.
          </p>

          <div className="space-y-3">
            <Link to="/" className="gm-btn-primary w-full text-xs py-2.5">
              <span>View in Feed</span>
              <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => {
                clearSelectedFile();
                setTitle('');
                setDescription('');
                setUploadSuccess(false);
              }}
              className="gm-btn-secondary w-full text-xs py-2.5"
            >
              Upload Another Video
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 pb-24">
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
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Video Dropzone & Preview */}
        <div className="lg:col-span-6 space-y-4">
          <label className="block text-xs font-bold text-[var(--gm-text-secondary)] uppercase tracking-wider">
            Video File
          </label>

          {videoPreview ? (
            <div className="relative aspect-[9/16] max-h-[500px] w-full rounded-xl overflow-hidden bg-black border border-[var(--gm-border)] mx-auto">
              <video
                src={videoPreview}
                controls
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={clearSelectedFile}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
                title="Remove video"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-[9/16] max-h-[480px] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors ${
                isDragOver 
                  ? 'border-[var(--gm-brand)] bg-[var(--gm-brand-subtle)]' 
                  : 'border-[var(--gm-border-strong)] bg-[var(--gm-surface-elevated)] hover:border-[var(--gm-text-secondary)]'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--gm-surface)] border border-[var(--gm-border)] flex items-center justify-center text-[var(--gm-brand)] mb-4">
                <Upload size={24} />
              </div>
              <h4 className="text-sm font-bold text-[var(--gm-text)] mb-1">
                Select video to upload
              </h4>
              <p className="text-xs text-[var(--gm-text-secondary)] mb-4">
                Or drag and drop file here
              </p>
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
            <label className="block text-xs font-bold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-2">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a compelling title..."
              className="gm-input text-sm"
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what this video is about..."
              className="gm-input text-sm resize-none"
              maxLength={500}
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
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-[var(--gm-border)]">
            <button
              type="submit"
              disabled={isUploading || !videoFile}
              className="gm-btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
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
