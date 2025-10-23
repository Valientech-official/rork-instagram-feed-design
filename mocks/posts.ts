export interface Post {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  images: string[];
  caption: string;
  likes: number;
  liked: boolean;
  comments: number;
  timestamp: string;
  location?: string;
  aspectRatio: '1:1' | '16:9' | '9:16';
  isFollowing?: boolean; // true = follower's post, false/undefined = recommended post
}

export const posts: Post[] = [
  {
    id: "1",
    user: {
      id: "user1",
      username: "janedoe",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    },
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000",
    ],
    caption: "今日のコーデ👗 カジュアルシックな雰囲気が好き #ootd #ファッション #今日の服",
    likes: 243,
    liked: false,
    comments: 42,
    timestamp: "2時間前",
    location: "表参道",
    aspectRatio: '1:1',
    isFollowing: true,
  },
  {
    id: "2",
    user: {
      id: "user2",
      username: "traveler",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    },
    images: [
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1000",
    ],
    caption: "ストリートスタイル✨ 街歩きにぴったり #ストリートファッション #カジュアル",
    likes: 1024,
    liked: true,
    comments: 89,
    timestamp: "5時間前",
    aspectRatio: '9:16',
    isFollowing: true,
  },
  {
    id: "3",
    user: {
      id: "user3",
      username: "foodie",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    },
    images: [
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000",
      "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?q=80&w=1000",
    ],
    caption: "夏物新作ゲット🛍️ 早く着たい！ #購入品 #サマーファッション #新作",
    likes: 578,
    liked: false,
    comments: 63,
    timestamp: "1日前",
    location: "渋谷",
    aspectRatio: '16:9',
    isFollowing: false,
  },
  {
    id: "4",
    user: {
      id: "user4",
      username: "fitnessguru",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    },
    images: [
      "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=80&w=1000",
    ],
    caption: "ジムから街まで着れるアクティブウェア💪 #アクティブウェア #フィットネス #スポーツファッション",
    likes: 892,
    liked: false,
    comments: 75,
    timestamp: "2日前",
    location: "代官山",
    aspectRatio: '1:1',
    isFollowing: true,
  },
];