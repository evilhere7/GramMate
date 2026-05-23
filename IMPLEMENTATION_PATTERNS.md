/**
 * GramMate Implementation Patterns & Best Practices
 * Code-ready templates for developers
 */

// ============================================================
// 1. FASTAPI ENDPOINT PATTERN
// ============================================================

/*
File: backend/app/api/v1/videos.py

TEMPLATE:
```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.security import get_current_user
from app.schemas.video import VideoResponse, VideoCreate, VideoUpdate
from app.services.video_service import VideoService
from app.models.user import User
from app.database import get_db
from app.core.constants import PAGE_SIZE

router = APIRouter(prefix="/videos", tags=["videos"])

@router.get("", response_model=List[VideoResponse])
async def get_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(PAGE_SIZE, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get home feed with infinite scroll support.
    
    - skip: number of items to skip (for pagination)
    - limit: max items to return (default 20, max 100)
    - Returns: List of video objects for feed
    
    Query optimization:
    - Uses cursor-based pagination in production
    - Eager loads creator + engagement data
    - Cache with Redis for 5 min TTL
    """
    service = VideoService(db)
    videos = service.get_feed(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return videos

@router.get("/{video_id}", response_model=VideoResponse)
async def get_video_detail(
    video_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed video information."""
    service = VideoService(db)
    video = service.get_video_by_id(
        video_id=video_id,
        viewer_id=current_user.id if current_user else None
    )
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    return video

@router.post("", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def create_video(
    video_data: VideoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create new video (upload metadata).
    
    Process:
    1. Validate user is creator
    2. Save video metadata to DB
    3. Return S3 signed URL for file upload
    4. Client uploads file to S3
    5. Trigger async video processing
    """
    service = VideoService(db)
    
    # Verify creator status
    if not current_user.is_creator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creators can upload videos"
        )
    
    # Create video record
    video = service.create_video(
        user_id=current_user.id,
        video_data=video_data
    )
    
    return video

@router.post("/{video_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def like_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like a video."""
    service = VideoService(db)
    service.like_video(
        user_id=current_user.id,
        video_id=video_id
    )
    # Return 204 No Content

@router.get("/{video_id}/analytics", response_model=dict)
async def get_video_analytics(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get video analytics (for creator).
    
    Returns:
    {
        "views": 2_340_123,
        "likes": 84_230,
        "comments": 12_340,
        "shares": 5_234,
        "earnings": 1234.56,
        "views_by_date": [...],
        "engagement_rate": 0.045,
        "watch_time_total": 123_456_789,
        "avg_watch_time": 45.2,
        "traffic_sources": {...}
    }
    """
    service = VideoService(db)
    
    # Verify ownership
    video = service.get_video_by_id(video_id)
    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view analytics"
        )
    
    analytics = service.get_analytics(video_id)
    return analytics
```

RESPONSE SCHEMAS:

```python
# schemas/video.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class VideoResponse(BaseModel):
    id: str = Field(..., description="Video UUID")
    title: str
    description: Optional[str]
    thumbnail_url: str
    video_url: str
    duration_seconds: int
    view_count: int
    like_count: int
    comment_count: int
    save_count: int
    earnings: float
    category: str
    tags: List[str]
    status: str  # approved, processing, draft
    is_monetized: bool
    published_at: datetime
    created_at: datetime
    
    # Creator info (nested)
    creator: dict = Field(..., description="Creator profile")
    
    # Current user engagement (optional)
    is_liked: Optional[bool] = None
    is_saved: Optional[bool] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Best Tips for Video Creation",
                "view_count": 2340123,
                "earnings": 1234.56
            }
        }
```

ERROR HANDLING:

```python
# middleware/error_handler.py
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
            "detail": str(exc) if DEBUG else None,
            "request_id": request.headers.get("x-request-id")
        }
    )

# Common errors
class VideoNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=404,
            detail="Video not found"
        )

class UnauthorizedError(HTTPException):
    def __init__(self, message="Not authorized"):
        super().__init__(
            status_code=403,
            detail=message
        )

class ValidationError(HTTPException):
    def __init__(self, message: str, field: str = None):
        super().__init__(
            status_code=422,
            detail={
                "message": message,
                "field": field
            }
        )
```
*/

// ============================================================
// 2. REACT COMPONENT PATTERN
// ============================================================

