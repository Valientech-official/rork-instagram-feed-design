export interface Avatar {
  id: string;
  imageUrl: string;
  source: 'favorite' | 'library' | 'camera';
  isFavorite: boolean;
}

export const avatars: Avatar[] = [
  {
    id: 'avatar_1',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
    source: 'favorite',
    isFavorite: true,
  },
  {
    id: 'avatar_2',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    source: 'favorite',
    isFavorite: true,
  },
  {
    id: 'avatar_3',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
    source: 'library',
    isFavorite: true,
  },
  {
    id: 'avatar_4',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
    source: 'library',
    isFavorite: false,
  },
  {
    id: 'avatar_5',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    source: 'library',
    isFavorite: false,
  },
  {
    id: 'avatar_6',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop',
    source: 'library',
    isFavorite: false,
  },
];
