import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const ProfileHeader = styled.div`
  background: linear-gradient(135deg, #FF6B35 0%, #ff8555 100%);
  border-radius: 12px;
  padding: 30px;
  color: white;
  margin-bottom: 30px;
  text-align: center;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin: 0 auto 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
`;

const Username = styled.h1`
  margin: 0 0 8px 0;
  font-size: 28px;
`;

const UserBadge = styled.span`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  margin-left: 8px;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin: 20px auto 0;
  max-width: 500px;
`;

const StatBox = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.9;
`;

const Section = styled.div`
  background-color: #0a0a0a;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  color: #fff;
  margin: 0 0 15px 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
`;

const VideoThumbnail = styled.div`
  background-color: #1a1a1a;
  aspect-ratio: 9 / 16;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const PerformanceChart = styled.div`
  background-color: #111;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 12px;
`;

const ChartBar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ChartLabel = styled.div`
  width: 80px;
  font-size: 12px;
  color: #888;
`;

const ChartBarFill = styled.div`
  flex: 1;
  height: 20px;
  background-color: #FF6B35;
  border-radius: 4px;
  margin: 0 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 11px;
  color: white;
`;

const Button = styled.button`
  padding: 10px 16px;
  background-color: #FF6B35;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e55a2a;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #1a1a1a;
  color: #fff;
  border: 1px solid #333;

  &:hover {
    border-color: #FF6B35;
  }
`;

const AnalyticsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AnalyticsBox = styled.div`
  background-color: #111;
  padding: 12px;
  border-radius: 6px;
`;

const AnalyticsLabel = styled.div`
  font-size: 11px;
  color: #666;
  margin-bottom: 6px;
`;

const AnalyticsValue = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #FF6B35;
`;

const Tabs = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #1a1a1a;
`;

