import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CalendarClock, CheckCircle, FileVideo, ImagePlus, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { uploadChecklist } from '../../data/platformData';

export default function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Creator Tips');
  const [visibility, setVisibility] = useState('public');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm'],
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 1024,
  });

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setProgress(0);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, file, {
        cacheControl: '31536000',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      setProgress(50);
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);
      setProgress(75);

      const { error: dbError } = await supabase.from('videos').insert({
        user_id: user.id,
        title,
        description,
        category,
        visibility,
        processing_status: 'queued',
        moderation_status: 'pending',
        video_url: publicUrl,
        created_at: new Date().toISOString(),
      });
      if (dbError) throw dbError;

      setProgress(100);
      setSuccess(true);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Upload</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">Publish a video</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Upload short or long videos, add metadata, schedule releases, and prepare your content for moderation and compression.</p>
      </header>

      {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      {success && <div className="mb-6 flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700"><CheckCircle size={20} /> Video queued for processing.</div>}

      <form onSubmit={handleUpload} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          {!file ? (
            <div {...getRootProps()} className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${isDragActive ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>
              <input {...getInputProps()} aria-label="Upload video file" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <UploadCloud size={30} />
              </div>
              <p className="mt-5 text-xl font-bold text-slate-950">Select video to upload</p>
              <p className="mt-2 text-sm text-slate-500">Drag and drop MP4, MOV, or WebM. Up to 1GB.</p>
            </div>
          ) : (
            <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5">
              <div className="rounded-md bg-blue-50 p-3 text-blue-700"><FileVideo size={28} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-950">{file.name}</p>
                <p className="mt-1 text-sm text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={() => setFile(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Remove selected video"><X size={20} /></button>
            </div>
          )}

          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">Title</span>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-3" placeholder="Give your video a clear title" disabled={uploading} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">Description and hashtags</span>
              <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full resize-none rounded-md border border-slate-300 px-3 py-3" placeholder="Add context, credits, and useful hashtags" disabled={uploading} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-3">
                  {['Creator Tips', 'Food', 'Finance', 'Comedy', 'Education', 'Music'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">Visibility</span>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-3">
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </label>
            </div>
          </div>

          {uploading && <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} disabled={uploading} className="rounded-md px-5 py-3 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60">Discard</button>
            <button type="submit" disabled={!file || !title || uploading} className="rounded-md bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{uploading ? 'Uploading...' : 'Post video'}</button>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <ImagePlus size={22} className="text-blue-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">Thumbnail workflow</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Upload a thumbnail or let GramMate generate three choices after compression finishes.</p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <CalendarClock size={22} className="text-blue-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">Scheduled uploads</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Schedule visibility changes and campaign windows from Creator Studio.</p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
            <ShieldCheck size={22} className="text-green-400" />
            <h2 className="mt-4 text-xl font-bold">Before distribution</h2>
            <div className="mt-4 space-y-3">
              {uploadChecklist.map((item) => <p key={item} className="text-sm leading-6 text-slate-300">{item}</p>)}
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
