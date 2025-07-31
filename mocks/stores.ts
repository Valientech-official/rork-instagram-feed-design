export interface Store {
  id: string;
  name: string;
  image: string;
  description: string;
  location: string;
  rating: number;
  productCount: number;
  isOnline: boolean;
}

export const stores: Store[] = [
  {
    id: '1',
    name: 'Jolly Clan',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=150&fit=crop',
    description: 'ストリートファッション専門店',
    location: '東京都渋谷区',
    rating: 4.3,
    productCount: 450,
    isOnline: true
  },
  {
    id: '2',
    name: 'FIVE STAR',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=150&fit=crop',
    description: 'カジュアル＆トレンドアイテム',
    location: '東京都原宿区',
    rating: 4.1,
    productCount: 380,
    isOnline: true
  },
  {
    id: '3',
    name: 'WE GO',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=150&fit=crop',
    description: 'ユニークファッション＆アクセサリー',
    location: '東京都原宿区',
    rating: 4.2,
    productCount: 520,
    isOnline: false
  },
  {
    id: '4',
    name: 'No Gain',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=150&fit=crop',
    description: 'アーバンストリートウェア',
    location: '東京都新宿区',
    rating: 4.0,
    productCount: 320,
    isOnline: true
  },
  {
    id: '5',
    name: 'アメリカンワナビー',
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200&h=150&fit=crop',
    description: 'アメリカンカジュアル専門店',
    location: '東京都下北沢区',
    rating: 4.4,
    productCount: 280,
    isOnline: false
  },
  {
    id: '6',
    name: 'JET RAG',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&h=150&fit=crop',
    description: 'ヴィンテージ＆セレクトショップ',
    location: '東京都中野区',
    rating: 4.5,
    productCount: 410,
    isOnline: true
  }
];