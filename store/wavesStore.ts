/**
 * Waves Store
 * ウェーブ（短尺動画）の状態管理
 */

import { create } from 'zustand';
import { waves, Wave } from '@/mocks/waves';

interface WavesState {
  // State
  timelineWaves: Wave[];
  currentWave: Wave | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchTimeline: () => Promise<void>;
  getWave: (waveId: string) => Promise<Wave | null>;
  likeWave: (waveId: string) => Promise<void>;
  unlikeWave: (waveId: string) => Promise<void>;
  incrementViews: (waveId: string) => void;
  setCurrentWave: (wave: Wave | null) => void;
  reset: () => void;
}

const initialState = {
  timelineWaves: [],
  currentWave: null,
  loading: false,
  error: null,
};

export const useWavesStore = create<WavesState>((set, get) => ({
  ...initialState,

  /**
   * タイムラインのウェーブを取得
   */
  fetchTimeline: async () => {
    set({ loading: true, error: null });

    try {
      // TODO: 将来的にAPIから取得
      // const response = await fetch('/api/waves/timeline');
      // const data = await response.json();

      // モックデータをシャッフルして返す
      const shuffled = [...waves].sort(() => Math.random() - 0.5);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      set({
        timelineWaves: shuffled,
        loading: false,
      });
    } catch (error) {
      set({
        error: 'ウェーブの読み込みに失敗しました',
        loading: false,
      });
    }
  },

  /**
   * 個別ウェーブを取得
   */
  getWave: async (waveId: string) => {
    set({ loading: true, error: null });

    try {
      // TODO: 将来的にAPIから取得
      // const response = await fetch(`/api/waves/${waveId}`);
      // const data = await response.json();

      const wave = waves.find((w) => w.id === waveId) || null;

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      set({
        currentWave: wave,
        loading: false,
      });

      return wave;
    } catch (error) {
      set({
        error: 'ウェーブの読み込みに失敗しました',
        loading: false,
      });
      return null;
    }
  },

  /**
   * ウェーブにいいね
   */
  likeWave: async (waveId: string) => {
    try {
      // TODO: 将来的にAPIコール
      // await fetch(`/api/waves/${waveId}/like`, { method: 'POST' });

      // ローカル状態を更新
      set((state) => ({
        timelineWaves: state.timelineWaves.map((wave) =>
          wave.id === waveId
            ? { ...wave, isLiked: true, likes: wave.likes + 1 }
            : wave
        ),
        currentWave:
          state.currentWave?.id === waveId
            ? {
                ...state.currentWave,
                isLiked: true,
                likes: state.currentWave.likes + 1,
              }
            : state.currentWave,
      }));
    } catch (error) {
      console.error('Failed to like wave:', error);
    }
  },

  /**
   * ウェーブのいいねを解除
   */
  unlikeWave: async (waveId: string) => {
    try {
      // TODO: 将来的にAPIコール
      // await fetch(`/api/waves/${waveId}/like`, { method: 'DELETE' });

      // ローカル状態を更新
      set((state) => ({
        timelineWaves: state.timelineWaves.map((wave) =>
          wave.id === waveId
            ? { ...wave, isLiked: false, likes: Math.max(0, wave.likes - 1) }
            : wave
        ),
        currentWave:
          state.currentWave?.id === waveId
            ? {
                ...state.currentWave,
                isLiked: false,
                likes: Math.max(0, state.currentWave.likes - 1),
              }
            : state.currentWave,
      }));
    } catch (error) {
      console.error('Failed to unlike wave:', error);
    }
  },

  /**
   * 視聴回数をインクリメント
   */
  incrementViews: (waveId: string) => {
    set((state) => ({
      timelineWaves: state.timelineWaves.map((wave) =>
        wave.id === waveId ? { ...wave, views: wave.views + 1 } : wave
      ),
      currentWave:
        state.currentWave?.id === waveId
          ? { ...state.currentWave, views: state.currentWave.views + 1 }
          : state.currentWave,
    }));

    // TODO: 将来的にバックエンドに送信
    // fetch(`/api/waves/${waveId}/view`, { method: 'POST' });
  },

  /**
   * 現在のウェーブを設定
   */
  setCurrentWave: (wave: Wave | null) => {
    set({ currentWave: wave });
  },

  /**
   * ストアをリセット
   */
  reset: () => {
    set(initialState);
  },
}));
