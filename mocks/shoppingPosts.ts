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
    caption: "Just got this beautiful silk blouse! Perfect for office or dinner dates 💫 #fashion #silk #workwear",
    likes: 342,
    liked: false,
    comments: 28,
    timestamp: "3h ago",
    location: "Fashion Boutique",
    productId: "p1"
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
    caption: "These sneakers are my new travel companions! Comfort meets style ✈️ #sneakers #travel #comfort #style",
    likes: 567,
    liked: true,
    comments: 42,
    timestamp: "1d ago",
    productId: "p2"
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
    caption: "Upgraded my accessory game with this stunning handbag! Perfect for any occasion 👜 #handbag #accessories #luxury #style",
    likes: 423,
    liked: false,
    comments: 31,
    timestamp: "2d ago",
    location: "Designer Store",
    productId: "p4"
  }
];