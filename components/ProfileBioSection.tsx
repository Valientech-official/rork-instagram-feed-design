import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2 } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function ProfileBioSection() {
  const [bio, setBio] = React.useState("This is a sample bio. Edit your profile to change this text.");

  const handleEditBio = () => {
    // In a real app, this would open a modal or navigate to an edit screen
    console.log('Edit bio');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <TouchableOpacity onPress={handleEditBio}>
          <Edit2 size={14} color={Colors.light.secondaryText} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.bioText}>{bio}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  bioText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
});