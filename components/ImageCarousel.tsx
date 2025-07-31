import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, FlatList, TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

interface ImageCarouselProps {
  images: string[];
  onDoubleTap: () => void;
  width?: number;
}

export default function ImageCarousel({ images, onDoubleTap, width = screenWidth }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const lastTap = useRef<number>(0);
  
  // Create a stable callback using useCallback
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  // Create a stable viewability config
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;
  
  // Create a stable viewabilityConfigCallbackPairs array that never changes
  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged: handleViewableItemsChanged }
  ]).current;

  const handleImagePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      onDoubleTap();
      lastTap.current = 0; // Reset to prevent triple tap
    } else {
      // Single tap - store the time
      lastTap.current = now;
    }
  };

  const dynamicStyles = createStyles(width);

  return (
    <View style={dynamicStyles.container}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        renderItem={({ item }) => (
          <TouchableWithoutFeedback onPress={handleImagePress}>
            <Image
              source={{ uri: item }}
              style={dynamicStyles.image}
              contentFit="cover"
              transition={300}
            />
          </TouchableWithoutFeedback>
        )}
      />
      
      {images.length > 1 && (
        <View style={staticStyles.paginationContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                staticStyles.paginationDot,
                index === activeIndex && staticStyles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (containerWidth: number) => StyleSheet.create({
  container: {
    width: containerWidth,
    height: containerWidth,
    backgroundColor: Colors.light.background,
  },
  image: {
    width: containerWidth,
    height: containerWidth,
  },
});

const staticStyles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: Colors.light.primary,
  },
});