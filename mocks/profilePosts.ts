export interface ProfilePost {
  id: string;
  imageUrl: string;
  likes: number;
  comments: number;
  isVideo?: boolean;
}

export const profilePosts: ProfilePost[] = [
  {
    id: 'post1',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000',
    likes: 243,
    comments: 42
  },
  {
    id: 'post2',
    imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1000',
    likes: 189,
    comments: 23
  },
  {
    id: 'post3',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000',
    likes: 578,
    comments: 63
  },
  {
    id: 'post4',
    imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=80&w=1000',
    likes: 892,
    comments: 75,
    isVideo: true
  },
  {
    id: 'post5',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000',
    likes: 342,
    comments: 28
  },
  {
    id: 'post6',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000',
    likes: 567,
    comments: 42
  },
  {
    id: 'post7',
    imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=1000',
    likes: 423,
    comments: 31
  },
  {
    id: 'post8',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000',
    likes: 342,
    comments: 28
  },
  {
    id: 'post9',
    imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000',
    likes: 1289,
    comments: 45
  }
];