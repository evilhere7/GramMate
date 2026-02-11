import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const FeedContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const VideoCard = styled.div`
  background-color: #111;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.02);
  }
`;

const VideoThumbnail = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 177.78%;
  background-color: #000;
  overflow: hidden;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background-color: rgba(255, 107, 53, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &::after {
      content: '▶';
      color: white;
      font-size: 24px;
      margin-left: 4px;
    }
  }
`;

const VideoInfo = styled.div`
  padding: 12px;
`;

const VideoTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CreatorName = styled.p`
  font-size: 12px;
  color: #888;
  margin: 0 0 8px 0;
`;

const Stats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
`;

const Engagement = styled.div`
  display: flex;
  gap: 8px;

  button {
    flex: 1;
    background-color: #1a1a1a;
    border: 1px solid #333;
    color: #fff;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;

    &:hover {
      background-color: #222;
      border-color: #FF6B35;
    }

    &.like-btn {
      color: #FF6B35;
    }
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 40px;
  color: #888;
`;

const ErrorMessage = styled.div`
  background-color: #3d1700;
  color: #ff9999;
  padding: 16px;
  margin: 20px;
  border-radius: 6px;
`;

function FeedPage({ token, onEarnings }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [liked, setLiked] = useState(new Set());

  useEffect(() => {
    // Load initial feed once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/feed?limit=20&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data && data.videos) setVideos(prev => [...prev, ...data.videos]);
      setOffset(prev => prev + 20);
    } catch (err) {
      setError('Failed to load feed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (videoId) => {
    if (liked.has(videoId)) return;

    try {
      const response = await fetch(
        `http://localhost:8000/engagements/${videoId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      await response.json();

      if (response.ok) {
        setLiked(prev => new Set([...prev, videoId]));
        setVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { ...v, like_count: v.like_count + 1 }
            : v
        ));
        onEarnings();
      }
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleWatch = async (videoId, duration = 120) => {
    try {
      await fetch(
        `http://localhost:8000/engagements/${videoId}/view`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            watch_duration_seconds: duration,
            completed: true
          })
        }
      );
      
      setVideos(prev => prev.map(v => 
        v.id === videoId 
          ? { ...v, view_count: v.view_count + 1 }
          : v
      ));
      onEarnings();
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  };

  const loadMore = () => {
    fetchFeed();
  };

  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <div>
      <FeedContainer>
        {videos.map(video => (
          <VideoCard key={video.id}>
            <VideoThumbnail 
              onClick={() => handleWatch(video.id)}
              role="button"
            >
              <img 
                src={video.thumbnail_url || 'https://via.placeholder.com/320x568?text=Video'}
                alt={video.title}
              />
              <div className="play-button"></div>
            </VideoThumbnail>
            <VideoInfo>
              <VideoTitle>{video.title}</VideoTitle>
              <CreatorName>Creator: {video.creator_id.slice(0, 8)}...</CreatorName>
              <Stats>
                <span>{video.view_count} views</span>
                <span>{(video.engagement_rate * 100).toFixed(1)}% engagement</span>
              </Stats>
              <Engagement>
                <button 
                  className={liked.has(video.id) ? 'like-btn' : ''}
                  onClick={() => handleLike(video.id)}
                  disabled={liked.has(video.id)}
                >
                  ❤️ {video.like_count}
                </button>
                <button>💬 {video.comment_count}</button>
                <button>↗️ {video.share_count}</button>
              </Engagement>
            </VideoInfo>
          </VideoCard>
        ))}
      </FeedContainer>

      {loading && <LoadingSpinner>Loading videos...</LoadingSpinner>}
      
      {!loading && videos.length > 0 && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <button
            onClick={loadMore}
            style={{
              background: '#FF6B35',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Load More Videos
          </button>
        </div>
      )}
    </div>
  );
}

export default FeedPage;
