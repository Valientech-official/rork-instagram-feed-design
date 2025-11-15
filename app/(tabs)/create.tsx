import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PostCreationFlow from '@/components/PostCreationFlow';
import ProductListingFlow from '@/components/ProductListingFlow';
import WaveCreation from '@/components/WaveCreation';
import LiveStart from '@/components/LiveStart';
import CreateModeSelector from '@/components/CreateModeSelector';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useThemeStore } from '@/store/themeStore';

type ModeType = 'post' | 'listing' | 'wave' | 'live' | null;

export default function CreateScreen() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const [showSelector, setShowSelector] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ModeType>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setShowSelector(true);
      setSelectedMode(null);
      return () => {
        setShowSelector(false);
      };
    }, [])
  );

  const handleSelectMode = (mode: 'post' | 'listing' | 'wave' | 'live') => {
    setSelectedMode(mode);
    setShowSelector(false);
  };

  const handleCloseSelector = () => {
    setShowSelector(false);
    router.back();
  };

  const handleCloseMode = () => {
    setSelectedMode(null);
    setShowSelector(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modeContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return (
    <View style={styles.container}>
      <CreateModeSelector
        visible={showSelector && selectedMode === null}
        onClose={handleCloseSelector}
        onSelectMode={handleSelectMode}
      />

      <Modal
        visible={selectedMode !== null}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={[styles.modeContainer, { paddingTop: insets.top }]}>
          {selectedMode === 'post' && <PostCreationFlow onClose={handleCloseMode} />}
          {selectedMode === 'listing' && <ProductListingFlow onClose={handleCloseMode} />}
          {selectedMode === 'wave' && <WaveCreation onClose={handleCloseMode} />}
          {selectedMode === 'live' && <LiveStart onClose={handleCloseMode} />}
        </View>
      </Modal>
    </View>
  );
}
