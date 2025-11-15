import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Instagram, Twitter, Youtube, Link, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
}

export default function ProfileSocialAccountsSection() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const defaultAccounts: SocialAccount[] = [
    { id: '1', platform: 'Instagram', username: '@username' },
    { id: '2', platform: 'Twitter', username: '@username' },
    { id: '3', platform: 'YouTube', username: 'Username' },
  ];

  const [accounts, setAccounts] = React.useState<SocialAccount[]>(defaultAccounts);

  const handleAddAccount = () => {
    // In a real app, this would open a modal to add a new account
    console.log('Add social account');
  };

  const getIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram size={9} color={colors.text} />;
      case 'Twitter':
        return <Twitter size={9} color={colors.text} />;
      case 'YouTube':
        return <Youtube size={9} color={colors.text} />;
      default:
        return <Link size={9} color={colors.text} />;
    }
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
    accountsList: {
      flexDirection: 'row',
      paddingBottom: 2,
    },
    accountItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.shopBackground,
      paddingVertical: 1,
      paddingHorizontal: 5,
      borderRadius: 3,
      marginRight: 3,
      gap: 2,
    },
    accountPlatform: {
      fontSize: 9,
      color: colors.text,
      fontWeight: '500',
    },
    accountUsername: {
      fontSize: 8,
      color: colors.secondaryText,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 1,
      paddingHorizontal: 5,
      borderRadius: 3,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      gap: 2,
    },
    addButtonText: {
      fontSize: 9,
      color: colors.secondaryText,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>ソーシャルアカウント</Text>
        <TouchableOpacity onPress={handleAddAccount}>
          <Plus size={9} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.accountsList}
      >
        {accounts.map((account) => (
          <TouchableOpacity key={account.id} style={styles.accountItem}>
            {getIcon(account.platform)}
            <Text style={styles.accountPlatform}>{account.platform}</Text>
            <Text style={styles.accountUsername}>{account.username}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
          <Link size={9} color={colors.secondaryText} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}