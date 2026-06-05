import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Bookmark, Flag, Heart, MessageCircle, Search, Share2, UserPlus } from 'lucide-react';
import { videos } from '../../data/platformData';

const feedTabs = ['Recommended', 'Trending', 'Following', 'Search'];

function EngagementTracker({ isActive, rewardRate }) {
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    if (!isActive) return undefined;
    const interval = setInterval(() => setEarned((prev) => prev + 0.0003), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="absolute left-4 top-4 z-20 rounded-md bg-white px-3 py-2 text-slate-950 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Earning</p>
      <p className="text-sm font-bold">${earned.toFixed(4)} <span className="font-medium text-slate-500">at {rewardRate}</span></p>
    </div>
  );
}

export default function VideoFeed() {
  const [activeVideo, setActiveVideo] = useState(0);
  const [activeTab, setActiveTab] = useState('Recommended');
  const [liked, setLiked] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveVideo(Number(entry.target.getAttribute('data-index')));
        });
      },
      { threshold: 0.6 }
    );

    const videoNodes = document.querySelectorAll('.video-container');
    videoNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid h-[calc(100vh-3.5rem)] bg-slate-950 md:h-screen lg:grid-cols-[1fr_360px]">
      <section ref={containerRef} className="relative h-full snap-y snap-mandatory overflow-y-scroll bg-black no-scrollbar" aria-label="Video feed">
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-black/80 p-3 backdrop-blur">
          {feedTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {videos.map((video, index) => {
          const isActive = index === activeVideo;
          return (
            <article
              key={video.id}
              data-index={index}
              className="video-container relative flex h-[calc(100vh-7rem)] snap-start items-center justify-center bg-black md:h-screen"
            >
              <video
                className="absolute h-full w-full object-cover"
                src={video.url}
                loop
                muted
                autoPlay={isActive}
                playsInline
                preload={index === 0 ? 'auto' : 'metadata'}
                aria-label={video.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
              <EngagementTracker isActive={isActive} rewardRate={video.rewardRate} />

              <div className="absolute bottom-6 left-4 z-20 max-w-[72%] text-white md:left-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white/15 px-2 py-1 text-xs font-bold backdrop-blur">{video.category}</span>
                  <span className="rounded-md bg-green-500 px-2 py-1 text-xs font-bold text-white">{video.rewardRate}</span>
                </div>
                <h2 className="text-2xl font-bold">{video.title}</h2>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
                  @{video.handle}
                  {video.verified && <BadgeCheck size={16} className="text-blue-400" aria-label="Verified creator" />}
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">{video.description}</p>
              </div>

              <div className="absolute bottom-8 right-4 z-20 flex flex-col items-center gap-4">
                <button onClick={() => setLiked((state) => ({ ...state, [video.id]: !state[video.id] }))} className="group flex flex-col items-center gap-1 text-white" aria-label="Like video">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur group-hover:bg-white group-hover:text-slate-950">
                    <Heart size={23} fill={liked[video.id] ? 'currentColor' : 'none'} />
                  </span>
                  <span className="text-xs font-bold">{video.likes}</span>
                </button>
                {[
                  [MessageCircle, video.comments, 'Comment'],
                  [Share2, video.shares, 'Share'],
                  [Bookmark, video.saves, 'Save'],
                  [UserPlus, 'Follow', 'Follow creator'],
                  [Flag, 'Report', 'Report content'],
                ].map(([Icon, label, aria]) => (
                  <button key={aria} className="group flex flex-col items-center gap-1 text-white" aria-label={aria}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur group-hover:bg-white group-hover:text-slate-950">
                      <Icon size={22} />
                    </span>
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <aside className="hidden border-l border-slate-800 bg-slate-950 p-6 text-white lg:block">
        <label className="relative block">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} aria-hidden="true" />
          <input className="w-full rounded-md border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500" placeholder="Search videos, creators, topics" />
        </label>
        <div className="mt-8">
          <h2 className="text-lg font-bold">Feed controls</h2>
          <div className="mt-4 space-y-3">
            {['Reward eligible only', 'Hide reported creators', 'Show long videos', 'Auto-save liked videos'].map((control) => (
              <label key={control} className="flex items-center justify-between rounded-md border border-slate-800 p-3 text-sm font-semibold text-slate-200">
                {control}
                <input type="checkbox" className="h-4 w-4 accent-blue-600" defaultChecked={control !== 'Show long videos'} />
              </label>
            ))}
          </div>
        </div>
        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h3 className="font-bold">Reward integrity</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Rewards are calculated from verified watch time, engagement quality, and campaign rules. Suspicious traffic is held before payout.</p>
        </div>
      </aside>
    </div>
  );
}
