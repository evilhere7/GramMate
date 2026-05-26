import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, DollarSign } from 'lucide-react';

const DUMMY_VIDEOS = [
  {
    id: '1',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    author: '@creator_one',
    description: 'Check out this amazing landscape! 🏔️ #nature #travel',
    likes: '124K',
    comments: '4.2K',
    shares: '12K',
    rewardRate: '$0.02/min'
  },
  {
    id: '2',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    author: '@adventure_time',
    description: 'Running from responsibilities like... 🏃💨 #comedy',
    likes: '89K',
    comments: '1.1K',
    shares: '5K',
    rewardRate: '$0.015/min'
  },
];

const EngagementTracker = ({ rewardRate, isActive }) => {
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    let interval;
    if (isActive) {
      // Simulate earning every second (0.0003 per second roughly for $0.02/min)
      interval = setInterval(() => {
        setEarned(prev => prev + 0.0003);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive && earned === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-20 left-4 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-primary/30 shadow-[0_0_15px_rgba(255,46,99,0.3)] z-20"
    >
      <div className="bg-primary/20 p-1 rounded-full text-primary animate-pulse">
        <DollarSign size={16} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-300 font-medium leading-none">EARNING</span>
        <span className="text-sm font-bold text-white leading-tight">${earned.toFixed(4)}</span>
      </div>
    </motion.div>
  );
};

export default function VideoFeed() {
  const [activeVideo, setActiveVideo] = useState(0);
  const containerRef = useRef(null);

  // Intersection Observer for snap scrolling auto-play
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveVideo(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    const videoNodes = document.querySelectorAll('.video-container');
    videoNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="h-full w-full snap-y snap-mandatory overflow-y-scroll no-scrollbar bg-black relative"
    >
      {DUMMY_VIDEOS.map((video, index) => {
        const isActive = index === activeVideo;
        
        return (
          <div 
            key={video.id} 
            data-index={index}
            className="video-container relative h-[calc(100vh-64px)] md:h-screen w-full snap-center bg-black flex justify-center items-center"
          >
            {/* The Video Element */}
            <video
              className="absolute h-full w-full object-cover"
              src={video.url}
              loop
              muted={false}
              autoPlay={isActive}
              playsInline
            />

            {/* Engagement Tracker Overlay */}
            <EngagementTracker rewardRate={video.rewardRate} isActive={isActive} />

            {/* Video Info Overlay */}
            <div className="absolute bottom-4 left-4 z-10 w-3/4">
              <h2 className="text-white font-bold text-lg mb-1">{video.author}</h2>
              <p className="text-gray-200 text-sm mb-2">{video.description}</p>
            </div>

            {/* Action Buttons Sidebar */}
            <div className="absolute right-4 bottom-20 z-10 flex flex-col items-center gap-6">
              <button className="group flex flex-col items-center gap-1">
                <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm transition-transform group-active:scale-90 border border-transparent group-hover:border-white/20">
                  <Heart className="text-white fill-transparent transition-colors group-hover:fill-primary group-hover:text-primary" size={28} />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">{video.likes}</span>
              </button>
              
              <button className="group flex flex-col items-center gap-1">
                <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm transition-transform group-active:scale-90 border border-transparent group-hover:border-white/20">
                  <MessageCircle className="text-white" size={28} />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">{video.comments}</span>
              </button>

              <button className="group flex flex-col items-center gap-1">
                <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm transition-transform group-active:scale-90 border border-transparent group-hover:border-white/20">
                  <Share2 className="text-white" size={28} />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">{video.shares}</span>
              </button>
            </div>
            
            {/* Play/Pause overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
}
