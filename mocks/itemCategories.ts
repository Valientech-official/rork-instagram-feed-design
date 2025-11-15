export type ItemSubCategory = {
  id: string;
  name: string;
  keywords: string[];
};

export type ItemCategory = {
  id: string;
  name: string;
  subCategories: ItemSubCategory[];
};

export const itemCategories: ItemCategory[] = [
  {
    id: 'tops',
    name: 'トップス',
    subCategories: [
      { id: 't-shirt', name: 'Tシャツ', keywords: ['t-shirt', 'tee'] },
      { id: 'long-t', name: 'ロンT', keywords: ['long sleeve', 'long t-shirt'] },
      { id: 'sweat', name: 'スウェット', keywords: ['sweatshirt', 'sweater'] },
      { id: 'hoodie', name: 'パーカー', keywords: ['hoodie', 'pullover'] },
      { id: 'zip-hoodie', name: 'ジップパーカー', keywords: ['zip hoodie', 'zip up'] },
      { id: 'sleeveless', name: 'ノースリーブ／タンクトップ', keywords: ['sleeveless', 'tank top'] },
      { id: 'vest', name: 'ベスト', keywords: ['vest', 'gilet'] },
      { id: 'polo', name: 'ポロシャツ', keywords: ['polo shirt'] },
      { id: 'short-sleeve-shirt', name: '半袖シャツ', keywords: ['short sleeve shirt'] },
      { id: 'long-sleeve-shirt', name: '長袖シャツ', keywords: ['long sleeve shirt', 'button up'] },
      { id: 'knit', name: 'ニット／セーター', keywords: ['knit', 'sweater', 'knitwear'] },
      { id: 'camisole', name: 'キャミソール', keywords: ['camisole', 'cami'] },
      { id: 'tube-top', name: 'チューブトップ', keywords: ['tube top', 'bandeau'] },
      { id: 'other-tops', name: 'その他', keywords: ['tops', 'shirt', 'other'] },
    ],
  },
  {
    id: 'jackets',
    name: 'ジャケット／アウター',
    subCategories: [
      { id: 'denim-jacket', name: 'Gジャン／デニムジャケット', keywords: ['denim jacket', 'jean jacket'] },
      { id: 'nylon-jacket', name: 'ナイロンジャケット', keywords: ['nylon jacket', 'windbreaker'] },
      { id: 'ma1', name: 'MA-1', keywords: ['ma-1', 'bomber jacket'] },
      { id: 'stadium-jacket', name: 'スタジャン', keywords: ['stadium jacket', 'varsity jacket'] },
      { id: 'sukajan', name: 'スカジャン', keywords: ['sukajan', 'souvenir jacket'] },
      { id: 'military-jacket', name: 'ミリタリージャケット', keywords: ['military jacket'] },
      { id: 'riders-jacket', name: 'ライダースジャケット', keywords: ['riders jacket', 'motorcycle jacket', 'biker'] },
      { id: 'down-jacket', name: 'ダウンジャケット', keywords: ['down jacket', 'puffer'] },
      { id: 'mods-coat', name: 'モッズコート', keywords: ['mods coat', 'parka'] },
      { id: 'n2b-jacket', name: 'N2Bジャケット', keywords: ['n2b', 'flight jacket'] },
      { id: 'tailored-jacket', name: 'テーラードジャケット', keywords: ['tailored jacket', 'blazer'] },
      { id: 'blouson', name: 'ブルゾン', keywords: ['blouson', 'jacket'] },
      { id: 'duffle-coat', name: 'ダッフルコート', keywords: ['duffle coat', 'toggle coat'] },
      { id: 'pea-coat', name: 'ピーコート', keywords: ['pea coat', 'peacoat'] },
      { id: 'mountain-parka', name: 'マウンテンパーカー', keywords: ['mountain parka', 'outdoor jacket'] },
      { id: 'chester-coat', name: 'チェスターコート', keywords: ['chester coat', 'chesterfield'] },
      { id: 'pu-jacket', name: 'PUジャケット', keywords: ['pu jacket', 'faux leather'] },
      { id: 'leather-jacket', name: 'レザージャケット', keywords: ['leather jacket'] },
      { id: 'coverall', name: 'カバーオール', keywords: ['coverall', 'work jacket'] },
      { id: 'cardigan', name: 'カーディガン', keywords: ['cardigan'] },
      { id: 'other-jacket', name: 'その他アウター', keywords: ['jacket', 'outerwear', 'coat', 'other'] },
    ],
  },
  {
    id: 'pants',
    name: 'パンツ',
    subCategories: [
      { id: 'denim-pants', name: 'デニムパンツ', keywords: ['denim', 'jeans'] },
      { id: 'cargo-pants', name: 'カーゴパンツ', keywords: ['cargo pants'] },
      { id: 'chino-pants', name: 'チノパン', keywords: ['chino', 'chinos'] },
      { id: 'sweat-pants', name: 'スウェットパンツ', keywords: ['sweatpants', 'joggers'] },
      { id: 'slacks', name: 'スラックス', keywords: ['slacks', 'dress pants'] },
      { id: 'baggy-pants', name: 'バギーパンツ', keywords: ['baggy pants', 'wide leg'] },
      { id: 'parkour-pants', name: 'パルクールパンツ', keywords: ['parkour pants', 'tactical'] },
      { id: 'skinny-pants', name: 'スキニーパンツ', keywords: ['skinny', 'slim fit'] },
      { id: 'nylon-pants', name: 'ナイロンパンツ', keywords: ['nylon pants', 'track pants'] },
      { id: 'pattern-pants', name: '柄パンツ', keywords: ['patterned pants', 'print pants'] },
      { id: 'shorts', name: 'ショーツ／短パン', keywords: ['shorts'] },
      { id: 'flare-pants', name: 'フレアパンツ', keywords: ['flare pants', 'bell bottoms'] },
      { id: 'sarouel-pants', name: 'サルエルパンツ', keywords: ['sarouel', 'harem pants'] },
      { id: 'other-pants', name: 'その他', keywords: ['pants', 'trousers', 'other'] },
    ],
  },
  {
    id: 'overalls',
    name: 'オーバーオール／サロペット',
    subCategories: [
      { id: 'overalls-item', name: 'オーバーオール', keywords: ['overalls', 'dungarees'] },
      { id: 'salopette', name: 'サロペット', keywords: ['salopette', 'jumpsuit'] },
      { id: 'coveralls', name: 'つなぎ', keywords: ['coveralls', 'jumpsuit'] },
      { id: 'all-in-one', name: 'オールインワン', keywords: ['all in one', 'jumpsuit', 'romper'] },
      { id: 'other-overalls', name: 'その他', keywords: ['overalls', 'jumpsuit', 'other'] },
    ],
  },
  {
    id: 'skirts',
    name: 'スカート',
    subCategories: [
      { id: 'long-skirt', name: 'ロングスカート', keywords: ['long skirt', 'maxi skirt'] },
      { id: 'skirt', name: 'スカート', keywords: ['skirt'] },
      { id: 'mini-skirt', name: 'ミニスカート', keywords: ['mini skirt', 'short skirt'] },
      { id: 'denim-skirt', name: 'デニムスカート', keywords: ['denim skirt', 'jean skirt'] },
      { id: 'pattern-skirt', name: '柄スカート', keywords: ['patterned skirt', 'print skirt'] },
      { id: 'other-skirt', name: 'その他', keywords: ['skirt', 'other'] },
    ],
  },
  {
    id: 'dresses',
    name: 'ワンピース／ドレス',
    subCategories: [
      { id: 'one-piece', name: 'ワンピース', keywords: ['dress', 'one piece'] },
      { id: 'jumper-skirt', name: 'ジャンパースカート', keywords: ['jumper skirt', 'pinafore'] },
      { id: 'sleeved-dress', name: '袖ありワンピース', keywords: ['sleeved dress', 'long sleeve dress'] },
      { id: 'tunic', name: 'チュニック', keywords: ['tunic'] },
      { id: 'dress', name: 'ドレス', keywords: ['dress', 'gown'] },
      { id: 'other-dress', name: 'その他', keywords: ['dress', 'one piece', 'other'] },
    ],
  },
  {
    id: 'hats',
    name: '帽子',
    subCategories: [
      { id: 'straight-cap', name: 'ストレートキャップ', keywords: ['straight cap', 'baseball cap'] },
      { id: 'work-cap', name: 'ワークキャップ', keywords: ['work cap'] },
      { id: 'mesh-cap', name: 'メッシュキャップ', keywords: ['mesh cap', 'trucker hat'] },
      { id: 'jet-cap', name: 'ジェットキャップ', keywords: ['jet cap', 'baseball cap'] },
      { id: 'bucket-hat', name: 'バケットハット', keywords: ['bucket hat'] },
      { id: 'knit-cap', name: 'ニット帽', keywords: ['knit cap', 'beanie'] },
      { id: 'hunting-cap', name: 'ハンチング帽', keywords: ['hunting cap', 'newsboy cap'] },
      { id: 'newbork-hat', name: 'ニューボークハット', keywords: ['pork pie hat'] },
      { id: 'casquette', name: 'キャスケット', keywords: ['casquette', 'newsboy'] },
      { id: 'beret', name: 'ベレー帽', keywords: ['beret'] },
      { id: 'flight-cap', name: 'フライトキャップ', keywords: ['flight cap', 'aviator'] },
      { id: 'soft-hat', name: 'やわらか帽', keywords: ['soft hat', 'fedora'] },
      { id: 'fedora', name: '中折れハット', keywords: ['fedora', 'trilby'] },
      { id: 'other-hat', name: 'その他', keywords: ['hat', 'cap', 'other'] },
    ],
  },
  {
    id: 'shoes',
    name: '靴・スニーカー',
    subCategories: [
      { id: 'low-cut', name: 'ローカット', keywords: ['low cut', 'sneakers', 'low top'] },
      { id: 'mid-cut', name: 'ミドルカット', keywords: ['mid cut', 'mid top'] },
      { id: 'high-cut', name: 'ハイカット', keywords: ['high cut', 'high top', 'sneakers'] },
      { id: 'boots', name: 'ブーツ', keywords: ['boots'] },
      { id: 'leather-shoes', name: '革靴', keywords: ['leather shoes', 'dress shoes'] },
      { id: 'sandals', name: 'サンダル', keywords: ['sandals'] },
      { id: 'loafers', name: 'ローファー', keywords: ['loafers'] },
      { id: 'pumps', name: 'パンプス', keywords: ['pumps', 'heels'] },
      { id: 'other-shoes', name: 'その他', keywords: ['shoes', 'footwear', 'other'] },
    ],
  },
  {
    id: 'accessories',
    name: '小物',
    subCategories: [
      // 装身系クラス（サングラス）
      { id: 'sunglasses', name: 'サングラス', keywords: ['sunglasses', 'glasses'] },
      { id: 'unique-sunglasses', name: '個性系サングラス', keywords: ['sunglasses', 'unique', 'fashion'] },
      { id: 'sports-sunglasses', name: 'スポーツ系', keywords: ['sports', 'sunglasses', 'athletic'] },
      { id: 'other-sunglasses', name: 'その他', keywords: ['sunglasses', 'other'] },

      // 小物
      { id: 'necktie', name: 'ネクタイ', keywords: ['necktie', 'tie'] },
      { id: 'scarf', name: 'スカーフ', keywords: ['scarf'] },
      { id: 'bandana', name: 'バンダナ', keywords: ['bandana'] },
      { id: 'suspenders', name: 'サスペンダー', keywords: ['suspenders', 'braces'] },
      { id: 'gloves', name: '手袋', keywords: ['gloves'] },
      { id: 'muffler', name: 'マフラー', keywords: ['muffler', 'scarf'] },
      { id: 'stole', name: 'ストール', keywords: ['stole', 'shawl'] },
      { id: 'belt', name: 'ベルト', keywords: ['belt'] },
      { id: 'arm-cover', name: 'アームカバー', keywords: ['arm cover', 'sleeve'] },
      { id: 'mask', name: 'マスク', keywords: ['mask', 'face mask'] },
      { id: 'wallet', name: '財布', keywords: ['wallet', 'purse'] },

      // アクセサリー
      { id: 'necklace', name: 'ネックレス', keywords: ['necklace', 'jewelry'] },
      { id: 'bracelet', name: 'ブレスレット', keywords: ['bracelet', 'jewelry'] },
      { id: 'wallet-chain', name: 'ウォレットチェーン', keywords: ['wallet chain', 'chain'] },
      { id: 'carabiner', name: 'カラビナ', keywords: ['carabiner', 'keychain'] },
      { id: 'ring', name: 'リング', keywords: ['ring', 'jewelry'] },

      { id: 'other-accessories', name: 'その他', keywords: ['accessories', 'other'] },
    ],
  },
];
