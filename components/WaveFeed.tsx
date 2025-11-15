import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ViewToken,
  ActivityIndicator,
} from 'react-native';
import { Wave } from '@/mocks/waves';
import WavePlayer from './WavePlayer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WaveFeedProps {
  waves: Wave[];
  initialIndex?: number;
  onEndReached?: () => void;
  loading?: boolean;
}

export default function WaveFeed({
  waves,
  initialIndex = 0,
  onEndReached,
  loading = false,
}: WaveFeedProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  // 表示中のアイテムが変わったときに呼ばれる
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const visibleIndex = viewableItems[0].index;
        if (visibleIndex !== null && visibleIndex !== activeIndex) {
          setActiveIndex(visibleIndex);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // 50%以上表示されたらアクティブ
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Wave; index: number }) => {
      const isActive = index === activeIndex;
      return <WavePlayer wave={item} isActive={isActive} />;
    },
    [activeIndex]
  );

  const keyExtractor = useCallback((item: Wave) => item.id, []);

  const getItemLayout = useCallback(
    (_data: Wave[] | null | undefined, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={waves}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialIndex}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  footer: {
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
