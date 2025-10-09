import { Post } from './posts';

export interface ShoppingPost extends Omit<Post, 'productId'> {
  productId?: string;
}

export const shoppingPosts: ShoppingPost[] = [
  {
    id: "s1",
    user: {
      id: "user1",
      username: "janedoe",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    },
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000",
    ],
    caption: "この素敵なシルクブラウスをゲット！オフィスにもディナーデートにもぴったり 💫 #ファッション #シルク #オフィスコーデ",
    likes: 342,
    liked: false,
    comments: 28,
    timestamp: "3時間前",
    location: "ファッションブティック",
    productId: "p1",
    aspectRatio: '1:1',
  },
  {
    id: "s2",
    user: {
      id: "user2",
      username: "traveler",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    },
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000",
    ],
    caption: "このスニーカーが新しい旅のお供に！快適さとスタイルの両立 ✈️ #スニーカー #旅行 #快適 #スタイル",
    likes: 567,
    liked: true,
    comments: 42,
    timestamp: "1日前",
    productId: "p2",
    aspectRatio: '1:1',
  },
  {
    id: "s3",
    user: {
      id: "user4",
      username: "fitnessguru",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    },
    images: [
      "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=1000",
    ],
    caption: "この素敵なハンドバッグでアクセサリーをアップグレード！どんな場面でも完璧 👜 #ハンドバッグ #アクセサリー #ラグジュアリー #スタイル",
    likes: 423,
    liked: false,
    comments: 31,
    timestamp: "2日前",
    location: "デザイナーストア",
    productId: "p4",
    aspectRatio: '1:1',
  }
];