/*
File: frontend/src/components/feed/VideoCard.tsx

TEMPLATE:
```typescript
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { tokens } from '@/design-system/tokens';
import { Video } from '@/types/video';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EngagementOverlay } from './EngagementOverlay';
import { useVideoInteractions } from '@/hooks/useVideoInteractions';

interface VideoCardProps {
  video: Video;
  onVideoClick?: (videoId: string) => void;
  isLiked?: boolean;
  isSaved?: boolean;
  showEarnings?: boolean;
}

const Container = styled.div`
  width: 360px;
  border-radius: ${tokens.BORDER_RADIUS.lg};
  background: ${tokens.GLASS_MORPHISM.standard.background};
  backdrop-filter: blur(${tokens.GLASS_MORPHISM.standard.blur});
  border: 1px solid ${tokens.GLASS_MORPHISM.standard.border};
  overflow: hidden;
  cursor: pointer;
  transition: all ${tokens.MOTION.EASE_OUT} ${tokens.MOTION.DURATION_STANDARD};
  
  &:hover {
    border-color: ${tokens.COLORS.purple.bright};
    box-shadow: 0 0 24px ${tokens.COLORS.GLOW.purple};
  }
  
  @media (max-width: ${tokens.BREAKPOINTS.tablet}) {
    width: 100%;
    width: calc(50vw - 12px);
  }
  
  @media (max-width: ${tokens.BREAKPOINTS.mobile}) {
    width: 100%;
  }
`;

const ThumbnailContainer = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: ${tokens.COLORS.background.darker};
  overflow: hidden;
`;

const Thumbnail = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlayButton = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity ${tokens.MOTION.EASE_OUT} 200ms;
  cursor: pointer;
  
  ${Container}:hover & {
    opacity: 1;
  }
  
  &::after {
    content: '▶';
    color: white;
    font-size: 24px;
    margin-left: 4px;
  }
`;

const DurationBadge = styled.span`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: ${tokens.SPACING.xs} ${tokens.SPACING.sm};
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
`;

const Content = styled.div`
  padding: ${tokens.SPACING.md};
`;

const CreatorRow = styled.div`
  display: flex;
  gap: ${tokens.SPACING.md};
  margin-bottom: ${tokens.SPACING.md};
  align-items: center;
`;

const CreatorInfo = styled.div`
  flex: 1;
`;

const CreatorName = styled.span`
  display: block;
  font-weight: 600;
  font-size: 14px;
  color: white;
  margin-bottom: 2px;
`;

const CreatorHandle = styled.span`
  display: block;
  font-size: 12px;
  color: ${tokens.COLORS.text.secondary};
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin: 0 0 ${tokens.SPACING.md} 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const StatsRow = styled.div`
  display: flex;
  gap: ${tokens.SPACING.lg};
  margin-bottom: ${tokens.SPACING.md};
  font-size: 12px;
  color: ${tokens.COLORS.text.secondary};
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const EarningsTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${tokens.COLORS.GLOW.purple}20;
  color: ${tokens.COLORS.purple.bright};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

const ProgressBar = styled.div`
  height: 4px;
  background: ${tokens.COLORS.background.darker};
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: ${tokens.SPACING.md};
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: 65%;
    background: linear-gradient(90deg, 
      ${tokens.COLORS.blue.bright}, 
      ${tokens.COLORS.pink.bright}
    );
  }
`;

const ActionBar = styled.div`
  display: flex;
  gap: ${tokens.SPACING.sm};
  justify-content: space-between;
`;

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onVideoClick,
  isLiked = false,
  isSaved = false,
  showEarnings = true
}) => {
  const { user } = useAuth();
  const { likeVideo, saveVideo } = useVideoInteractions();
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localSaved, setLocalSaved] = useState(isSaved);
  
  const handleCardClick = useCallback(() => {
    onVideoClick?.(video.id);
  }, [video.id, onVideoClick]);
  
  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalLiked(!localLiked);
    likeVideo(video.id);
  }, [video.id, localLiked, likeVideo]);
  
  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalSaved(!localSaved);
    saveVideo(video.id);
  }, [video.id, localSaved, saveVideo]);
  
  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(video.duration_seconds / 60);
    const seconds = video.duration_seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [video.duration_seconds]);
  
  return (
    <Container onClick={handleCardClick}>
      <ThumbnailContainer>
        <Thumbnail 
          src={video.thumbnail_url}
          alt={video.title}
          loading="lazy"
        />
        <PlayButton />
        <DurationBadge>{formattedDuration}</DurationBadge>
        <EngagementOverlay
          likes={video.like_count}
          comments={video.comment_count}
          shares={video.share_count}
          isLiked={localLiked}
          isSaved={localSaved}
          onLike={handleLike}
          onSave={handleSave}
          layout="vertical"
        />
      </ThumbnailContainer>
      
      <Content>
        <CreatorRow>
          <Avatar 
            src={video.creator.avatar_url}
            alt={video.creator.display_name}
            size="sm"
          />
          <CreatorInfo>
            <CreatorName>
              {video.creator.display_name}
              {video.creator.is_verified && '✓'}
            </CreatorName>
            <CreatorHandle>@{video.creator.username}</CreatorHandle>
          </CreatorInfo>
        </CreatorRow>
        
        <Title>{video.title}</Title>
        
        <StatsRow>
          <span>❤️ {video.like_count.toLocaleString()}</span>
          <span>💬 {video.comment_count}</span>
          <span>⬆️ {video.share_count}</span>
        </StatsRow>
        
        {showEarnings && video.earnings > 0 && (
          <EarningsTag>💰 ${video.earnings.toFixed(2)}</EarningsTag>
        )}
        
        <ProgressBar />
        
        <ActionBar>
          <Button 
            variant="ghost" 
            size="sm"
            icon={localSaved ? '🔖' : '☆'}
            onClick={handleSave}
          />
          <Button 
            variant="ghost" 
            size="sm"
            icon="↗"
            onClick={(e) => e.stopPropagation()}
          />
          <Button 
            variant="ghost" 
            size="sm"
            icon="⋮"
            onClick={(e) => e.stopPropagation()}
          />
        </ActionBar>
      </Content>
    </Container>
  );
};

export default VideoCard;
```

HOOKS PATTERN:

```typescript
// hooks/useVideoInteractions.ts
import { useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useVideoInteractions = () => {
  const likeVideoMutation = useMutation(
    (videoId: string) => api.post(`/videos/${videoId}/like`),
    {
      onMutate: (videoId) => {
        // Optimistic update
      },
      onError: () => {
        // Rollback on error
      }
    }
  );
  
  const likeVideo = useCallback((videoId: string) => {
    likeVideoMutation.mutate(videoId);
  }, [likeVideoMutation]);
  
  return { likeVideo };
};
```
*/

