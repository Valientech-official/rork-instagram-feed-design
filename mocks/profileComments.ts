export interface ProfileComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
  createdAt: number;
}

export const profileComments: ProfileComment[] = [
  // Comments for post1
  {
    id: 'comment1',
    postId: 'post1',
    userId: 'user1',
    username: 'fashionista',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    text: 'このコーデ素敵ですね！どこのブランドですか？',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'comment2',
    postId: 'post1',
    userId: 'user2',
    username: 'stylemaker',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    text: '色合いがとても綺麗です✨',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'comment3',
    postId: 'post1',
    userId: 'user3',
    username: 'trendwatcher',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: '参考にさせていただきます！',
    timestamp: '30分前',
    createdAt: Date.now() - 1800000
  },
  // Comments for post2
  {
    id: 'comment4',
    postId: 'post2',
    userId: 'user4',
    username: 'casuallover',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'カジュアルで素敵！',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'comment5',
    postId: 'post2',
    userId: 'user5',
    username: 'streetstyle',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    text: 'このスタイル真似したいです',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  // Comments for post3
  {
    id: 'comment6',
    postId: 'post3',
    userId: 'user6',
    username: 'colorlover',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: 'この色の組み合わせ最高です！',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  // Comments for post4
  {
    id: 'comment7',
    postId: 'post4',
    userId: 'user7',
    username: 'minimalist',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: 'シンプルで上品ですね',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  {
    id: 'comment8',
    postId: 'post4',
    userId: 'user8',
    username: 'elegance',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop',
    text: 'とても上品で素敵です✨',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  // Comments for post5
  {
    id: 'comment9',
    postId: 'post5',
    userId: 'user9',
    username: 'trendsetter',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    text: 'トレンド感があって素敵！',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  }
];

export const getCommentsForPost = (postId: string): ProfileComment[] => {
  return profileComments.filter(comment => comment.postId === postId);
};