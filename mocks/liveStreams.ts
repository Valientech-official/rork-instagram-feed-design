import { User } from './users';

export interface LiveStream {
  id: string;
  user: User;
  title: string;
  thumbnail: string;
  viewers: number;
  startedAt: string;
  tags: string[];
  isActive: boolean;
  description?: string;
}

export const liveStreams: LiveStream[] = [
  {
    id: "live1",
    user: {
      id: "user1",
      username: "janedoe",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true,
    },
    title: "Morning styling routine 👗",
    thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000",
    viewers: 342,
    startedAt: "15 minutes ago",
    tags: ["styling", "fashion", "morning"],
    isActive: true,
    description: "Join me for my daily styling routine. Learn how to put together effortless looks for any occasion."
  },
  {
    id: "live2",
    user: {
      id: "user2",
      username: "traveler",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true,
    },
    title: "Street fashion in Tokyo! 🇯🇵",
    thumbnail: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1000",
    viewers: 1289,
    startedAt: "45 minutes ago",
    tags: ["streetfashion", "tokyo", "style"],
    isActive: true,
    description: "Exploring Tokyo's fashion districts and discovering the latest street style trends. Come style hunt with me!"
  },
  {
    id: "live3",
    user: {
      id: "user3",
      username: "foodie",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: false,
    },
    title: "Styling vintage finds 👘",
    thumbnail: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000",
    viewers: 567,
    startedAt: "1 hour ago",
    tags: ["vintage", "styling", "thrift"],
    isActive: true,
    description: "Today I'm showing you how to style amazing vintage pieces I found at the thrift store. Sustainable fashion at its best!"
  },
  {
    id: "live4",
    user: {
      id: "user4",
      username: "fitnessguru",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true,
    },
    title: "Athleisure styling tips 💪",
    thumbnail: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=80&w=1000",
    viewers: 823,
    startedAt: "30 minutes ago",
    tags: ["athleisure", "activewear", "styling"],
    isActive: true,
    description: "Learn how to style your activewear for both gym and street. Comfort meets fashion in the best way possible!"
  },
  {
    id: "live5",
    user: {
      id: "user5",
      username: "musiclover",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: false,
    },
    title: "Accessory styling session 💍",
    thumbnail: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=1000",
    viewers: 456,
    startedAt: "20 minutes ago",
    tags: ["accessories", "jewelry", "styling"],
    isActive: true,
    description: "All about accessories! Learn how to elevate any outfit with the right jewelry, bags, and scarves."
  },
  {
    id: "live6",
    user: {
      id: "user6",
      username: "artcreator",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true,
    },
    title: "DIY fashion customization 🎨",
    thumbnail: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000",
    viewers: 289,
    startedAt: "1 hour ago",
    tags: ["diy", "customization", "fashion"],
    isActive: true,
    description: "Get creative with your wardrobe! Learn simple DIY techniques to customize and upcycle your clothes."
  }
];