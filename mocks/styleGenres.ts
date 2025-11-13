export type StyleGenre = {
  id: string;
  name: string;
  keywords: string[];
  color?: string;
};

export const styleGenres: StyleGenre[] = [
  {
    id: 'casual',
    name: 'カジュアル',
    keywords: ['casual', 'relaxed', 'everyday'],
    color: '#87CEEB',
  },
  {
    id: 'simple',
    name: 'シンプル',
    keywords: ['simple', 'minimalist', 'basic'],
    color: '#F5F5F5',
  },
  {
    id: 'elegant',
    name: 'キレイめ',
    keywords: ['elegant', 'neat', 'clean', 'sophisticated'],
    color: '#E6E6FA',
  },
  {
    id: 'street',
    name: 'ストリート',
    keywords: ['street', 'urban', 'streetwear'],
    color: '#FFD700',
  },
  {
    id: 'hiphop',
    name: 'HIPHOP',
    keywords: ['hiphop', 'hip hop', 'rap', 'urban'],
    color: '#FF6347',
  },
  {
    id: 'classic',
    name: 'クラシック',
    keywords: ['classic', 'traditional', 'timeless'],
    color: '#D2B48C',
  },
  {
    id: 'vintage',
    name: '古着',
    keywords: ['vintage', 'retro', 'secondhand', 'thrift'],
    color: '#DEB887',
  },
  {
    id: 'military',
    name: 'ミリタリー',
    keywords: ['military', 'tactical', 'army'],
    color: '#556B2F',
  },
  {
    id: 'korean',
    name: '韓国系',
    keywords: ['korean', 'k-fashion', 'korea'],
    color: '#FFB6C1',
  },
  {
    id: 'overseas',
    name: '海外系',
    keywords: ['overseas', 'international', 'foreign'],
    color: '#98D8C8',
  },
  {
    id: 'americana',
    name: 'アメカジ',
    keywords: ['americana', 'american casual', 'amekaji'],
    color: '#4682B4',
  },
  {
    id: 'jirai',
    name: '地雷系',
    keywords: ['jirai', 'dark cute', 'yami kawaii'],
    color: '#DDA0DD',
  },
  {
    id: 'mass-produced',
    name: '量産型',
    keywords: ['mass produced', 'mainstream', 'popular'],
    color: '#FFC0CB',
  },
  {
    id: 'tight',
    name: 'タイト系',
    keywords: ['tight', 'fitted', 'slim'],
    color: '#C0C0C0',
  },
  {
    id: 'mode',
    name: 'モード系',
    keywords: ['mode', 'avant-garde', 'fashion forward'],
    color: '#2F4F4F',
  },
  {
    id: 'unique',
    name: '個性派',
    keywords: ['unique', 'individual', 'eccentric', 'original'],
    color: '#FF69B4',
  },
];