// ============================================================
// 3. DATABASE SERVICE PATTERN
// ============================================================

/*
File: backend/app/services/video_service.py

TEMPLATE:
```python
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from typing import List, Optional
from app.models.video import Video, Like, Save
from app.models.user import User
from app.schemas.video import VideoCreate, VideoUpdate
from app.core.exceptions import VideoNotFoundError, UnauthorizedError
from app.utils.media_utils import generate_thumbnail
from app.cache.redis import cache
import uuid
from datetime import datetime

class VideoService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_video(
        self, 
        user_id: str, 
        video_data: VideoCreate
    ) -> Video:
        """Create new video record."""
        video = Video(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=video_data.title,
            description=video_data.description,
            category=video_data.category,
            tags=video_data.tags or [],
            status='draft',
            is_monetized=video_data.is_monetized,
            created_at=datetime.utcnow()
        )
        self.db.add(video)
        self.db.commit()
        self.db.refresh(video)
        return video
    
    def get_video_by_id(
        self, 
        video_id: str, 
        viewer_id: Optional[str] = None
    ) -> Optional[Video]:
        """
        Get video with engagement status for viewer.
        Uses Redis cache (5 min TTL).
        """
        # Try cache first
        cache_key = f"video:{video_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Database query with eager loading
        video = self.db.query(Video).options(
            # Load creator relationship
            joinedload(Video.creator),
            # Load engagement counts
            joinedload(Video.likes_count)
        ).filter(
            Video.id == video_id,
            Video.status != 'deleted'
        ).first()
        
        if not video:
            raise VideoNotFoundError()
        
        # Add engagement status if viewer provided
        if viewer_id:
            video.is_liked = self.db.query(Like).filter(
                Like.user_id == viewer_id,
                Like.video_id == video_id
            ).first() is not None
            
            video.is_saved = self.db.query(Save).filter(
                Save.user_id == viewer_id,
                Save.video_id == video_id
            ).first() is not None
        
        # Cache result
        cache.set(cache_key, video, ttl=300)
        return video
    
    def get_feed(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> List[Video]:
        """
        Get personalized feed using cursor-based pagination.
        
        Algorithm:
        1. Get following list
        2. Get trending videos
        3. Get creator recommendations
        4. Sort by engagement + recency
        5. Return paginated results
        """
        # Get user's following list
        following_ids = self.db.query(User.id).filter(
            User.followers.any(follower_id=user_id)
        ).all()
        
        # Base query: approved videos from following
        query = self.db.query(Video).filter(
            Video.user_id.in_(following_ids),
            Video.status == 'approved',
            Video.published_at.isnot(None)
        )
        
        # Add trending videos (if low volume)
        trending = self.db.query(Video).filter(
            Video.status == 'approved',
            Video.view_count > 1000,
            Video.published_at > datetime.utcnow() - timedelta(days=7)
        ).order_by(
            desc(Video.view_count)
        ).limit(5).all()
        
        # Combine and deduplicate
        videos = query.order_by(
            desc(Video.published_at)
        ).offset(skip).limit(limit).all()
        
        # Lazy load engagement counts
        self._load_engagement_stats(videos, user_id)
        
        return videos
    
    def like_video(self, user_id: str, video_id: str) -> None:
        """Like a video (idempotent)."""
        # Check if already liked
        existing = self.db.query(Like).filter(
            Like.user_id == user_id,
            Like.video_id == video_id
        ).first()
        
        if existing:
            return  # Already liked
        
        # Create like
        like = Like(
            id=str(uuid.uuid4()),
            user_id=user_id,
            video_id=video_id
        )
        self.db.add(like)
        
        # Increment video like count
        video = self.db.query(Video).filter(
            Video.id == video_id
        ).first()
        if video:
            video.like_count += 1
            
            # Update earnings estimate
            if video.is_monetized:
                like_value = 0.0001  # $0.0001 per like
                video.earnings += like_value
        
        self.db.commit()
        
        # Invalidate cache
        cache.delete(f"video:{video_id}")
    
    def unlike_video(self, user_id: str, video_id: str) -> None:
        """Unlike a video."""
        like = self.db.query(Like).filter(
            Like.user_id == user_id,
            Like.video_id == video_id
        ).first()
        
        if like:
            self.db.delete(like)
            
            # Decrement count
            video = self.db.query(Video).filter(
                Video.id == video_id
            ).first()
            if video:
                video.like_count = max(0, video.like_count - 1)
            
            self.db.commit()
            cache.delete(f"video:{video_id}")
    
    def get_analytics(self, video_id: str) -> dict:
        """Get video analytics."""
        from app.services.analytics_service import AnalyticsService
        analytics = AnalyticsService(self.db)
        return analytics.get_video_analytics(video_id)
    
    def _load_engagement_stats(
        self, 
        videos: List[Video], 
        user_id: Optional[str] = None
    ) -> None:
        """Batch load engagement status."""
        if not videos or not user_id:
            return
        
        video_ids = [v.id for v in videos]
        
        # Get likes
        likes = self.db.query(Like.video_id).filter(
            Like.user_id == user_id,
            Like.video_id.in_(video_ids)
        ).all()
        liked_ids = {l.video_id for l in likes}
        
        # Get saves
        saves = self.db.query(Save.video_id).filter(
            Save.user_id == user_id,
            Save.video_id.in_(video_ids)
        ).all()
        saved_ids = {s.video_id for s in saves}
        
        # Attach to video objects
        for video in videos:
            video.is_liked = video.id in liked_ids
            video.is_saved = video.id in saved_ids
```

ERROR HANDLING:

```python
# core/exceptions.py
class GramMateException(Exception):
    """Base exception."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class VideoNotFoundError(GramMateException):
    def __init__(self):
        super().__init__("Video not found", 404)

class UnauthorizedError(GramMateException):
    def __init__(self, message="Not authorized"):
        super().__init__(message, 403)

# In route handlers:
try:
    video = service.get_video_by_id(video_id)
except VideoNotFoundError as e:
    raise HTTPException(status_code=e.status_code, detail=e.message)
```
*/

