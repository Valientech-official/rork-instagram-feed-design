import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Video, ShoppingBag, DoorOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const MAIN_CONTENT_WIDTH = (width * 4) / 5;
const CARD_WIDTH = MAIN_CONTENT_WIDTH * 0.8;

export default function RecommendationsSlider() {
  const router = useRouter();
  
  // Create recommendations array with random order
  const baseRecommendations = [
    {
      id: 'room',
      title: 'Room',
      description: 'Discover exclusive fashion content and styling tips',
      icon: <DoorOpen size={32} color="white" />,
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000",
      buttonText: 'Enter Now',
      onPress: () => router.push('/live')
    },
    {
      id: 'cm',
      title: 'ウェーブ',
      description: 'Check out our featured fashion products',
      icon: <ShoppingBag size={32} color="white" />,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000",
      buttonText: 'Shop Now',
      onPress: () => router.push('/shop')
    },
    {
      id: 'live',
      title: 'Live',
      description: 'Join fashion live streams and styling sessions',
      icon: <Video size={32} color="white" />,
      image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=80&w=1000",
      buttonText: 'Watch Now',
      onPress: () => router.push('/live')
    }
  ];
  
  // Shuffle the recommendations
  const recommendations = [...baseRecommendations].sort(() => Math.random() - 0.5);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommended for You</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        snapToAlignment="center"
      >
        {recommendations.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.card} 
            onPress={item.onPress}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.backgroundImage}
              contentFit="cover"
            />
            <View style={styles.overlay}>
              {item.icon}
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.button}>
                <Text style={styles.buttonText}>{item.buttonText}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 12,
    marginHorizontal: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});