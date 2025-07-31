import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Instagram, Twitter, Youtube, Link, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  icon: React.ReactNode;
}

const defaultAccounts: SocialAccount[] = [
  { 
    id: '1', 
    platform: 'Instagram', 
    username: '@username', 
    icon: <Instagram size={9} color={Colors.light.text} />
  },
  { 
    id: '2', 
    platform: 'Twitter', 
    username: '@username', 
    icon: <Twitter size={9} color={Colors.light.text} />
  },
  { 
    id: '3', 
    platform: 'YouTube', 
    username: 'Username', 
    icon: <Youtube size={9} color={Colors.light.text} />
  },
];

export default function ProfileSocialAccountsSection() {
  const [accounts, setAccounts] = React.useState<SocialAccount[]>(defaultAccounts);

  const handleAddAccount = () => {
    // In a real app, this would open a modal to add a new account
    console.log('Add social account');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>ソーシャルアカウント</Text>
        <TouchableOpacity onPress={handleAddAccount}>
          <Plus size={9} color={Colors.light.secondaryText} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.accountsList}
      >
        {accounts.map((account) => (
          <TouchableOpacity key={account.id} style={styles.accountItem}>
            {account.icon}
            <Text style={styles.accountPlatform}>{account.platform}</Text>
            <Text style={styles.accountUsername}>{account.username}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
          <Link size={9} color={Colors.light.secondaryText} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
    color: Colors.light.text,
  },
  accountsList: {
    flexDirection: 'row',
    paddingBottom: 2,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.shopBackground,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
    marginRight: 3,
    gap: 2,
  },
  accountPlatform: {
    fontSize: 9,
    color: Colors.light.text,
    fontWeight: '500',
  },
  accountUsername: {
    fontSize: 8,
    color: Colors.light.secondaryText,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
    gap: 2,
  },
  addButtonText: {
    fontSize: 9,
    color: Colors.light.secondaryText,
  },
});