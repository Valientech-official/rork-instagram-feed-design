export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  images: string[];
  description: string;
  category: string;
  tags: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  featured?: boolean;
  gender: 'メンズ' | 'レディース' | 'ユニセックス';
  seller: {
    id: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
}

export const products: Product[] = [
  {
    id: "p1",
    name: "シルクブラウス",
    price: 89.99,
    salePrice: 69.99,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=1000",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000"
    ],
    description: "オフィスにも夜のお出かけにも最適なエレガントなシルクブラウス。クラシックなカットにモダンなディテールが特徴。",
    category: "tops",
    tags: ["silk", "blouse", "elegant", "formal", "workwear"],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    featured: true,
    gender: "レディース",
    seller: {
      id: "user1",
      username: "janedoe",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true
    }
  },
  {
    id: "p2",
    name: "デザイナースニーカー",
    price: 159.99,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000"
    ],
    description: "快適さとスタイルを兼ね備えたプレミアムデザイナースニーカー。カジュアルやストリートウェアに最適。",
    category: "shoes",
    tags: ["sneakers", "designer", "comfort", "streetwear", "casual"],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    gender: "ユニセックス",
    seller: {
      id: "user2",
      username: "traveler",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true
    }
  },
  {
    id: "p3",
    name: "サマードレス",
    price: 79.99,
    salePrice: 59.99,
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000",
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000"
    ],
    description: "通気性の良い生地で作られたフローイングサマードレス。暖かい季節やカジュアルな場面に最適。",
    category: "dresses",
    tags: ["dress", "summer", "casual", "flowy", "bohemian"],
    rating: 4.5,
    reviews: 210,
    inStock: true,
    gender: "レディース",
    seller: {
      id: "user3",
      username: "foodie",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: false
    }
  },
  {
    id: "p4",
    name: "ラグジュアリーハンドバッグ",
    price: 299.99,
    images: [
      "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=1000",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000"
    ],
    description: "エレガントなデザインのプレミアムレザーハンドバッグ。複数のコンパートメントと調整可能なストラップ付き。",
    category: "accessories",
    tags: ["handbag", "leather", "luxury", "accessories", "elegant"],
    rating: 4.9,
    reviews: 67,
    inStock: true,
    featured: true,
    gender: "レディース",
    seller: {
      id: "user4",
      username: "fitnessguru",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true
    }
  },
  {
    id: "p5",
    name: "デニムジャケット",
    price: 89.99,
    images: [
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1000",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000"
    ],
    description: "モダンフィットのクラシックデニムジャケット。どんなコーディネートにも合う万能アイテム。",
    category: "outerwear",
    tags: ["denim", "jacket", "classic", "versatile", "casual"],
    rating: 4.3,
    reviews: 42,
    inStock: true,
    gender: "ユニセックス",
    seller: {
      id: "user1",
      username: "janedoe",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true
    }
  },
  {
    id: "p6",
    name: "ステートメントジュエリーセット",
    price: 49.99,
    salePrice: 39.99,
    images: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000",
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=1000"
    ],
    description: "ネックレスとイヤリングを含むボールドなステートメントジュエリーセット。どんなコーディネートも格上げ。",
    category: "jewelry",
    tags: ["jewelry", "statement", "accessories", "bold", "elegant"],
    rating: 4.7,
    reviews: 98,
    inStock: true,
    gender: "レディース",
    seller: {
      id: "user2",
      username: "traveler",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true
    }
  },
  {
    id: "p7",
    name: "メンズカジュアルシャツ",
    price: 45.99,
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000"
    ],
    description: "快適な綿100%のカジュアルシャツ。日常使いに最適なリラックスフィット。",
    category: "tops",
    tags: ["shirt", "casual", "cotton", "comfortable", "everyday"],
    rating: 4.4,
    reviews: 156,
    inStock: true,
    gender: "メンズ",
    seller: {
      id: "user5",
      username: "stylishguy",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true
    }
  },
  {
    id: "p8",
    name: "スリムフィットジーンズ",
    price: 79.99,
    salePrice: 59.99,
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000"
    ],
    description: "モダンなスリムフィットのプレミアムデニムジーンズ。スタイリッシュで快適な着心地。",
    category: "bottoms",
    tags: ["jeans", "denim", "slim-fit", "modern", "stylish"],
    rating: 4.6,
    reviews: 203,
    inStock: true,
    gender: "メンズ",
    seller: {
      id: "user5",
      username: "stylishguy",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true
    }
  },
  {
    id: "p9",
    name: "ニットセーター",
    price: 65.99,
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1000"
    ],
    description: "柔らかなウールブレンドのニットセーター。寒い季節に最適な暖かさとスタイル。",
    category: "tops",
    tags: ["sweater", "knitwear", "wool", "warm", "cozy", "minimalist"],
    rating: 4.5,
    reviews: 87,
    inStock: true,
    gender: "ユニセックス",
    seller: {
      id: "user6",
      username: "cozystyle",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: false
    }
  },
  {
    id: "p10",
    name: "フォーマルスーツ",
    price: 299.99,
    salePrice: 249.99,
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000"
    ],
    description: "ビジネスや特別な場面に最適なテーラードフォーマルスーツ。クラシックなカットと上質な生地。",
    category: "outerwear",
    tags: ["suit", "formal", "business", "tailored", "elegant", "classic"],
    rating: 4.8,
    reviews: 134,
    inStock: true,
    featured: true,
    gender: "メンズ",
    seller: {
      id: "user7",
      username: "businesspro",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true
    }
  },
  {
    id: "p11",
    name: "スポーツウェアセット",
    price: 89.99,
    images: [
      "https://images.unsplash.com/photo-1506629905607-d9c297d3d45b?q=80&w=1000",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000"
    ],
    description: "アクティブライフスタイルに最適な通気性の良いスポーツウェアセット。ジムやランニングに。",
    category: "activewear",
    tags: ["sportswear", "athletic", "breathable", "active", "gym", "sporty"],
    rating: 4.4,
    reviews: 176,
    inStock: true,
    gender: "ユニセックス",
    seller: {
      id: "user4",
      username: "fitnessguru",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: true
    }
  },
  {
    id: "p12",
    name: "ヴィンテージTシャツ",
    price: 29.99,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=1000"
    ],
    description: "レトロなデザインのヴィンテージスタイルTシャツ。カジュアルコーデの定番アイテム。",
    category: "tops",
    tags: ["t-shirt", "vintage", "retro", "casual", "comfortable"],
    rating: 4.2,
    reviews: 92,
    inStock: true,
    gender: "ユニセックス",
    seller: {
      id: "user8",
      username: "vintagelover",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      verified: false
    }
  }
];