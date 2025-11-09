// Analytics Service
// Backend API integration for analytics data

export interface PostAnalytics {
  post_id: string;
  total_reach: number;
  impressions: number;
  engagement_rate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions_over_time: { date: string; count: number }[];
  engagement_breakdown: { type: string; count: number; color: string }[];
  demographics: {
    age_groups: { range: string; count: number }[];
    gender: { type: string; count: number }[];
    locations: { city: string; count: number }[];
  };
}

export interface AccountAnalytics {
  total_followers: number;
  followers_growth: number;
  profile_visits: number;
  total_reach: number;
  engagement_rate: number;
  top_posts: {
    post_id: string;
    image_url: string;
    likes: number;
    comments: number;
    engagement_rate: number;
  }[];
  audience_insights: {
    age_distribution: { range: string; count: number }[];
    gender_breakdown: { type: string; count: number; color: string }[];
    top_locations: { city: string; count: number }[];
    active_hours: { hour: number; count: number }[];
    active_days: { day: string; count: number }[];
  };
  follower_growth_chart: { date: string; count: number }[];
  content_performance: {
    total_posts: number;
    avg_engagement: number;
    avg_reach: number;
  };
}

export interface FollowerAnalytics {
  follower_growth: { date: string; new_followers: number; unfollowers: number }[];
  net_change: number;
  most_engaged_followers: {
    user_id: string;
    username: string;
    avatar_url: string;
    engagement_count: number;
  }[];
  demographics: {
    locations: { city: string; country: string; count: number }[];
    age_gender: { age_range: string; male: number; female: number; other: number }[];
    account_types: { type: string; count: number }[];
  };
  engagement_by_segment: {
    segment: string;
    avg_engagement: number;
  }[];
}

export type TimeFrame = '7d' | '30d' | '90d' | 'all';

// Mock API functions (replace with actual API calls)
export const getPostAnalytics = async (
  postId: string,
  timeframe: TimeFrame = '7d'
): Promise<PostAnalytics> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock data
  return {
    post_id: postId,
    total_reach: 45230,
    impressions: 67890,
    engagement_rate: 8.5,
    likes: 3456,
    comments: 234,
    shares: 123,
    saves: 567,
    impressions_over_time: generateImpressionData(timeframe),
    engagement_breakdown: [
      { type: 'Likes', count: 3456, color: '#FF3B30' },
      { type: 'Comments', count: 234, color: '#0095F6' },
      { type: 'Shares', count: 123, color: '#34C759' },
      { type: 'Saves', count: 567, color: '#FFD700' },
    ],
    demographics: {
      age_groups: [
        { range: '13-17', count: 234 },
        { range: '18-24', count: 1234 },
        { range: '25-34', count: 2345 },
        { range: '35-44', count: 789 },
        { range: '45+', count: 398 },
      ],
      gender: [
        { type: 'Female', count: 3200 },
        { type: 'Male', count: 1600 },
        { type: 'Other', count: 200 },
      ],
      locations: [
        { city: 'Tokyo', count: 2500 },
        { city: 'Osaka', count: 1200 },
        { city: 'Nagoya', count: 800 },
        { city: 'Fukuoka', count: 500 },
        { city: 'Others', count: 1000 },
      ],
    },
  };
};

