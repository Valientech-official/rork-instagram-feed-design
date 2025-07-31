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
    caption: "Today's outfit inspiration! 👗 Love this casual chic look #ootd #fashion #style",
    likes: 243,
    liked: false,
    comments: 42,
    timestamp: "2h ago",
    location: "Fashion District",
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
    caption: "Street style vibes ✨ Perfect for city adventures #streetstyle #fashion #urban",
    likes: 1024,
    liked: true,
    comments: 89,
    timestamp: "5h ago",
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
    caption: "New summer collection haul! 🛍️ Can't wait to style these pieces #haul #summerfashion #newclothes",
    likes: 578,
    liked: false,
    comments: 63,
    timestamp: "1d ago",
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
    caption: "Activewear that transitions from gym to street! 💪 #activewear #fitness #athleisure #sportsfashion",
    likes: 892,
    liked: false,
    comments: 75,
    timestamp: "2d ago",
  },
];