import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedPhoto {
  id: string;
  uri: string;
  timestamp: number;
  name?: string;
}

interface PhotoGalleryState {
  photos: SavedPhoto[];
  addPhoto: (photo: Omit<SavedPhoto, 'id' | 'timestamp'>) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;
}

export const usePhotoGalleryStore = create<PhotoGalleryState>()(persist(
  (set, get) => ({
    photos: [],
    
    addPhoto: (photo) => {
      const newPhoto: SavedPhoto = {
        ...photo,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      
      set((state) => ({
        photos: [newPhoto, ...state.photos], // Add new photos at the beginning
      }));
    },
    
    removePhoto: (id) => {
      set((state) => ({
        photos: state.photos.filter(photo => photo.id !== id),
      }));
    },
    
    clearPhotos: () => {
      set({ photos: [] });
    },
  }),
  {
    name: 'photo-gallery-storage',
    storage: createJSONStorage(() => AsyncStorage),
  }
));