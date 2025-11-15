import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

export default function ProfileBioSection() {
  const [bio, setBio] = React.useState("This is a sample bio. Edit your profile to change this text.");
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const handleEditBio = () => {
    // In a real app, this would open a modal or navigate to an edit screen
    console.log('Edit bio');
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      color: colors.text,
    },
    bioText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <TouchableOpacity onPress={handleEditBio}>
          <Edit2 size={14} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      <Text style={styles.bioText}>{bio}</Text>
    </View>
  );
}