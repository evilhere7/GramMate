import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Settings, Play, Image as ImageIcon, MapPin, Link as LinkIcon, BadgeCheck } from 'lucide-react';

export default function CreatorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileAndVideos();
    }
  }, [user]);

  const fetchProfileAndVideos = async () => {
    try {
      // For this skeleton, we're assuming the profiles table is created via Supabase triggers.
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setProfile(profileData || { 
        username: user.email.split('@')[0],
        full_name: user.email.split('@')[0],
        avatar_url: null,
        bio: "Welcome to my GramMate profile! 👋 Watch my videos and earn together.",
        followers_count: 1240,
        following_count: 85,
        is_verified: true
      });

      // Dummy videos since we might not have a populated DB yet
      setVideos([
        { id: 1, thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80', views: '12K' },
        { id: 2, thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&q=80', views: '8.4K' },
        { id: 3, thumbnail: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=500&q=80', views: '45K' },
        { id: 4, thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&q=80', views: '2K' },
      ]);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null; // Controlled by global loader or layout usually

  return (
    <div className="w-full h-full bg-black overflow-y-auto no-scrollbar pb-24 md:pb-8">
      {/* Profile Header Background */}
      <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary/40 to-secondary/40 relative">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24">
        {/* Profile Info Section */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-black bg-gray-900 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={40} className="text-gray-600" />
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  {profile.full_name}
                  {profile.is_verified && <BadgeCheck className="text-secondary" size={24} />}
                </h1>
                <p className="text-gray-400 font-medium text-lg">@{profile.username}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Edit Profile
                </button>
                <button className="p-2 border border-gray-800 bg-gray-900 rounded-xl text-white hover:bg-gray-800 transition-colors">
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bio & Stats */}
        <div className="mb-8">
          <p className="text-gray-200 mb-4 max-w-2xl">{profile.bio}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
            <div className="flex items-center gap-1"><MapPin size={16} /> Global</div>
            <div className="flex items-center gap-1"><LinkIcon size={16} /> <a href="#" className="text-secondary hover:underline">grammate.com</a></div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">{profile.following_count}</span>
              <span className="text-gray-500 text-sm">Following</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">{(profile.followers_count / 1000).toFixed(1)}K</span>
              <span className="text-gray-500 text-sm">Followers</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">452K</span>
              <span className="text-gray-500 text-sm">Likes</span>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex items-center justify-center gap-12 mb-6">
            <button className="flex items-center gap-2 text-white font-bold border-b-2 border-white pb-2">
              <Play size={20} /> Videos
            </button>
            <button className="flex items-center gap-2 text-gray-500 font-medium pb-2 hover:text-gray-300 transition-colors">
              <ImageIcon size={20} /> Playlists
            </button>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
            {videos.map((video, index) => (
              <motion.div 
                key={video.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden relative group cursor-pointer"
              >
                <img src={video.thumbnail} alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-3">
                  <div className="flex items-center gap-1 text-white text-sm font-medium">
                    <Play size={14} fill="white" /> {video.views}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
