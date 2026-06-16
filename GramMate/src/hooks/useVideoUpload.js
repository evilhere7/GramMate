import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/supabase/client';

const MAX_WARN_SIZE = 500 * 1024 * 1024;

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

function uploadWithProgress({ bucket, path, file, token, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader('cache-control', '31536000');
    xhr.setRequestHeader('content-type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      try {
        const response = JSON.parse(xhr.responseText);
        reject(new Error(response.message || response.error || 'Upload failed, please try again'));
      } catch {
        reject(new Error('Upload failed, please try again'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload. Please check your connection.'));
    xhr.send(file);
  });
}

export function useVideoUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [sizeWarning, setSizeWarning] = useState(null);

  const reset = useCallback(() => {
    setProgress(0);
    setUploading(false);
    setError(null);
    setUploadedVideo(null);
    setSizeWarning(null);
  }, []);

  const uploadVideo = useCallback(async ({ file, creatorId, title, description, status = 'draft' }) => {
    if (!file) throw new Error('Choose a video file before uploading.');
    if (!creatorId) throw new Error('You must be signed in as a creator to upload videos.');

    setUploading(true);
    setError(null);
    setUploadedVideo(null);
    setProgress(0);
    setSizeWarning(file.size > MAX_WARN_SIZE ? 'This file is larger than 500MB and may take a while to upload.' : null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Your session expired. Please sign in again.');

      const ext = sanitizeFileName(file.name.split('.').pop() || 'mp4');
      const path = `${creatorId}/${crypto.randomUUID()}.${ext}`;

      await uploadWithProgress({
        bucket: 'videos',
        path,
        file,
        token,
        onProgress: setProgress,
      });

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { data, error: insertError } = await supabase
        .from('videos')
        .insert({
          creator_id: creatorId,
          user_id: creatorId,
          title: title.trim(),
          description: description?.trim() || null,
          video_url: publicUrl,
          thumbnail_url: publicUrl,
          status,
          visibility: status === 'published' ? 'public' : 'private',
          processing_status: 'ready',
          moderation_status: 'approved',
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      setProgress(100);
      setUploadedVideo(data);
      return data;
    } catch (uploadError) {
      const friendly = uploadError?.message || 'Upload failed, please try again';
      setError(friendly);
      throw new Error(friendly);
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadVideo, progress, uploading, error, uploadedVideo, sizeWarning, reset };
}

export default useVideoUpload;
