import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, CheckCircle, FileVideo, ImagePlus, Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useVideoUpload } from '../hooks/useVideoUpload';

const MAX_WARN_SIZE = 500 * 1024 * 1024;

export default function VideoUpload({ creatorId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [formErrors, setFormErrors] = useState({});
  const { uploadVideo, progress, uploading, error, uploadedVideo, sizeWarning, reset } = useVideoUpload();

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const onDrop = useCallback((acceptedFiles) => {
    const selected = acceptedFiles?.[0];
    if (!selected) return;
    reset();
    setFile(selected);
    setFormErrors((prev) => ({ ...prev, file: null }));
    if (selected.size > MAX_WARN_SIZE) {
      toast.warn('This video is larger than 500MB and may take a while to upload.');
    }
  }, [reset]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    maxFiles: 1,
    noClick: false,
    noKeyboard: false,
  });

  const validate = () => {
    const nextErrors = {};
    if (!file) nextErrors.file = 'Select a video file to upload.';
    if (!title.trim()) nextErrors.title = 'Add a title before uploading.';
    if (title.trim().length > 120) nextErrors.title = 'Title must be 120 characters or less.';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    reset();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      const video = await uploadVideo({ file, creatorId, title, description, status });
      toast.success(status === 'published' ? 'Video published.' : 'Video saved as draft.');
      onUploaded?.(video);
      setFile(null);
      setTitle('');
      setDescription('');
      setStatus('draft');
      setFormErrors({});
    } catch (uploadError) {
      toast.error(uploadError.message || 'Upload failed, please try again');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        {!file ? (
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
              isDragActive ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100'
            } ${formErrors.file ? 'border-red-300 bg-red-50' : ''}`}
          >
            <input {...getInputProps()} aria-label="Upload video file" />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <UploadCloud size={30} />
            </div>
            <p className="mt-5 text-xl font-bold text-slate-950">Select video to upload</p>
            <p className="mt-2 text-sm text-slate-500">Drag and drop or click to browse. Videos over 500MB will show a warning.</p>
            {formErrors.file && <p className="mt-3 text-sm font-semibold text-red-600">{formErrors.file}</p>}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="aspect-video bg-slate-950">
              <video src={previewUrl} className="h-full w-full object-contain" controls preload="metadata" />
            </div>
            <div className="flex items-start gap-4 p-5">
              <div className="rounded-md bg-blue-50 p-3 text-blue-700"><FileVideo size={28} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-950">{file.name}</p>
                <p className="mt-1 text-sm text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                {(file.size > MAX_WARN_SIZE || sizeWarning) && (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                    <AlertCircle size={16} /> {sizeWarning || 'This file is larger than 500MB.'}
                  </p>
                )}
              </div>
              <button type="button" onClick={clearFile} disabled={uploading} className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50" aria-label="Remove selected video">
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full rounded-md border px-3 py-3 transition focus:border-blue-600 ${formErrors.title ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              placeholder="Give your video a clear title"
              disabled={uploading}
            />
            {formErrors.title && <span className="mt-2 block text-sm font-semibold text-red-600">{formErrors.title}</span>}
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">Description</span>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-md border border-slate-300 px-3 py-3 transition focus:border-blue-600"
              placeholder="Add context, credits, and useful hashtags"
              disabled={uploading}
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={uploading} className="w-full rounded-md border border-slate-300 px-3 py-3 transition focus:border-blue-600 disabled:opacity-60">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
        </div>

        {uploading && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Uploading video</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        {uploadedVideo && <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700"><CheckCircle size={20} /> Upload complete.</div>}

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button type="button" onClick={clearFile} disabled={uploading || !file} className="rounded-md px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">Discard</button>
          <button type="button" onClick={open} disabled={uploading} className="rounded-md border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Browse</button>
          <button type="submit" disabled={!file || !title.trim() || uploading} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
            {uploading && <Loader2 size={18} className="animate-spin" />}
            {uploading ? 'Uploading...' : 'Upload video'}
          </button>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <ImagePlus size={22} className="text-blue-600" />
          <h2 className="mt-4 text-xl font-bold text-slate-950">Thumbnail preview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">After upload, the video preview is saved as the initial thumbnail until processing generates richer options.</p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
          <h2 className="text-xl font-bold">Creator checklist</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>Use a descriptive title.</p>
            <p>Keep reused music and licensed assets credited.</p>
            <p>Publish when the video is ready for the public feed.</p>
          </div>
        </section>
      </aside>
    </form>
  );
}
