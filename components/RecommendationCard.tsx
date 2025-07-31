import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Video, ShoppingBag, DoorOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function RecommendationCard() {
  const router = useRouter();
  
  // Randomly choose which type of recommendation to show
  const recommendationTypes = ['room', 'cm', 'live'];
  const randomType = recommendationTypes[Math.floor(Math.random() * recommendationTypes.length)];
  
  const handlePress = () => {
    switch (randomType) {
      case 'room':
        router.push('/live');
        break;
      case 'cm':
        router.push('/shop');
        break;
      case 'live':
        router.push('/live');
        break;
    }
  };
  
  const renderContent = () => {
    switch (randomType) {
      case 'room':
        return (
          <>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000" }}
              style={styles.backgroundImage}
              contentFit="cover"
            />
            <View style={styles.overlay}>
              <DoorOpen size={32} color="white" />
              <Text style={styles.title}>Room</Text>
              <Text style={styles.description}>Discover exclusive fashion content and styling tips</Text>
              <TouchableOpacity style={styles.button} onPress={handlePress}>
                <Text style={styles.buttonText}>Enter Now</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      
      case 'cm':
        return (
          <>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000" }}
              style={styles.backgroundImage}
              contentFit="cover"
            />
            <View style={styles.overlay}>
              <ShoppingBag size={32} color="white" />
              <Text style={styles.title}>ウェーブ</Text>
              <Text style={styles.description}>Check out our featured fashion products</Text>
              <TouchableOpacity style={styles.button} onPress={handlePress}>
                <Text style={styles.buttonText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      
      case 'live':
        return (
          <>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=80&w=1000" }}
              style={styles.backgroundImage}
              contentFit="cover"
            />
            <View style={styles.overlay}>
              <Video size={32} color="white" />
              <Text style={styles.title}>Live</Text>
              <Text style={styles.description}>Join fashion live streams and styling sessions</Text>
              <TouchableOpacity style={styles.button} onPress={handlePress}>
                <Text style={styles.buttonText}>Watch Now</Text>
              </TouchableOpacity>
            </View>
          </>
        );
    }
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.9}>
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
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