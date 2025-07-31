export interface Hashtag {
  id: string;
  name: string;
  postCount: number;
  isPopular: boolean;
  category: 'fashion' | 'style' | 'brand' | 'trend' | 'season';
}

export const hashtags: Hashtag[] = [
  {
    id: '1',
    name: 'OOTD',
    postCount: 125000,
    isPopular: true,
    category: 'fashion'
  },
  {
    id: '2',
    name: 'コーデ',
    postCount: 98000,
    isPopular: true,
    category: 'fashion'
  },
  {
    id: '3',
    name: 'プチプラ',
    postCount: 67000,
    isPopular: true,
    category: 'trend'
  },
  {
    id: '4',
    name: 'カジュアル',
    postCount: 54000,
    isPopular: true,
    category: 'style'
  },
  {
    id: '5',
    name: 'きれいめ',
    postCount: 43000,
    isPopular: true,
    category: 'style'
  },
  {
    id: '6',
    name: '春コーデ',
    postCount: 38000,
    isPopular: true,
    category: 'season'
  },
  {
    id: '7',
    name: 'ユニクロ',
    postCount: 72000,
    isPopular: true,
    category: 'brand'
  },
  {
    id: '8',
    name: 'ZARA',
    postCount: 45000,
    isPopular: true,
    category: 'brand'
  },
  {
    id: '9',
    name: 'GU',
    postCount: 56000,
    isPopular: true,
    category: 'brand'
  },
  {
    id: '10',
    name: 'モノトーン',
    postCount: 29000,
    isPopular: false,
    category: 'style'
  },
  {
    id: '11',
    name: 'ストリート',
    postCount: 31000,
    isPopular: false,
    category: 'style'
  },
  {
    id: '12',
    name: 'フェミニン',
    postCount: 22000,
    isPopular: false,
    category: 'style'
  },
  {
    id: '13',
    name: '夏コーデ',
    postCount: 41000,
    isPopular: true,
    category: 'season'
  },
  {
    id: '14',
    name: '秋コーデ',
    postCount: 35000,
    isPopular: false,
    category: 'season'
  },
  {
    id: '15',
    name: '冬コーデ',
    postCount: 33000,
    isPopular: false,
    category: 'season'
  }
];