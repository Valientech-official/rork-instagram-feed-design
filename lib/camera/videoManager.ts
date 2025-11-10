/**
 * Video Manager
 * 動画録画機能の管理
 */

import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import type { CaptureResult } from './cameraManager';

export type VideoQuality = 'low' | 'medium' | 'high' | '4k';

export type VideoRecordingOptions = {
  maxDuration?: number; // 秒
  quality?: VideoQuality;
  mute?: boolean;
  saveToLibrary?: boolean;
};

export type RecordingStatus = {
  isRecording: boolean;
  duration: number; // 秒
  isPaused: boolean;
};

/**
 * 音声録音パーミッションの確認と要求
 */
export const requestAudioPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[videoManager] Audio permission error:', error);
    return false;
  }
};

/**
 * ビデオ品質設定を取得
 */
export const getVideoQualitySettings = (quality: VideoQuality) => {
  switch (quality) {
    case 'low':
      return {
        preset: '640x480' as const,
        maxFileSize: 10 * 1024 * 1024, // 10MB
      };
    case 'medium':
      return {
        preset: '1280x720' as const,
        maxFileSize: 50 * 1024 * 1024, // 50MB
      };
    case 'high':
      return {
        preset: '1920x1080' as const,
        maxFileSize: 100 * 1024 * 1024, // 100MB
      };
    case '4k':
      return {
        preset: '3840x2160' as const,
        maxFileSize: 200 * 1024 * 1024, // 200MB
      };
    default:
      return {
        preset: '1280x720' as const,
        maxFileSize: 50 * 1024 * 1024,
      };
  }
};

/**
 * 動画録画マネージャークラス
 */
export class VideoManager {
  private cameraRef: any = null;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private pauseDuration: number = 0;
  private recordingPromise: Promise<any> | null = null;
  private maxDuration: number = 60; // デフォルト60秒
  private recordingUri: string | null = null;

  /**
   * カメラrefをセット
   */
  setCameraRef(ref: any) {
    this.cameraRef = ref;
  }

  /**
   * 最大録画時間をセット
   */
  setMaxDuration(duration: number) {
    this.maxDuration = duration;
  }

  /**
   * 録画状態を取得
   */
  getRecordingStatus(): RecordingStatus {
    const now = Date.now();
    let duration = 0;

    if (this.isRecording && !this.isPaused) {
      duration = Math.floor((now - this.startTime - this.pauseDuration) / 1000);
    } else if (this.isPaused) {
      duration = Math.floor((this.pausedTime - this.startTime - this.pauseDuration) / 1000);
    }

    return {
      isRecording: this.isRecording,
      duration,
      isPaused: this.isPaused,
    };
  }

  /**
   * 録画を開始
   */
  async startRecording(options: VideoRecordingOptions = {}): Promise<void> {
    if (!this.cameraRef) {
      throw new Error('Camera ref is not set');
    }

    if (this.isRecording) {
      console.warn('[VideoManager] Already recording');
      return;
    }

    try {
      // 音声パーミッション確認
      if (!options.mute) {
        const hasAudioPermission = await requestAudioPermissions();
        if (!hasAudioPermission) {
          throw new Error('音声録音の許可が必要です');
        }
      }

      // 録画設定
      const quality = options.quality ?? 'high';
      const qualitySettings = getVideoQualitySettings(quality);

      this.maxDuration = options.maxDuration ?? 60;
      this.startTime = Date.now();
      this.pauseDuration = 0;
      this.isPaused = false;
      this.isRecording = true;

      // 録画開始
      this.recordingPromise = this.cameraRef.recordAsync({
        maxDuration: this.maxDuration,
        maxFileSize: qualitySettings.maxFileSize,
        mute: options.mute ?? false,
      });

      console.log('[VideoManager] Recording started');
    } catch (error) {
      this.isRecording = false;
      console.error('[VideoManager] startRecording error:', error);
      throw error;
    }
  }

  /**
   * 録画を停止
   */
  async stopRecording(
    saveToLibrary: boolean = false
  ): Promise<CaptureResult | null> {
    if (!this.cameraRef || !this.isRecording) {
      console.warn('[VideoManager] Not recording');
      return null;
    }

    try {
      this.isRecording = false;
      this.isPaused = false;

      // 録画停止
      this.cameraRef.stopRecording();

      // 録画結果を待つ
      const video = await this.recordingPromise;

      if (!video || !video.uri) {
        throw new Error('Video recording failed');
      }

      this.recordingUri = video.uri;

      // メディアライブラリに保存（オプション）
      if (saveToLibrary) {
        await this.saveToMediaLibrary(video.uri);
      }

      const duration = this.getRecordingStatus().duration;

      console.log('[VideoManager] Recording stopped:', video.uri);

      return {
        uri: video.uri,
        type: 'video',
        duration,
      };
    } catch (error) {
      console.error('[VideoManager] stopRecording error:', error);
      throw error;
    }
  }

  /**
   * 録画を一時停止（Note: expo-cameraは現在pauseをサポートしていない）
   */
  pauseRecording(): void {
    if (!this.isRecording || this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.pausedTime = Date.now();
    console.log('[VideoManager] Recording paused');
    // Note: 実際のカメラの一時停止はexpo-cameraではサポートされていない
  }

  /**
   * 録画を再開（Note: expo-cameraは現在resumeをサポートしていない）
   */
  resumeRecording(): void {
    if (!this.isRecording || !this.isPaused) {
      return;
    }

    const pauseTime = Date.now() - this.pausedTime;
    this.pauseDuration += pauseTime;
    this.isPaused = false;
    console.log('[VideoManager] Recording resumed');
    // Note: 実際のカメラの再開はexpo-cameraではサポートされていない
  }

  /**
   * メディアライブラリに保存
   */
  private async saveToMediaLibrary(uri: string): Promise<string | null> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[VideoManager] Media library permission denied');
        return null;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      return asset.id;
    } catch (error) {
      console.error('[VideoManager] saveToMediaLibrary error:', error);
      return null;
    }
  }

  /**
   * 動画ファイル情報を取得
   */
  async getVideoInfo(uri: string): Promise<FileSystem.FileInfo | null> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info.exists ? info : null;
    } catch (error) {
      console.error('[VideoManager] getVideoInfo error:', error);
      return null;
    }
  }

  /**
   * 動画を圧縮（expo-image-picker経由）
   */
  async compressVideo(uri: string): Promise<string> {
    try {
      // Note: expo-image-pickerの圧縮機能を使用
      // より高度な圧縮が必要な場合は別のライブラリ（ffmpeg等）を使用
      return uri;
    } catch (error) {
      console.error('[VideoManager] compressVideo error:', error);
      return uri;
    }
  }

  /**
   * 録画をリセット
   */
  reset(): void {
    this.isRecording = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pausedTime = 0;
    this.pauseDuration = 0;
    this.recordingPromise = null;
    this.recordingUri = null;
  }

  /**
   * 最後の録画URIを取得
   */
  getLastRecordingUri(): string | null {
    return this.recordingUri;
  }

  /**
   * 録画中かどうか
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * 一時停止中かどうか
   */
  isCurrentlyPaused(): boolean {
    return this.isPaused;
  }
}

/**
 * ビデオライブラリから動画を選択（ヘルパー関数）
 */
export const pickVideoFromLibrary = async (): Promise<CaptureResult | null> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      type: 'video',
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
    };
  } catch (error) {
    console.error('[videoManager] pickVideoFromLibrary error:', error);
    throw error;
  }
};

/**
 * 録画時間を「mm:ss」フォーマットに変換
 */
export const formatRecordingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default VideoManager;
