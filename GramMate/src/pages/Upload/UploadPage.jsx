import { useAuth } from '../../contexts/AuthContext';
import VideoUpload from '../../components/VideoUpload';
import useProfile from '../../hooks/useProfile';

export default function UploadPage() {
  const { user } = useAuth();
  const { loading, isCreator } = useProfile();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-md bg-slate-200" />
        <div className="mt-8 h-80 animate-pulse rounded-lg bg-slate-200" />
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-950">Creator access required</h1>
        <p className="mt-3 text-slate-600">Your profile needs creator access before you can upload videos.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Upload</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">Publish a video</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Upload short or long videos, add metadata, schedule releases, and prepare your content for moderation and compression.</p>
      </header>

      <VideoUpload creatorId={user.id} />
    </div>
  );
}