const Tab = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? '#FF6B35' : '#666'};
  padding: 10px 0;
  margin-bottom: -1px;
  border-bottom: 2px solid ${props => props.active ? '#FF6B35' : 'transparent'};
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '400'};
`;

function CreatorProfilePage({ token, userId }) {
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCreatorData();
  }, []);

  const fetchCreatorData = async () => {
    setLoading(true);
    try {
      const [profileRes, videosRes] = await Promise.all([
        fetch(`http://localhost:8000/creators/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:8000/creators/${userId}/videos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData.videos || []);
      }

      // Mock analytics data
      setAnalytics({
        avgEngagementRate: 5.2,
        avgViewDuration: 45,
        totalEarnings: 234.50,
        weeklyEarnings: 45.75,
        growthRate: 12.5,
        topVideoViews: videos[0]?.view_count || 0
      });
    } catch (err) {
      setError('Failed to load creator profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProfileContainer>
        <div style={{ textAlign: 'center', color: '#888', paddingTop: '40px' }}>
          Loading profile...
        </div>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      {error && (
        <div style={{ backgroundColor: '#3d1700', color: '#ff9999', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Profile Header */}
      {profile && (
        <ProfileHeader>
          <Avatar>👤</Avatar>
          <Username>
            {profile.username}
            {profile.is_verified && <UserBadge>✓ Verified</UserBadge>}
          </Username>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            {profile.bio || 'Creator on GramMate'}
          </p>
          <Stats>
            <StatBox>
              <StatNumber>{videos.length}</StatNumber>
              <StatLabel>Videos</StatLabel>
            </StatBox>
            <StatBox>
              <StatNumber>{profile.follower_count || 0}</StatNumber>
              <StatLabel>Followers</StatLabel>
            </StatBox>
            <StatBox>
              <StatNumber>{profile.following_count || 0}</StatNumber>
              <StatLabel>Following</StatLabel>
            </StatBox>
            <StatBox>
              <StatNumber>${(profile.total_earnings || 0).toFixed(0)}</StatNumber>
              <StatLabel>Earned</StatLabel>
            </StatBox>
          </Stats>
        </ProfileHeader>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Button>👥 Follow</Button>
        <SecondaryButton>💬 Message</SecondaryButton>
        <SecondaryButton>⚙️ Settings</SecondaryButton>
      </div>

      {/* Tabs */}
      <Tabs>
        <Tab active={activeTab === 'videos'} onClick={() => setActiveTab('videos')}>
          📹 Videos
        </Tab>
        <Tab active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          📊 Analytics
        </Tab>
        <Tab active={activeTab === 'earnings'} onClick={() => setActiveTab('earnings')}>
          💰 Earnings
        </Tab>
      </Tabs>

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <Section>
          <SectionTitle>📹 My Videos ({videos.length})</SectionTitle>
          {videos.length === 0 ? (
            <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No videos uploaded yet
            </div>
          ) : (
            <VideoGrid>
              {videos.map(video => (
                <VideoThumbnail key={video.id}>
                  <img 
                    src={video.thumbnail_url || 'https://via.placeholder.com/150x267?text=Video'}
                    alt={video.title}
                    title={video.title}
                  />
                </VideoThumbnail>
              ))}
            </VideoGrid>
          )}
        </Section>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <>
          <Section>
            <SectionTitle>📊 Performance Metrics</SectionTitle>
            
            <PerformanceChart>
              <ChartBar>
                <ChartLabel>Engagement</ChartLabel>
                <ChartBarFill style={{ width: `${analytics.avgEngagementRate * 10}%` }}>
                  {analytics.avgEngagementRate.toFixed(1)}%
                </ChartBarFill>
              </ChartBar>
              <ChartBar>
                <ChartLabel>Avg Watch</ChartLabel>
                <ChartBarFill style={{ width: `${(analytics.avgViewDuration / 60) * 100}%` }}>
                  {analytics.avgViewDuration}s
                </ChartBarFill>
              </ChartBar>
              <ChartBar>
                <ChartLabel>Growth</ChartLabel>
                <ChartBarFill style={{ width: `${analytics.growthRate * 8}%` }}>
                  +{analytics.growthRate.toFixed(1)}%
                </ChartBarFill>
              </ChartBar>
            </PerformanceChart>
          </Section>

          <Section>
            <SectionTitle>🔥 Top Performers</SectionTitle>
            <AnalyticsRow>
              <AnalyticsBox>
                <AnalyticsLabel>Best Video</AnalyticsLabel>
                <AnalyticsValue>{analytics.topVideoViews} views</AnalyticsValue>
              </AnalyticsBox>
              <AnalyticsBox>
                <AnalyticsLabel>Engagement Rate</AnalyticsLabel>
                <AnalyticsValue>{analytics.avgEngagementRate.toFixed(1)}%</AnalyticsValue>
              </AnalyticsBox>
            </AnalyticsRow>
          </Section>
        </>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && analytics && (
        <>
          <Section>
            <SectionTitle>💰 Earnings Overview</SectionTitle>
            <AnalyticsRow>
              <AnalyticsBox>
                <AnalyticsLabel>Total Earned</AnalyticsLabel>
                <AnalyticsValue>${analytics.totalEarnings.toFixed(2)}</AnalyticsValue>
              </AnalyticsBox>
              <AnalyticsBox>
                <AnalyticsLabel>This Week</AnalyticsLabel>
                <AnalyticsValue>${analytics.weeklyEarnings.toFixed(2)}</AnalyticsValue>
              </AnalyticsBox>
            </AnalyticsRow>
          </Section>

          <Section>
            <SectionTitle>📈 Weekly Earnings Breakdown</SectionTitle>
            <PerformanceChart>
              <ChartBar>
                <ChartLabel>Mon</ChartLabel>
                <ChartBarFill style={{ width: '40%' }}>$5.20</ChartBarFill>
              </ChartBar>
              <ChartBar>
                <ChartLabel>Tue</ChartLabel>
                <ChartBarFill style={{ width: '60%' }}>$7.80</ChartBarFill>
              </ChartBar>
              <ChartBar>
                <ChartLabel>Wed</ChartLabel>
                <ChartBarFill style={{ width: '45%' }}>$5.85</ChartBarFill>
              </ChartBar>
              <ChartBar>
                <ChartLabel>Thu</ChartLabel>
                <ChartBarFill style={{ width: '50%' }}>$6.50</ChartBarFill>
              </ChartBar>
              <ChartBar>
                <ChartLabel>Fri</ChartLabel>
                <ChartBarFill style={{ width: '70%' }}>$9.10</ChartBarFill>
              </ChartBar>
              <ChartBar>
                <ChartLabel>Sat</ChartLabel>
                <ChartBarFill style={{ width: '55%' }}>$7.15</ChartBarFill>
              </ChartBar>
              <ChartBar>
                <ChartLabel>Sun</ChartLabel>
                <ChartBarFill style={{ width: '35%' }}>$4.15</ChartBarFill>
              </ChartBar>
            </PerformanceChart>
          </Section>

          <Section>
            <SectionTitle>💡 Earnings Tips</SectionTitle>
            <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.6' }}>
              <p>✨ <strong style={{ color: '#fff' }}>Consistency wins:</strong> Post at least 3x per week for best results</p>
              <p>🔥 <strong style={{ color: '#fff' }}>Premium content:</strong> High-quality videos earn 2x more</p>
              <p>👥 <strong style={{ color: '#fff' }}>Engagement boost:</strong> Reply to comments to increase watch time</p>
              <p>📱 <strong style={{ color: '#fff' }}>Vertical format:</strong> 9:16 videos get 40% more complete views</p>
            </div>
          </Section>
        </>
      )}
    </ProfileContainer>
  );
}

export default CreatorProfilePage;
