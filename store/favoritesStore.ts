import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/mocks/products';
import { ProfilePost } from '@/mocks/profilePosts';

export interface FavoriteItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  addedAt: number;
}

export interface FavoritePost {
  id: string;
  postId: string;
  imageUrl: string;
  isVideo: boolean;
  addedAt: number;
}

interface FavoritesState {
  items: FavoriteItem[];
  posts: FavoritePost[];
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  addPostToFavorites: (post: ProfilePost) => void;
  removePostFromFavorites: (postId: string) => void;
  isPostFavorite: (postId: string) => boolean;
  clearFavorites: () => void;
  getFavoriteProducts: () => FavoriteItem[];
  getFavoritePosts: () => FavoritePost[];
}

// サンプルのお気に入り商品データ
const sampleFavorites: FavoriteItem[] = [
  {
    id: 'sample_1',
    productId: 'sample_1',
    name: 'カジュアルTシャツ',
    price: 2980,
    salePrice: 1980,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    addedAt: Date.now() - 86400000
  },
  {
    id: 'sample_2',
    productId: 'sample_2',
    name: 'デニムジャケット',
    price: 8900,
    image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=400&fit=crop',
    addedAt: Date.now() - 172800000
  },
  {
    id: 'sample_3',
    productId: 'sample_3',
    name: 'スニーカー',
    price: 12000,
    salePrice: 9600,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    addedAt: Date.now() - 259200000
  },
  {
    id: 'sample_4',
    productId: 'sample_4',
    name: 'ワンピース',
    price: 6800,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop',
    addedAt: Date.now() - 345600000
  },
  {
    id: 'sample_5',
    productId: 'sample_5',
    name: 'バックパック',
    price: 4500,
    salePrice: 3200,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    addedAt: Date.now() - 432000000
  },
  {
    id: 'sample_6',
    productId: 'sample_6',
    name: 'サングラス',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
    addedAt: Date.now() - 518400000
  }
];

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: sampleFavorites,
      posts: [],
      
      addToFavorites: (product) => {
        const { items } = get();
        const existingItem = items.find(item => item.productId === product.id);
        
        if (!existingItem) {
          const price = product.salePrice || product.price;
          set({
            items: [
              ...items,
              {
                id: `fav_${product.id}_${Date.now()}`,
                productId: product.id,
                name: product.name,
                price: product.price,
                salePrice: product.salePrice,
                image: product.images[0],
                addedAt: Date.now()
              }
            ]
          });
        }
      },
      
      removeFromFavorites: (productId) => {
        const { items } = get();
        set({
          items: items.filter(item => item.productId !== productId)
        });
      },
      
      isFavorite: (productId) => {
        const { items } = get();
        return items.some(item => item.productId === productId);
      },

      addPostToFavorites: (post) => {
        const { posts } = get();
        const existingPost = posts.find(item => item.postId === post.id);
        
        if (!existingPost) {
          set({
            posts: [
              ...posts,
              {
                id: `post_fav_${post.id}_${Date.now()}`,
                postId: post.id,
                imageUrl: post.imageUrl,
                isVideo: post.isVideo ?? false,
                addedAt: Date.now()
              }
            ]
          });
        }
      },

      removePostFromFavorites: (postId) => {
        const { posts } = get();
        set({
          posts: posts.filter(item => item.postId !== postId)
        });
      },

      isPostFavorite: (postId) => {
        const { posts } = get();
        return posts.some(item => item.postId === postId);
      },
      
      clearFavorites: () => {
        set({ items: [], posts: [] });
      },
      
      getFavoriteProducts: () => {
        const { items } = get();
        return items.sort((a, b) => b.addedAt - a.addedAt);
      },

      getFavoritePosts: () => {
        const { posts } = get();
        return posts.sort((a, b) => b.addedAt - a.addedAt);
      }
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);