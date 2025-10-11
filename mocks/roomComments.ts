export interface RoomComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
  createdAt: number;
  likes?: number;
}

export const roomComments: RoomComment[] = [
  // Comments for r1p1
  {
    id: 'rc1',
    postId: 'r1p1',
    userId: 'user1',
    username: 'fashionista',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    text: 'このコーデ素敵ですね！どこのブランドですか？',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000,
    likes: 45
  },
  {
    id: 'rc2',
    postId: 'r1p1',
    userId: 'user2',
    username: 'stylemaker',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    text: '色合いがとても綺麗です✨',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000,
    likes: 38
  },
  {
    id: 'rc3',
    postId: 'r1p1',
    userId: 'user3',
    username: 'trendwatcher',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: '参考にさせていただきます！コーディネートのバランスが本当に素晴らしいと思います。',
    timestamp: '30分前',
    createdAt: Date.now() - 1800000,
    likes: 52
  },
  {
    id: 'rc4',
    postId: 'r1p1',
    userId: 'user4',
    username: 'casuallover',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'アクセサリーの選び方も勉強になります',
    timestamp: '15分前',
    createdAt: Date.now() - 900000,
    likes: 23
  },
  // Comments for r1p2
  {
    id: 'rc5',
    postId: 'r1p2',
    userId: 'user5',
    username: 'streetstyle',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    text: 'ストリートスタイル最高！',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'rc6',
    postId: 'r1p2',
    userId: 'user6',
    username: 'colorlover',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: 'このスタイル真似したいです。どこで購入されましたか？',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'rc7',
    postId: 'r1p2',
    userId: 'user7',
    username: 'minimalist',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: 'カジュアルで素敵',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  // Comments for r2p1
  {
    id: 'rc8',
    postId: 'r2p1',
    userId: 'user8',
    username: 'elegance',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop',
    text: '全身コーデ完璧です！',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  {
    id: 'rc9',
    postId: 'r2p1',
    userId: 'user9',
    username: 'trendsetter',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    text: '夏らしくて爽やか✨',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'rc10',
    postId: 'r2p1',
    userId: 'user10',
    username: 'summerlover',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: 'このバランス感覚、勉強になります！',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  // Comments for r3p1
  {
    id: 'rc11',
    postId: 'r3p1',
    userId: 'user11',
    username: 'couplelover',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: 'ペアルック可愛い💕',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  {
    id: 'rc12',
    postId: 'r3p1',
    userId: 'user12',
    username: 'romantic',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'お似合いです！',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  {
    id: 'rc13',
    postId: 'r3p1',
    userId: 'user13',
    username: 'matchmaker',
    avatar: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=150&h=150&fit=crop',
    text: 'コーディネートのアイデアをいただきました',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  // Comments for r4p1
  {
    id: 'rc14',
    postId: 'r4p1',
    userId: 'user14',
    username: 'businesspro',
    avatar: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=150&h=150&fit=crop',
    text: 'ビジネスカジュアル参考になります',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  {
    id: 'rc15',
    postId: 'r4p1',
    userId: 'user15',
    username: 'officestyle',
    avatar: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=150&h=150&fit=crop',
    text: 'プロフェッショナルで素敵',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  {
    id: 'rc16',
    postId: 'r4p1',
    userId: 'user16',
    username: 'workwear',
    avatar: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150&h=150&fit=crop',
    text: '会議でも自信を持って着られそうですね',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  // Comments for r5p1
  {
    id: 'rc17',
    postId: 'r5p1',
    userId: 'user17',
    username: 'fashionexpert',
    avatar: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=150&h=150&fit=crop',
    text: 'おすすめありがとうございます！',
    timestamp: '7時間前',
    createdAt: Date.now() - 25200000
  },
  {
    id: 'rc18',
    postId: 'r5p1',
    userId: 'user18',
    username: 'styleguide',
    avatar: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=150&h=150&fit=crop',
    text: 'とても参考になります✨',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  {
    id: 'rc19',
    postId: 'r5p1',
    userId: 'user19',
    username: 'trendfollow',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&h=150&fit=crop',
    text: 'このアイテム探してみます！どこのブランドでしょうか？',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  // Comments for r6p1
  {
    id: 'rc20',
    postId: 'r6p1',
    userId: 'user20',
    username: 'futurist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    text: 'トレンド予測興味深いです',
    timestamp: '8時間前',
    createdAt: Date.now() - 28800000
  },
  {
    id: 'rc21',
    postId: 'r6p1',
    userId: 'user21',
    username: 'nextgen',
    avatar: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=150&h=150&fit=crop',
    text: '来シーズンが楽しみ！',
    timestamp: '7時間前',
    createdAt: Date.now() - 25200000
  },
  {
    id: 'rc22',
    postId: 'r6p1',
    userId: 'user22',
    username: 'fashionforward',
    avatar: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=150&h=150&fit=crop',
    text: 'いつも最新情報をありがとうございます',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  // Add comments for more posts to ensure all have at least 2 comments
  // Comments for r1p5
  {
    id: 'rc31',
    postId: 'r1p5',
    userId: 'user31',
    username: 'accessorylover',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop',
    text: 'アクセサリーの選び方、とても参考になります！',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'rc32',
    postId: 'r1p5',
    userId: 'user32',
    username: 'jewelryexpert',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: 'シンプルなネックレスがおすすめです✨',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  // Comments for r1p6
  {
    id: 'rc33',
    postId: 'r1p6',
    userId: 'user33',
    username: 'shoelover',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'このコーデならパンプスが良いと思います👠',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'rc34',
    postId: 'r1p6',
    userId: 'user34',
    username: 'comfortfirst',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'スニーカーでカジュアルダウンも素敵だと思います！',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  // Comments for r1p7
  {
    id: 'rc35',
    postId: 'r1p7',
    userId: 'user35',
    username: 'layermaster',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'レイヤードのバランスが絶妙ですね！',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  {
    id: 'rc36',
    postId: 'r1p7',
    userId: 'user36',
    username: 'winterstyle',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: '重ね着のコツを教えてください🧥',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  // Comments for r1p8
  {
    id: 'rc37',
    postId: 'r1p8',
    userId: 'user37',
    username: 'patternlover',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: '柄の組み合わせが上手ですね🌸',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  {
    id: 'rc38',
    postId: 'r1p8',
    userId: 'user38',
    username: 'mixmaster',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: '柄物同士の合わせ方、勉強になります！',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  // Comments for r2p3
  {
    id: 'rc39',
    postId: 'r2p3',
    userId: 'user39',
    username: 'autumnlover',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop',
    text: '秋らしいコーデで素敵です🍂',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'rc40',
    postId: 'r2p3',
    userId: 'user40',
    username: 'layerstyle',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'トレンチコートとニットの組み合わせ、真似したいです！',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  // Comments for r2p4
  {
    id: 'rc41',
    postId: 'r2p4',
    userId: 'user41',
    username: 'winterfan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: '冬コーデのお手本ですね❄️',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'rc42',
    postId: 'r2p4',
    userId: 'user42',
    username: 'warmstyle',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: '暖かそうでおしゃれ！コートのブランドを教えてください',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  // Comments for r2p5
  {
    id: 'rc43',
    postId: 'r2p5',
    userId: 'user43',
    username: 'springfashion',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'パステルカラーが春らしくて素敵🌸',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  {
    id: 'rc44',
    postId: 'r2p5',
    userId: 'user44',
    username: 'softcolors',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: '軽やかな印象で新しい季節にぴったりですね！',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  // Comments for r2p6
  {
    id: 'rc45',
    postId: 'r2p6',
    userId: 'user45',
    username: 'casualchic',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: 'カジュアルシックなスタイル、参考になります💫',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  {
    id: 'rc46',
    postId: 'r2p6',
    userId: 'user46',
    username: 'denimstyle',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'デニムとブラウスの組み合わせ、きれいめで素敵です',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  // Comments for r2p7
  {
    id: 'rc47',
    postId: 'r2p7',
    userId: 'user47',
    username: 'elegantfan',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: 'エレガントで上品なスタイルですね✨',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  {
    id: 'rc48',
    postId: 'r2p7',
    userId: 'user48',
    username: 'formalstyle',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'フォーマルシーンでも使えそうで素晴らしいです！',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  // Comments for r2p8
  {
    id: 'rc49',
    postId: 'r2p8',
    userId: 'user49',
    username: 'streetfan',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'ストリートスタイルかっこいいです🔥',
    timestamp: '7時間前',
    createdAt: Date.now() - 25200000
  },
  {
    id: 'rc50',
    postId: 'r2p8',
    userId: 'user50',
    username: 'sneakerhead',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: 'スニーカーとキャップの組み合わせ、個性的で良いですね！',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  // Comments for r3p3
  {
    id: 'rc51',
    postId: 'r3p3',
    userId: 'user51',
    username: 'parkdate',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: '公園デートにぴったりのペアルックですね🌸',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'rc52',
    postId: 'r3p3',
    userId: 'user52',
    username: 'colorcoord',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: '色違いで合わせるアイデア、素敵です！',
    timestamp: '30分前',
    createdAt: Date.now() - 1800000
  },
  // Comments for r3p4
  {
    id: 'rc53',
    postId: 'r3p4',
    userId: 'user53',
    username: 'weddingguest',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: '結婚式のお呼ばれにも使えそうで素敵💫',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'rc54',
    postId: 'r3p4',
    userId: 'user54',
    username: 'formalpair',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'フォーマルなペアルック、とても上品ですね',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  // Comments for r3p5
  {
    id: 'rc55',
    postId: 'r3p5',
    userId: 'user55',
    username: 'gymcouple',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'ジムデートのペアルック、モチベーション上がりそう👟',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'rc56',
    postId: 'r3p5',
    userId: 'user56',
    username: 'activepair',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: 'スポーティーなペアルック、健康的で素敵です！',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  // Comments for r4p2 to r4p8 (adding more comments for situation room posts)
  {
    id: 'rc57',
    postId: 'r4p2',
    userId: 'user57',
    username: 'presentationpro',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: 'プレゼンテーション用のコーデ、とても参考になります！',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'rc58',
    postId: 'r4p2',
    userId: 'user58',
    username: 'businessstyle',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: '重要な会議でも自信を持てそうなスタイルですね✨',
    timestamp: '30分前',
    createdAt: Date.now() - 1800000
  },
  // Comments for r4p3
  {
    id: 'rc59',
    postId: 'r4p3',
    userId: 'user59',
    username: 'remoteworker',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: 'リモートワーク用のコーデ、気分が上がりそうです🏠',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'rc60',
    postId: 'r4p3',
    userId: 'user60',
    username: 'homeworker',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: '在宅でもおしゃれを楽しむのは大切ですね！',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  // Comments for r4p4
  {
    id: 'rc61',
    postId: 'r4p4',
    userId: 'user61',
    username: 'partylover',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'パーティー用のドレスアップ、華やかで素敵🎉',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'rc62',
    postId: 'r4p4',
    userId: 'user62',
    username: 'celebrationstyle',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: '誕生日パーティーにぴったりのコーデですね！',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  // Comments for r4p5
  {
    id: 'rc63',
    postId: 'r4p5',
    userId: 'user63',
    username: 'romanticdate',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: 'デート用のエレガントコーデ、とても素敵💕',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  {
    id: 'rc64',
    postId: 'r4p5',
    userId: 'user64',
    username: 'dinnerdate',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'レストランディナーにぴったりですね！',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  // Comments for r4p6
  {
    id: 'rc65',
    postId: 'r4p6',
    userId: 'user65',
    username: 'traveler',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: '旅行用の快適コーデ、参考になります✈️',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  {
    id: 'rc66',
    postId: 'r4p6',
    userId: 'user66',
    username: 'flightcomfort',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: '長時間のフライトでも楽ちんそうで良いですね！',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  // Comments for r4p7
  {
    id: 'rc67',
    postId: 'r4p7',
    userId: 'user67',
    username: 'fitnesslife',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'ジム用のスポーツウェア、モチベーション上がります💪',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  {
    id: 'rc68',
    postId: 'r4p7',
    userId: 'user68',
    username: 'workoutfan',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: 'カラーコーディネートが素敵で運動が楽しくなりそう！',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  // Comments for r4p8
  {
    id: 'rc69',
    postId: 'r4p8',
    userId: 'user69',
    username: 'weekendvibes',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: '週末のお出かけコーデ、リラックスできそうで素敵🌸',
    timestamp: '7時間前',
    createdAt: Date.now() - 25200000
  },
  {
    id: 'rc70',
    postId: 'r4p8',
    userId: 'user70',
    username: 'cafehopping',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'カフェ巡りやショッピングにぴったりですね！',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  // Comments for r5p2 to r5p8 (recommendation room posts)
  {
    id: 'rc71',
    postId: 'r5p2',
    userId: 'user71',
    username: 'trendseeker',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: '今季のおすすめアイテム、とても参考になります！',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'rc72',
    postId: 'r5p2',
    userId: 'user72',
    username: 'fashionbuyer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: '長く愛用できるピースの選び方、勉強になります✨',
    timestamp: '30分前',
    createdAt: Date.now() - 1800000
  },
  // Comments for r5p3
  {
    id: 'rc73',
    postId: 'r5p3',
    userId: 'user73',
    username: 'coloranalyst',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'パーソナルカラーに合わせた色選び、とても大切ですね🌈',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'rc74',
    postId: 'r5p3',
    userId: 'user74',
    username: 'colorlover',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: 'カラーコーディネートのコツを教えてください！',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  // Comments for r5p4
  {
    id: 'rc75',
    postId: 'r5p4',
    userId: 'user75',
    username: 'budgetshopper',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: 'プチプラで高見えするアイテム、ありがたい情報です💰',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'rc76',
    postId: 'r5p4',
    userId: 'user76',
    username: 'smartshopper',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'コスパ最強のファッションアイテム、参考にします！',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  // Comments for r5p5
  {
    id: 'rc77',
    postId: 'r5p5',
    userId: 'user77',
    username: 'seasonalbuyer',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: '季節の変わり目のアイテム選び、とても参考になります🍂',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  {
    id: 'rc78',
    postId: 'r5p5',
    userId: 'user78',
    username: 'transitionstyle',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'トランジションピースで長く楽しめるのは良いアイデアですね！',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  // Comments for r5p6
  {
    id: 'rc79',
    postId: 'r5p6',
    userId: 'user79',
    username: 'accessoryfan',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'アクセサリーでコーデを格上げするテクニック、素晴らしいです✨',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  {
    id: 'rc80',
    postId: 'r5p6',
    userId: 'user80',
    username: 'jewelryguide',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: 'おすすめのアクセサリーブランド、教えてください！',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  // Comments for r5p7
  {
    id: 'rc81',
    postId: 'r5p7',
    userId: 'user81',
    username: 'shoecollector',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: '足元から始めるおしゃれ、とても大切ですね👠',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  {
    id: 'rc82',
    postId: 'r5p7',
    userId: 'user82',
    username: 'shoeexpert',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'シーン別おすすめシューズ、参考になります！',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  // Comments for r5p8
  {
    id: 'rc83',
    postId: 'r5p8',
    userId: 'user83',
    username: 'ecofashion',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: 'サステナブルファッション、環境のことを考えて素晴らしいです🌱',
    timestamp: '7時間前',
    createdAt: Date.now() - 25200000
  },
  {
    id: 'rc84',
    postId: 'r5p8',
    userId: 'user84',
    username: 'ethicalbuyer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: '環境に優しいブランド、ぜひ教えてください！',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  // Comments for r6p2 to r6p9 (next trend room posts)
  {
    id: 'rc85',
    postId: 'r6p2',
    userId: 'user85',
    username: 'accessorytrend',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'アクセサリーのトレンド予測、とても興味深いです💎',
    timestamp: '8時間前',
    createdAt: Date.now() - 28800000
  },
  {
    id: 'rc86',
    postId: 'r6p2',
    userId: 'user86',
    username: 'trendwatcher',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: '来シーズンのアクセサリートレンド、楽しみです！',
    timestamp: '7時間前',
    createdAt: Date.now() - 25200000
  },
  // Comments for r6p3
  {
    id: 'rc87',
    postId: 'r6p3',
    userId: 'user87',
    username: 'springtrend',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: '2025年春夏のトレンド予測、パステルカラーが気になります🌸',
    timestamp: '30分前',
    createdAt: Date.now() - 1800000
  },
  {
    id: 'rc88',
    postId: 'r6p3',
    userId: 'user88',
    username: 'oversizedfan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'オーバーサイズシルエット、取り入れてみたいです！',
    timestamp: '15分前',
    createdAt: Date.now() - 900000
  },
  // Comments for r6p4
  {
    id: 'rc89',
    postId: 'r6p4',
    userId: 'user89',
    username: 'y2klover',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: 'Y2Kファッションの復活、懐かしくて新鮮です✨',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'rc90',
    postId: 'r6p4',
    userId: 'user90',
    username: 'metallicfan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'メタリック素材とローライズ、挑戦してみたいです！',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  // Comments for r6p5
  {
    id: 'rc91',
    postId: 'r6p5',
    userId: 'user91',
    username: 'sustainablefan',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'サステナブルファッションがトレンドになるのは素晴らしいです🌱',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'rc92',
    postId: 'r6p5',
    userId: 'user92',
    username: 'ecofriendly',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: '環境に優しい素材、もっと普及してほしいですね！',
    timestamp: '2時間前',
    createdAt: Date.now() - 7200000
  },
  // Comments for r6p6
  {
    id: 'rc93',
    postId: 'r6p6',
    userId: 'user93',
    username: 'genderfree',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: 'ジェンダーレスファッション、多様性を大切にした素晴らしいトレンドですね💫',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  {
    id: 'rc94',
    postId: 'r6p6',
    userId: 'user94',
    username: 'unisexstyle',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'ユニセックスアイテム、性別を問わず楽しめるのが良いですね！',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  // Comments for r6p7
  {
    id: 'rc95',
    postId: 'r6p7',
    userId: 'user95',
    username: 'techfan',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: 'テックウェアとスマートファッション、未来的で興味深いです🤖',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  {
    id: 'rc96',
    postId: 'r6p7',
    userId: 'user96',
    username: 'wearabletech',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'ウェアラブル技術の進化、ファッションの未来が楽しみです！',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  // Comments for r6p8
  {
    id: 'rc97',
    postId: 'r6p8',
    userId: 'user97',
    username: 'maximalismfan',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'マキシマリズムの復活、個性を表現できて素晴らしいです🌈',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  {
    id: 'rc98',
    postId: 'r6p8',
    userId: 'user98',
    username: 'boldpatterns',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: 'カラフルで大胆なパターンミックス、挑戦してみたいです！',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  // Comments for r6p9
  {
    id: 'rc99',
    postId: 'r6p9',
    userId: 'user99',
    username: 'vintagelover',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: 'ヴィンテージ×フューチャーの融合、とても興味深いコンセプトです✨',
    timestamp: '7時間前',
    createdAt: Date.now() - 25200000
  },
  {
    id: 'rc100',
    postId: 'r6p9',
    userId: 'user100',
    username: 'retrofuture',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'レトロな要素と未来的なデザインの組み合わせ、新しいスタイルですね！',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  // Comments for r1p3
  {
    id: 'rc23',
    postId: 'r1p3',
    userId: 'user23',
    username: 'officeworker',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'オフィスカジュアルの参考になります！',
    timestamp: '4時間前',
    createdAt: Date.now() - 14400000
  },
  {
    id: 'rc24',
    postId: 'r1p3',
    userId: 'user24',
    username: 'workstyle',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: '職場でも使えそうなコーデですね',
    timestamp: '3時間前',
    createdAt: Date.now() - 10800000
  },
  // Comments for r1p4
  {
    id: 'rc25',
    postId: 'r1p4',
    userId: 'user25',
    username: 'colorcoord',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: '色の組み合わせが素敵です！',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  {
    id: 'rc26',
    postId: 'r1p4',
    userId: 'user26',
    username: 'seasonalstyle',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    text: '季節感があって良いですね',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  // Comments for r2p2
  {
    id: 'rc27',
    postId: 'r2p2',
    userId: 'user27',
    username: 'athleisure',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop',
    text: 'アスレジャースタイル最高！',
    timestamp: '6時間前',
    createdAt: Date.now() - 21600000
  },
  {
    id: 'rc28',
    postId: 'r2p2',
    userId: 'user28',
    username: 'activewear',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&h=150&fit=crop',
    text: '機能性とファッション性を両立していて素晴らしいです',
    timestamp: '5時間前',
    createdAt: Date.now() - 18000000
  },
  // Comments for r3p2
  {
    id: 'rc29',
    postId: 'r3p2',
    userId: 'user29',
    username: 'datenight',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop',
    text: 'デートコーデの参考になります💕',
    timestamp: '1時間前',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'rc30',
    postId: 'r3p2',
    userId: 'user30',
    username: 'moviedate',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    text: '映画デートにぴったりですね！',
    timestamp: '30分前',
    createdAt: Date.now() - 1800000
  }
];

export const getCommentsForRoomPost = (postId: string): RoomComment[] => {
  return roomComments.filter(comment => comment.postId === postId);
};

export const getFirstTwoCommentsForRoomPost = (postId: string): RoomComment[] => {
  return getCommentsForRoomPost(postId).slice(0, 2);
};