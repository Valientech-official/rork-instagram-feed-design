import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface ShoppingPostFooterProps {
  caption: string;
  username: string;
  likes: number;
  comments: number;
  timestamp: string;
  productId?: string;
}

export default function ShoppingPostFooter({ 
  caption, 
  username, 
  likes, 
  comments, 
  timestamp, 
  productId
}: ShoppingPostFooterProps) {
  const router = useRouter();
  
  // Function to render hashtags in a different color
  const renderCaption = (text: string, user: string) => {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const parts = text.split(hashtagRegex);
    const hashtags = text.match(hashtagRegex) || [];
    
    return (
      <Text>
        <Text style={styles.username}>{user}</Text>{' '}
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <Text style={styles.captionText}>{part}</Text>
            {index < hashtags.length && (
              <Text style={styles.hashtag}>{hashtags[index]}</Text>
            )}
          </React.Fragment>
        ))}
      </Text>
    );
  };

  const handleShopPress = () => {
    if (productId) {
      router.push(`/product/${productId}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.likesContainer}>
        <Text style={styles.likesText}>{likes.toLocaleString()} ピース</Text>
      </View>
      
      <View style={styles.captionContainer}>
        {renderCaption(caption, username)}
      </View>
      
      {comments > 0 && (
        <View style={styles.commentsContainer}>
          <Text style={styles.commentsText}>
            View all {comments} comments
          </Text>
        </View>
      )}
      
      <Text style={styles.timestamp}>{timestamp}</Text>
      
      {productId && (
        <TouchableOpacity style={styles.shopButton} onPress={handleShopPress}>
          <Text style={styles.shopButtonText}>View Product</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 12,
  },
  likesContainer: {
    marginBottom: 6,
  },
  likesText: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
  },
  captionContainer: {
    marginBottom: 8,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
  },
  captionText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  hashtag: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  commentsContainer: {
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  shopButton: {
    backgroundColor: Colors.light.shopBackground,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.light.shopAccent,
  },
  shopButtonText: {
    fontSize: 14,
    color: Colors.light.shopAccent,
    fontWeight: '500',
  },
});