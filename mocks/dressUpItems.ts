export type SizeOption = 'tight' | 'just' | 'relaxed' | 'oversize';

export interface DressUpItem {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  isFavorite: boolean;
}

export interface DressUpMode {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  color: string;
}

export const dressUpItems: DressUpItem[] = [
  {
    id: 'item_1',
    name: 'カジュアルTシャツ',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    category: 'トップス',
    isFavorite: true,
  },
  {
    id: 'item_2',
    name: 'デニムジャケット',
    imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=400&fit=crop',
    category: 'アウター',
    isFavorite: true,
  },
  {
    id: 'item_3',
    name: 'ワンピース',
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop',
    category: 'ワンピース',
    isFavorite: true,
  },
  {
    id: 'item_4',
    name: 'スニーカー',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    category: 'シューズ',
    isFavorite: true,
  },
  {
    id: 'item_5',
    name: 'パーカー',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    category: 'トップス',
    isFavorite: false,
  },
  {
    id: 'item_6',
    name: 'スカート',
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=400&fit=crop',
    category: 'ボトムス',
    isFavorite: false,
  },
];

export const dressUpModes: DressUpMode[] = [
  {
    id: 'mode_1',
    name: 'カジュアル',
    description: '日常使いにぴったり',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=800&fit=crop',
    color: '#FF6B6B',
  },
  {
    id: 'mode_2',
    name: 'フォーマル',
    description: '大事な場面に',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=800&fit=crop',
    color: '#4ECDC4',
  },
  {
    id: 'mode_3',
    name: 'スポーティ',
    description: 'アクティブに動ける',
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea663a5d?w=600&h=800&fit=crop',
    color: '#95E1D3',
  },
  {
    id: 'mode_4',
    name: 'ストリート',
    description: 'トレンド感満載',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop',
    color: '#F38181',
  },
  {
    id: 'mode_5',
    name: 'エレガント',
    description: '上品で華やか',
    imageUrl: 'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=600&h=800&fit=crop',
    color: '#AA96DA',
  },
  {
    id: 'mode_6',
    name: 'リラックス',
    description: '楽ちんコーデ',
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&fit=crop',
    color: '#FCBAD3',
  },
];

export const sizeOptions = [
  { value: 'tight' as SizeOption, label: 'タイト', emoji: '🔴' },
  { value: 'just' as SizeOption, label: '普通', emoji: '🟡' },
  { value: 'relaxed' as SizeOption, label: '少しゆったり', emoji: '🟢' },
  { value: 'oversize' as SizeOption, label: 'オーバーサイズ', emoji: '🔵' },
];
