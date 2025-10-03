import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PostCreationFlow from '@/components/PostCreationFlow';
import ProductListingFlow from '@/components/ProductListingFlow';
import WaveCreation from '@/components/WaveCreation';
import LiveStart from '@/components/LiveStart';

type TabType = 'post' | 'listing' | 'wave' | 'live';

export default function CreateScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('post');
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* タブヘッダー */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'post' && styles.tabActive]}
          onPress={() => setActiveTab('post')}
        >
          <Text style={[styles.tabText, activeTab === 'post' && styles.tabTextActive]}>
            投稿
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'listing' && styles.tabActive]}
          onPress={() => setActiveTab('listing')}
        >
          <Text style={[styles.tabText, activeTab === 'listing' && styles.tabTextActive]}>
            出品
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'wave' && styles.tabActive]}
          onPress={() => setActiveTab('wave')}
        >
          <Text style={[styles.tabText, activeTab === 'wave' && styles.tabTextActive]}>
            ウェーブ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'live' && styles.tabActive]}
          onPress={() => setActiveTab('live')}
        >
          <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>
            ライブ
          </Text>
        </TouchableOpacity>
      </View>

      {/* コンテンツ */}
      {activeTab === 'post' && <PostCreationFlow />}
      {activeTab === 'listing' && <ProductListingFlow />}
      {activeTab === 'wave' && <WaveCreation />}
      {activeTab === 'live' && <LiveStart />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  tabTextActive: {
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
