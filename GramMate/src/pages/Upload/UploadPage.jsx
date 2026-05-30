import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileVideo, X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setError(null);
    setProgress(10); // Simulated start progress

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      // 1. Upload video to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setProgress(50);

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      setProgress(75);

      // 3. Create database record
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title,
          description,
          video_url: publicUrl,
          created_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      setProgress(100);
      setSuccess(true);
      setFile(null);
      setTitle('');
      setDescription('');

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setProgress(0);
      }, 3000);

    } catch (err) {
      console.error('Upload Error:', err);
      setError(err.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
        <p className="text-gray-400">Share your content and start earning.</p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-xl mb-6 flex items-center gap-3"
        >
          <CheckCircle size={20} />
          <span>Video uploaded successfully! It is now live on your profile.</span>
        </motion.div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        {/* Drag & Drop Zone */}
        {!file ? (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-gray-800 bg-gray-900/50 hover:bg-gray-900'
            }`}
          >
            <input {...getInputProps()} />
            <div className="bg-gray-800 p-4 rounded-full mb-4">
              <UploadCloud size={32} className={isDragActive ? 'text-primary' : 'text-gray-400'} />
            </div>
            <p className="text-white font-semibold text-lg mb-2">Select video to upload</p>
            <p className="text-gray-500 text-sm text-center">Or drag and drop a file</p>
            <p className="text-gray-500 text-xs mt-4">MP4 or WebM • Up to 50MB</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex items-start gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl text-primary">
              <FileVideo size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium truncate mb-1">{file.name}</h3>
              <p className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button 
              type="button"
              onClick={() => setFile(null)}
              className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Caption</label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a catchy title..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Description & Hashtags</label>
            <textarea 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video #grammate #trending..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              disabled={uploading}
            />
          </div>
        </div>

        {uploading && (
          <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="pt-4 flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => {
              setFile(null);
              setTitle('');
              setDescription('');
            }}
            disabled={uploading}
            className="px-6 py-3 rounded-xl font-medium text-white hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            Discard
          </button>
          <button 
            type="submit"
            disabled={!file || !title || uploading}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Post Video'}
          </button>
        </div>
      </form>
    </div>
  );
}