// ============================================================
// 4. TESTING PATTERNS
// ============================================================

/*
Backend Testing:
```python
# tests/test_videos.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def authenticated_user(db):
    """Create test user."""
    user = User(
        id="test-user",
        email="test@example.com",
        username="testuser"
    )
    db.add(user)
    db.commit()
    return user

@pytest.fixture
def test_video(authenticated_user, db):
    """Create test video."""
    video = Video(
        id="test-video",
        user_id=authenticated_user.id,
        title="Test Video",
        status="approved"
    )
    db.add(video)
    db.commit()
    return video

def test_get_video_detail(test_video, token):
    response = client.get(
        f"/api/v1/videos/{test_video.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["id"] == test_video.id

def test_like_video(test_video, authenticated_user, token):
    response = client.post(
        f"/api/v1/videos/{test_video.id}/like",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 204
    
    # Verify like was recorded
    video = db.query(Video).get(test_video.id)
    assert video.like_count == 1

def test_invalid_video_returns_404(token):
    response = client.get(
        "/api/v1/videos/nonexistent",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404
```

Frontend Testing (React):
```typescript
// __tests__/VideoCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoCard } from '@/components/feed/VideoCard';

describe('VideoCard', () => {
  const mockVideo = {
    id: '123',
    title: 'Test Video',
    creator: { display_name: 'Test Creator' }
  };
  
  it('renders video title', () => {
    render(<VideoCard video={mockVideo} />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });
  
  it('calls onVideoClick when clicked', () => {
    const onClick = jest.fn();
    render(<VideoCard video={mockVideo} onVideoClick={onClick} />);
    fireEvent.click(screen.getByRole('presentation'));
    expect(onClick).toHaveBeenCalledWith('123');
  });
});
```
*/
