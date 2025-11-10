/**
 * Camera Manager
 * カメラ操作の共通ロジックを管理
 */

import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export type CaptureResult = {
  uri: string;
  type: 'photo' | 'video';
  width?: number;
  height?: number;
  duration?: number;
};

export type CameraManagerOptions = {
  quality?: number; // 0-1
  saveToLibrary?: boolean;
  base64?: boolean;
};

/**
 * カメラパーミッションの確認と要求
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[cameraManager] Permission request error:', error);
    return false;
  }
};

/**
 * メディアライブラリパーミッションの確認と要求
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[cameraManager] Media library permission error:', error);
    return false;
  }
};

/**
 * 写真をカメラで撮影（expo-image-picker使用）
 */
export const launchCamera = async (
  options: CameraManagerOptions = {}
): Promise<CaptureResult | null> => {
  try {
    // パーミッション確認
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('カメラへのアクセス許可が必要です');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: options.quality ?? 1,
      base64: options.base64 ?? false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];

    // メディアライブラリに保存（オプション）
    if (options.saveToLibrary) {
      await saveToMediaLibrary(asset.uri);
    }

    return {
      uri: asset.uri,
      type: 'photo',
      width: asset.width,
      height: asset.height,
    };
  } catch (error) {
    console.error('[cameraManager] launchCamera error:', error);
    throw error;
  }
};

/**
 * ギャラリーから画像を選択
 */
export const launchImageLibrary = async (
  options: CameraManagerOptions = {}
): Promise<CaptureResult | null> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: options.quality ?? 1,
      base64: options.base64 ?? false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      type: 'photo',
      width: asset.width,
      height: asset.height,
    };
  } catch (error) {
    console.error('[cameraManager] launchImageLibrary error:', error);
    throw error;
  }
};

/**
 * ビデオライブラリから動画を選択
 */
export const launchVideoLibrary = async (): Promise<CaptureResult | null> => {
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
    console.error('[cameraManager] launchVideoLibrary error:', error);
    throw error;
  }
};

/**
 * メディアライブラリに保存
 */
export const saveToMediaLibrary = async (uri: string): Promise<string | null> => {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      console.warn('[cameraManager] Media library permission denied');
      return null;
    }

    const asset = await MediaLibrary.createAssetAsync(uri);
    return asset.id;
  } catch (error) {
    console.error('[cameraManager] saveToMediaLibrary error:', error);
    return null;
  }
};

/**
 * 画像を圧縮
 */
export const compressImage = async (
  uri: string,
  quality: number = 0.8
): Promise<string> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return uri;
  } catch (error) {
    console.error('[cameraManager] compressImage error:', error);
    return uri;
  }
};

/**
 * 画像サイズを取得
 */
export const getImageSize = async (
  uri: string
): Promise<{ width: number; height: number }> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error('File does not exist');
    }

    // Note: FileSystem doesn't provide image dimensions
    // Use Image.getSize for this purpose in the component
    return { width: 0, height: 0 };
  } catch (error) {
    console.error('[cameraManager] getImageSize error:', error);
    return { width: 0, height: 0 };
  }
};

/**
 * カメラタイプを切り替え
 */
export const toggleCameraType = (currentType: CameraType): CameraType => {
  return currentType === 'back' ? 'front' : 'back';
};

/**
 * フラッシュモードを切り替え
 */
export const toggleFlashMode = (currentMode: FlashMode): FlashMode => {
  switch (currentMode) {
    case 'off':
      return 'on';
    case 'on':
      return 'auto';
    case 'auto':
      return 'off';
    default:
      return 'off';
  }
};

/**
 * フラッシュモードのアイコン名を取得
 */
export const getFlashModeIcon = (mode: FlashMode): string => {
  switch (mode) {
    case 'on':
      return 'flash-on';
    case 'off':
      return 'flash-off';
    case 'auto':
      return 'flash-auto';
    default:
      return 'flash-off';
  }
};

/**
 * カメラマネージャークラス
 * より高度なカメラ制御が必要な場合に使用
 */
export class CameraManager {
  private cameraRef: any = null;
  private cameraType: CameraType = 'back';
  private flashMode: FlashMode = 'off';

  setCameraRef(ref: any) {
    this.cameraRef = ref;
  }

  getCameraType(): CameraType {
    return this.cameraType;
  }

  setCameraType(type: CameraType) {
    this.cameraType = type;
  }

  toggleCamera() {
    this.cameraType = toggleCameraType(this.cameraType);
    return this.cameraType;
  }

  getFlashMode(): FlashMode {
    return this.flashMode;
  }

  setFlashMode(mode: FlashMode) {
    this.flashMode = mode;
  }

  toggleFlash() {
    this.flashMode = toggleFlashMode(this.flashMode);
    return this.flashMode;
  }

  /**
   * 写真を撮影
   */
  async takePicture(options: CameraManagerOptions = {}): Promise<CaptureResult | null> {
    if (!this.cameraRef) {
      throw new Error('Camera ref is not set');
    }

    try {
      const photo = await this.cameraRef.takePictureAsync({
        quality: options.quality ?? 1,
        base64: options.base64 ?? false,
        skipProcessing: false,
      });

      if (options.saveToLibrary) {
        await saveToMediaLibrary(photo.uri);
      }

      return {
        uri: photo.uri,
        type: 'photo',
        width: photo.width,
        height: photo.height,
      };
    } catch (error) {
      console.error('[CameraManager] takePicture error:', error);
      throw error;
    }
  }

  /**
   * カメラをリセット
   */
  reset() {
    this.cameraType = 'back';
    this.flashMode = 'off';
  }
}

export default CameraManager;
