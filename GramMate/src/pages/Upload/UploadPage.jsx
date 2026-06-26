import { useAuth } from '../../contexts/AuthContext';
import VideoUpload from '../../components/VideoUpload';
import useProfile from '../../hooks/useProfile';

export default function UploadPage() {
  const { user } = useAuth();
  const { loading, isCreator } = useProfile();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--gm-surface-elevated)]" />
        <div className="mt-8 h-80 animate-pulse rounded-xl bg-[var(--gm-surface-elevated)]" />
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-h1 text-[var(--gm-text)]">Creator access required</h1>
        <p className="mt-2 text-body text-[var(--gm-text-secondary)]">Your profile needs creator access before you can upload videos.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-overline text-[var(--gm-brand-light)]">Upload</p>
        <h1 className="mt-2 text-h1 text-[var(--gm-text)]">Publish a video</h1>
        <p className="mt-2 max-w-2xl text-body text-[var(--gm-text-secondary)]">Upload short or long videos, add metadata, schedule releases, and prepare your content for moderation and compression.</p>
      </header>

      <VideoUpload creatorId={user.id} />
    </div>
  );
}
