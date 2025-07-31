export interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  isVerified: boolean;
  productCount: number;
}

export const brands: Brand[] = [
  {
    id: '1',
    name: 'UNIQLO',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop',
    description: 'カジュアルウェアブランド',
    isVerified: true,
    productCount: 1250
  },
  {
    id: '2',
    name: 'ZARA',
    logo: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=100&h=100&fit=crop',
    description: 'ファストファッション',
    isVerified: true,
    productCount: 890
  },
  {
    id: '3',
    name: 'H&M',
    logo: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&h=100&fit=crop',
    description: 'スウェーデン発ファッション',
    isVerified: true,
    productCount: 1100
  },
  {
    id: '4',
    name: 'GU',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop',
    description: 'プチプラファッション',
    isVerified: true,
    productCount: 650
  },
  {
    id: '5',
    name: 'MUJI',
    logo: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&h=100&fit=crop',
    description: 'シンプルライフスタイル',
    isVerified: true,
    productCount: 420
  },
  {
    id: '6',
    name: 'NIKE',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
    description: 'スポーツウェア',
    isVerified: true,
    productCount: 780
  },
  {
    id: '7',
    name: 'ADIDAS',
    logo: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=100&h=100&fit=crop',
    description: 'スポーツブランド',
    isVerified: true,
    productCount: 690
  },
  {
    id: '8',
    name: 'BEAMS',
    logo: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=100&h=100&fit=crop',
    description: 'セレクトショップ',
    isVerified: true,
    productCount: 340
  }
];