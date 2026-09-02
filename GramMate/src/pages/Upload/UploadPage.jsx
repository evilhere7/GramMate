import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Video, 
  Sparkles, 
  DollarSign, 
  Check, 
  AlertCircle, 
  X, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'tech', label: 'Tech & AI', icon: '🤖' },
  { id: 'music', label: 'Music & Beats', icon: '🎵' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'lifestyle', label: 'Lifestyle & Travel', icon: '✈️' },
  { id: 'education', label: 'Education & Tips', icon: '💡' },
];

const SUGGESTED_TAGS = [
  '#GramMate', '#WatchToEarn', '#CreatorEconomy', '#Viral2026', '#Cinematic', '#TechTips', '#Synthwave'
];

export default function UploadPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('entertainment');
  const [tags, setTags] = useState(['#GramMate', '#WatchToEarn']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [rewardRate, setRewardRate] = useState(0.04);
  const [allowTips, setAllowTips] = useState(true);
  const [subscriberOnly, setSubscriberOnly] = useState(false);

  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrorMsg('Please choose a valid MP4 or WebM video file.');
        return;
      }
      setVideoFile(file);
      setErrorMsg('');
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrorMsg('Please choose a valid MP4 or WebM video file.');
        return;
      }
      setVideoFile(file);
      setErrorMsg('');
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const addTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleCustomTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = customTagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(`#${clean}`)) {
        setTags([...tags, `#${clean}`]);
        setCustomTagInput('');
      }
    }
  };

  // AI Hook & Caption Generator
  const generateAiSuggestions = () => {
    const hooks = [
      'The 1 secret nobody told you about creating content in 2026 🤯',
      'Watch this before you make your next video! #GramMate #Viral',
      'Unbelievable transformation in under 60 seconds ✨ Drop your thoughts below!',
      '3 tools you need to automate your entire daily workflow 🚀'
    ];
    const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
    setTitle(randomHook);
    setDescription(`In this clip, we break down top strategies to maximize your reach and monetize effortlessly on GramMate.\n\nLike & Share to earn bonus viewer rewards! 💰`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!videoFile) {
      setErrorMsg('Please select a video to upload.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please enter a video title.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStage('Uploading video stream (1080p 60fps)...');
    setErrorMsg('');

    // Simulate multi-stage upload
    setTimeout(() => {
      setUploadProgress(45);
      setUploadStage('Transcoding into multi-bitrate HLS streams...');
    }, 1000);

    setTimeout(() => {
      setUploadProgress(80);
      setUploadStage('Generating Watch-to-Earn smart contract pool...');
    }, 2000);

    setTimeout(() => {
      setUploadProgress(100);
      setUploadStage('Live on GramMate!');
      setIsUploading(false);
      setUploadSuccess(true);
    }, 2800);
  };

  return (
    <div className="min-h-full w-full bg-zinc-950 text-white p-4 md:p-8 max-w-5xl mx-auto pb-28 md:pb-12">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Upload size={20} />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Creator Studio</h1>
          </div>
          <p className="text-sm text-zinc-400">Publish high-definition short-form content and activate instant Watch-to-Earn rewards.</p>
        </div>

        <button
          type="button"
          onClick={generateAiSuggestions}
          className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 border border-primary/40 rounded-xl text-xs md:text-sm font-bold text-white flex items-center gap-2 transition-all shadow-lg shadow-primary/10"
        >
          <Sparkles size={16} className="text-secondary animate-spin [animation-duration:4s]" />
          <span>AI Title & Tag Suggester</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Modal / State */}
      <AnimatePresence>
        {uploadSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 bg-zinc-900 border border-emerald-500/40 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden shadow-2xl shadow-emerald-500/10"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4 border border-emerald-500/40">
              <Check size={36} className="stroke-[3]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Video Published Successfully!</h2>
            <p className="text-sm text-zinc-300 max-w-md mx-auto mb-6">
              Your video is now live on the global feed. Viewers are actively earning tokens while watching.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link 
                to="/" 
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/30 text-sm transition-all flex items-center gap-2"
              >
                <span>View on Live Feed</span>
                <ArrowRight size={16} />
              </Link>
              <button 
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setVideoPreview(null);
                  setTitle('');
                  setDescription('');
                  setUploadSuccess(false);
                }}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold rounded-xl text-sm transition-all"
              >
                Upload Another Video
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Video Dropzone & Preview */}
        <div className="lg:col-span-5 space-y-6">
          <label className="text-sm font-bold text-zinc-300 block mb-2">Video File (9:16 vertical recommended)</label>
          
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !videoPreview && fileInputRef.current?.click()}
            className={`relative aspect-[9/16] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center overflow-hidden cursor-pointer ${
              isDragOver 
                ? 'border-primary bg-primary/10' 
                : videoPreview 
                  ? 'border-zinc-700 bg-zinc-950' 
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-900'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />

            {videoPreview ? (
              <div className="relative w-full h-full group">
                <video 
                  ref={videoRef}
                  src={videoPreview} 
                  controls 
                  className="w-full h-full object-cover rounded-2xl" 
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-red-600 transition-colors z-20"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-xs font-semibold px-3 py-1 rounded-full text-zinc-300">
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • {videoFile.name}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-zinc-800 text-zinc-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:text-primary transition-all">
                  <Video size={32} />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Drag and drop video</h3>
                <p className="text-xs text-zinc-400 mb-4 max-w-[200px]">Supports MP4, WebM or MOV up to 500MB</p>
                <button 
                  type="button"
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
                >
                  Select from Computer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metadata, Tags & Monetization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-bold text-zinc-300 block mb-2">Video Title *</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5 Mindblowing AI Tools in 2026..."
              maxLength={100}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-600"
            />
            <div className="flex justify-end mt-1 text-[11px] text-zinc-500">
              {title.length}/100
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-bold text-zinc-300 block mb-2">Description / Caption</label>
            <textarea 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your video, mention collaborators, and add call-to-actions..."
              maxLength={500}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-600 resize-none"
            />
            <div className="flex justify-end mt-1 text-[11px] text-zinc-500">
              {description.length}/500
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-sm font-bold text-zinc-300 block mb-2">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                    category === cat.id
                      ? 'bg-primary/15 border-primary text-white shadow-md shadow-primary/10'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs font-bold">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-sm font-bold text-zinc-300 block mb-2">Hashtags</label>
            
            {/* Active Tag Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(t => (
                <span key={t} className="bg-zinc-800 border border-zinc-700 text-xs font-semibold px-3 py-1 rounded-full text-zinc-200 flex items-center gap-1.5">
                  <span>{t}</span>
                  <button type="button" onClick={() => removeTag(t)} className="hover:text-red-400">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Suggested Pills */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className="text-[11px] font-semibold text-zinc-500">Suggested:</span>
              {SUGGESTED_TAGS.map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => addTag(st)}
                  className="text-[11px] bg-zinc-900 hover:bg-zinc-800 text-secondary border border-zinc-800 rounded-lg px-2 py-0.5 transition-colors"
                >
                  + {st}
                </button>
              ))}
            </div>

            <input 
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleCustomTagKey}
              placeholder="Type tag and press Enter..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-600"
            />
          </div>

          {/* Monetization & Rewards Config */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" />
              <span>Watch-to-Earn & Monetization Settings</span>
            </h4>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">Viewer Reward Rate</span>
                <span className="font-extrabold text-emerald-400">${rewardRate.toFixed(3)} / min</span>
              </div>
              <input 
                type="range"
                min="0.01"
                max="0.10"
                step="0.005"
                value={rewardRate}
                onChange={(e) => setRewardRate(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Toggle options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={allowTips} 
                  onChange={(e) => setAllowTips(e.target.checked)}
                  className="accent-primary w-4 h-4 rounded" 
                />
                <span className="text-xs font-semibold text-zinc-300">Allow Viewer Tipping</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={subscriberOnly} 
                  onChange={(e) => setSubscriberOnly(e.target.checked)}
                  className="accent-primary w-4 h-4 rounded" 
                />
                <span className="text-xs font-semibold text-zinc-300">Premium Subscriber Perk</span>
              </label>
            </div>
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="space-y-2 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-secondary">{uploadStage}</span>
                <span className="text-white">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-gradient-to-r from-primary via-rose-500 to-secondary"
                />
              </div>
            </div>
          )}

          {/* Publish CTA */}
          <button
            type="submit"
            disabled={isUploading || !videoFile}
            className="w-full py-4 bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-600/90 disabled:opacity-50 text-white font-extrabold rounded-2xl text-base shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <span>Publishing Video ({uploadProgress}%)...</span>
            ) : (
              <>
                <Upload size={18} />
                <span>Publish to Global Feed</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
