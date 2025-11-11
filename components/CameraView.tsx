/**
 * CameraView Component
 * フルスクリーンカメラUI（写真・動画対応）
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView as ExpoCameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { X, Camera, Video, RotateCcw, Zap, ZapOff, Image as ImageIcon } from 'lucide-react-native';
import { CameraManager, toggleCameraType, toggleFlashMode, getFlashModeIcon, type CaptureResult } from '@/lib/camera/cameraManager';
import { VideoManager, formatRecordingTime } from '@/lib/camera/videoManager';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type CameraMode = 'photo' | 'video';

interface CameraViewProps {
  mode?: CameraMode;
  onCapture: (result: CaptureResult) => void;
  onClose: () => void;
  maxVideoDuration?: number;
  showControls?: boolean;
  saveToLibrary?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  mode = 'photo',
  onCapture,
  onClose,
  maxVideoDuration = 60,
  showControls = true,
  saveToLibrary = false,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [currentMode, setCurrentMode] = useState<CameraMode>(mode);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const cameraRef = useRef<any>(null);
  const cameraManager = useRef(new CameraManager());
  const videoManager = useRef(new VideoManager());
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    cameraManager.current.setCameraType(cameraType);
    cameraManager.current.setFlashMode(flashMode);
  }, [cameraType, flashMode]);

  // maxVideoDuration変更時の処理
  useEffect(() => {
    videoManager.current.setMaxDuration(maxVideoDuration);
  }, [maxVideoDuration]);

  // 録画時間カウンター
  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        const status = videoManager.current.getRecordingStatus();
        setRecordingDuration(status.duration);

        // 最大録画時間に達したら自動停止
        if (status.duration >= maxVideoDuration) {
          handleStopRecording();
        }
      }, 100);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording, maxVideoDuration]);

  // パーミッション確認
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>カメラへのアクセス許可が必要です</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>許可する</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // 写真撮影
  const handleTakePicture = async () => {
    try {
      const result = await cameraManager.current.takePicture({
        quality: 1,
        saveToLibrary,
      });

      if (result) {
        onCapture(result);
      }
    } catch (error) {
      console.error('[CameraView] takePicture error:', error);
      Alert.alert('エラー', '写真の撮影に失敗しました');
    }
  };

  // 動画録画開始
  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await videoManager.current.startRecording({
        maxDuration: maxVideoDuration,
        quality: 'high',
        mute: false,
        saveToLibrary: false,
      });
    } catch (error) {
      console.error('[CameraView] startRecording error:', error);
      setIsRecording(false);
      Alert.alert('エラー', '録画の開始に失敗しました');
    }
  };

  // 動画録画停止
  const handleStopRecording = async () => {
    try {
      const result = await videoManager.current.stopRecording(saveToLibrary);
      setIsRecording(false);

      if (result) {
        onCapture(result);
      }
    } catch (error) {
      console.error('[CameraView] stopRecording error:', error);
      setIsRecording(false);
      Alert.alert('エラー', '録画の停止に失敗しました');
    }
  };

  // シャッターボタン押下
  const handleShutterPress = () => {
    if (currentMode === 'photo') {
      handleTakePicture();
    } else {
      if (isRecording) {
        handleStopRecording();
      } else {
        handleStartRecording();
      }
    }
  };

  // カメラ切替
  const handleToggleCamera = () => {
    setCameraType((prev) => toggleCameraType(prev));
  };

  // フラッシュ切替
  const handleToggleFlash = () => {
    setFlashMode((prev) => toggleFlashMode(prev));
  };

  // モード切替
  const handleToggleMode = () => {
    if (!isRecording) {
      setCurrentMode((prev) => (prev === 'photo' ? 'video' : 'photo'));
    }
  };

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <ExpoCameraView
          ref={(ref) => {
            cameraRef.current = ref;
            if (ref) {
              cameraManager.current.setCameraRef(ref);
              videoManager.current.setCameraRef(ref);
            }
          }}
          style={styles.camera}
          facing={cameraType}
          flash={flashMode}
        >
          {/* トップコントロール */}
          {showControls && (
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.controlButton} onPress={onClose}>
                <X size={28} color="white" />
              </TouchableOpacity>

              <View style={styles.topRightControls}>
                <TouchableOpacity style={styles.controlButton} onPress={handleToggleFlash}>
                  {flashMode === 'off' ? (
                    <ZapOff size={24} color="white" />
                  ) : (
                    <Zap size={24} color="yellow" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 録画時間表示 */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>
                {formatRecordingTime(recordingDuration)} / {formatRecordingTime(maxVideoDuration)}
              </Text>
            </View>
          )}

          {/* ボトムコントロール */}
          {showControls && (
            <View style={styles.bottomControls}>
              {/* モード切替 */}
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeButton, currentMode === 'photo' && styles.modeButtonActive]}
                  onPress={() => !isRecording && setCurrentMode('photo')}
                  disabled={isRecording}
                >
                  <Text style={[styles.modeText, currentMode === 'photo' && styles.modeTextActive]}>
                    写真
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, currentMode === 'video' && styles.modeButtonActive]}
                  onPress={() => !isRecording && setCurrentMode('video')}
                  disabled={isRecording}
                >
                  <Text style={[styles.modeText, currentMode === 'video' && styles.modeTextActive]}>
                    動画
                  </Text>
                </TouchableOpacity>
              </View>

              {/* シャッターボタン */}
              <View style={styles.shutterContainer}>
                <TouchableOpacity
                  style={[
                    styles.shutterButton,
                    isRecording && styles.shutterButtonRecording,
                  ]}
                  onPress={handleShutterPress}
                >
                  <View
                    style={[
                      styles.shutterButtonInner,
                      currentMode === 'video' && styles.shutterButtonInnerVideo,
                      isRecording && styles.shutterButtonInnerRecording,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* カメラ切替 */}
              <TouchableOpacity
                style={styles.toggleCameraButton}
                onPress={handleToggleCamera}
                disabled={isRecording}
              >
                <RotateCcw size={32} color={isRecording ? '#666' : 'white'} />
              </TouchableOpacity>
            </View>
          )}
        </ExpoCameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#999',
    fontSize: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 15,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
  },
  recordingTime: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modeSelector: {
    flexDirection: 'column',
    gap: 10,
    width: 60,
  },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  modeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeTextActive: {
    color: 'white',
  },
  shutterContainer: {
    alignItems: 'center',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  shutterButtonRecording: {
    borderColor: 'red',
  },
  shutterButtonInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'white',
  },
  shutterButtonInnerVideo: {
    borderRadius: 33,
  },
  shutterButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  toggleCameraButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraView;
