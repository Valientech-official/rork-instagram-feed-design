export interface GenreData {
  id: string;
  name: string;
  emoji: string;
}

export interface StyleData {
  id: string;
  name: string;
  image: string;
}

export interface BrandData {
  id: string;
  name: string;
  logo?: string;
}

export const FASHION_GENRES: GenreData[] = [
  { id: 'casual', name: 'カジュアル', emoji: '👕' },
  { id: 'street', name: 'ストリート', emoji: '🛹' },
  { id: 'minimal', name: 'ミニマル', emoji: '⚪' },
  { id: 'vintage', name: 'ヴィンテージ', emoji: '🕰️' },
  { id: 'mode', name: 'モード', emoji: '🎩' },
  { id: 'sporty', name: 'スポーティ', emoji: '⚽' },
  { id: 'girly', name: 'ガーリー', emoji: '🎀' },
  { id: 'elegant', name: 'エレガント', emoji: '💎' },
  { id: 'rock', name: 'ロック', emoji: '🎸' },
  { id: 'preppy', name: 'プレッピー', emoji: '📚' },
  { id: 'bohemian', name: 'ボヘミアン', emoji: '🌻' },
  { id: 'gothic', name: 'ゴシック', emoji: '🦇' },
  { id: 'kawaii', name: 'カワイイ', emoji: '🌈' },
  { id: 'outdoor', name: 'アウトドア', emoji: '⛰️' },
  { id: 'formal', name: 'フォーマル', emoji: '👔' },
];

export const FASHION_STYLES: StyleData[] = [
  {
    id: 'style_1',
    name: 'モノトーン',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
  },
  {
    id: 'style_2',
    name: 'カラフル',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
  },
  {
    id: 'style_3',
    name: 'ナチュラル',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
  },
  {
    id: 'style_4',
    name: 'モダン',
    image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400',
  },
  {
    id: 'style_5',
    name: 'レトロ',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea8f6b96?w=400',
  },
  {
    id: 'style_6',
    name: 'アーバン',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400',
  },
  {
    id: 'style_7',
    name: 'フェミニン',
    image: 'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=400',
  },
  {
    id: 'style_8',
    name: 'マスキュリン',
    image: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400',
  },
];

export const POPULAR_BRANDS: BrandData[] = [
  { id: 'adidas', name: 'Adidas' },
  { id: 'apc', name: 'A.P.C.' },
  { id: 'balenciaga', name: 'Balenciaga' },
  { id: 'burberry', name: 'Burberry' },
  { id: 'calvin_klein', name: 'Calvin Klein' },
  { id: 'carhartt', name: 'Carhartt' },
  { id: 'champion', name: 'Champion' },
  { id: 'chanel', name: 'Chanel' },
  { id: 'comme_des_garcons', name: 'Comme des Garçons' },
  { id: 'converse', name: 'Converse' },
  { id: 'dickies', name: 'Dickies' },
  { id: 'dior', name: 'Dior' },
  { id: 'fendi', name: 'Fendi' },
  { id: 'gap', name: 'GAP' },
  { id: 'gucci', name: 'Gucci' },
  { id: 'hm', name: 'H&M' },
  { id: 'hermes', name: 'Hermès' },
  { id: 'issey_miyake', name: 'Issey Miyake' },
  { id: 'jil_sander', name: 'Jil Sander' },
  { id: 'lacoste', name: 'Lacoste' },
  { id: 'levis', name: "Levi's" },
  { id: 'louis_vuitton', name: 'Louis Vuitton' },
  { id: 'moncler', name: 'Moncler' },
  { id: 'nike', name: 'Nike' },
  { id: 'north_face', name: 'The North Face' },
  { id: 'off_white', name: 'Off-White' },
  { id: 'palace', name: 'Palace' },
  { id: 'patagonia', name: 'Patagonia' },
  { id: 'polo', name: 'Polo Ralph Lauren' },
  { id: 'prada', name: 'Prada' },
  { id: 'puma', name: 'Puma' },
  { id: 'reebok', name: 'Reebok' },
  { id: 'saint_laurent', name: 'Saint Laurent' },
  { id: 'stussy', name: 'Stüssy' },
  { id: 'supreme', name: 'Supreme' },
  { id: 'tommy_hilfiger', name: 'Tommy Hilfiger' },
  { id: 'uniqlo', name: 'Uniqlo' },
  { id: 'vans', name: 'Vans' },
  { id: 'versace', name: 'Versace' },
  { id: 'yohji_yamamoto', name: 'Yohji Yamamoto' },
  { id: 'zara', name: 'Zara' },
];

export const WELCOME_IMAGES = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
  'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400',
  'https://images.unsplash.com/photo-1558769132-cb1aea8f6b96?w=400',
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400',
  'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=400',
  'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
];
