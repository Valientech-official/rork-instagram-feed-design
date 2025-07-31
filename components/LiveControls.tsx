import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Heart, MessageCircle, Gift, Share, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface LiveControlsProps {
  onClose: () => void;
  onSendComment: (text: string) => void;
}

export default function LiveControls({ onClose, onSendComment }: LiveControlsProps) {
  const [comment, setComment] = React.useState('');
  const [showReactions, setShowReactions] = React.useState(false);

  const handleReactionPress = () => {
    setShowReactions(!showReactions);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSendComment = () => {
    if (comment.trim()) {
      onSendComment(comment);
      setComment('');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topControls}>
        <View style={styles.viewerCount}>
          <View style={styles.liveIndicator} />
          <Text style={styles.viewerCountText}>1,245 viewers</Text>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.bottomControls}>
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={comment}
            onChangeText={setComment}
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !comment.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendComment}
            disabled={!comment.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleReactionPress}>
            <Heart size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Gift size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {showReactions && (
          <View style={styles.reactionsPanel}>
            <TouchableOpacity style={styles.reactionButton}>
              <Text style={styles.reactionEmoji}>❤️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reactionButton}>
              <Text style={styles.reactionEmoji}>👍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reactionButton}>
              <Text style={styles.reactionEmoji}>🔥</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reactionButton}>
              <Text style={styles.reactionEmoji}>👏</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reactionButton}>
              <Text style={styles.reactionEmoji}>😍</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 6,
  },
  viewerCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    height: 40,
    color: 'white',
    fontSize: 14,
  },
  sendButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 149, 246, 0.5)',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    padding: 8,
    marginTop: 12,
  },
  reactionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 24,
  },
});