export const getAccountAnalytics = async (
  timeframe: TimeFrame = '30d'
): Promise<AccountAnalytics> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    total_followers: 12340,
    followers_growth: 324,
    profile_visits: 8970,
    total_reach: 156780,
    engagement_rate: 7.2,
    top_posts: [
      {
        post_id: '1',
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
        likes: 5600,
        comments: 340,
        engagement_rate: 9.8,
      },
      {
        post_id: '2',
        image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
        likes: 4200,
        comments: 280,
        engagement_rate: 8.4,
      },
      {
        post_id: '3',
        image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b',
        likes: 3900,
        comments: 250,
        engagement_rate: 7.9,
      },
    ],
    audience_insights: {
      age_distribution: [
        { range: '13-17', count: 890 },
        { range: '18-24', count: 4560 },
        { range: '25-34', count: 5200 },
        { range: '35-44', count: 1340 },
        { range: '45+', count: 350 },
      ],
      gender_breakdown: [
        { type: 'Female', count: 8500, color: '#FF3B30' },
        { type: 'Male', count: 3200, color: '#0095F6' },
        { type: 'Other', count: 640, color: '#8E8E8E' },
      ],
      top_locations: [
        { city: 'Tokyo', count: 5600 },
        { city: 'Osaka', count: 2800 },
        { city: 'Nagoya', count: 1600 },
        { city: 'Fukuoka', count: 1200 },
        { city: 'Sapporo', count: 800 },
      ],
      active_hours: generateActiveHours(),
      active_days: [
        { day: 'Mon', count: 1200 },
        { day: 'Tue', count: 1400 },
        { day: 'Wed', count: 1600 },
        { day: 'Thu', count: 1800 },
        { day: 'Fri', count: 2200 },
        { day: 'Sat', count: 2400 },
        { day: 'Sun', count: 2000 },
      ],
    },
    follower_growth_chart: generateFollowerGrowth(timeframe),
    content_performance: {
      total_posts: 156,
      avg_engagement: 7.2,
      avg_reach: 45600,
    },
  };
};

export const getFollowerAnalytics = async (
  timeframe: TimeFrame = '30d'
): Promise<FollowerAnalytics> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    follower_growth: generateFollowerGrowthDetail(timeframe),
    net_change: 324,
    most_engaged_followers: [
      {
        user_id: '1',
        username: 'fashionista_tokyo',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        engagement_count: 245,
      },
      {
        user_id: '2',
        username: 'style_lover_osaka',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9',
        engagement_count: 198,
      },
      {
        user_id: '3',
        username: 'trendy_user',
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
        engagement_count: 167,
      },
    ],
    demographics: {
      locations: [
        { city: 'Tokyo', country: 'Japan', count: 5600 },
        { city: 'Osaka', country: 'Japan', count: 2800 },
        { city: 'Seoul', country: 'South Korea', count: 1200 },
        { city: 'New York', country: 'USA', count: 800 },
        { city: 'London', country: 'UK', count: 600 },
      ],
      age_gender: [
        { age_range: '13-17', male: 120, female: 180, other: 20 },
        { age_range: '18-24', male: 800, female: 1600, other: 160 },
        { age_range: '25-34', male: 1200, female: 2400, other: 200 },
        { age_range: '35-44', male: 400, female: 600, other: 80 },
        { age_range: '45+', male: 100, female: 200, other: 20 },
      ],
      account_types: [
        { type: 'Personal', count: 8900 },
        { type: 'Business', count: 2400 },
        { type: 'Creator', count: 1040 },
      ],
    },
    engagement_by_segment: [
      { segment: 'High Engagement', avg_engagement: 12.4 },
      { segment: 'Medium Engagement', avg_engagement: 6.8 },
      { segment: 'Low Engagement', avg_engagement: 2.1 },
    ],
  };
};

// Helper functions to generate mock data
function generateImpressionData(timeframe: TimeFrame) {
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 3000) + 1000,
    });
  }

  return data;
}

function generateFollowerGrowth(timeframe: TimeFrame) {
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  const data = [];
  let currentCount = 12000;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    currentCount += Math.floor(Math.random() * 20) - 5;
    data.push({
      date: date.toISOString().split('T')[0],
      count: currentCount,
    });
  }

  return data;
}

function generateFollowerGrowthDetail(timeframe: TimeFrame) {
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      new_followers: Math.floor(Math.random() * 50) + 10,
      unfollowers: Math.floor(Math.random() * 20) + 2,
    });
  }

  return data;
}

function generateActiveHours() {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push({
      hour: i,
      count: Math.floor(Math.random() * 800) + 200,
    });
  }
  return hours;
}
