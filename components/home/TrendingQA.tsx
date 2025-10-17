import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { MoreHorizontal } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

interface QAItem {
  id: string;
  question: string;
  productImage: string;
  productName: string;
  productBrand: string;
  price: string;
}

const QA_ITEMS: QAItem[] = [
  {
    id: '1',
    question: 'このジャケット、どんなボトムスと合わせたらいいですか？\nカジュアルにもフォーマルにも使えますか？',
    productImage: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
    productName: 'レザージャケット',
    productBrand: 'アーバンスタイル',
    price: '¥24,800',
  },
];

export default function TrendingQA() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>トレンドQ&A</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.viewAnswersButton}>
            <Text style={styles.viewAnswersText}>回答を見る</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postYoursButton}>
            <Text style={styles.postYoursText}>質問する</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {QA_ITEMS.map((item) => (
          <View key={item.id} style={styles.qaCard}>
            <Text style={styles.question}>{item.question}</Text>
            <View style={styles.productSection}>
              <Image
                source={{ uri: item.productImage }}
                style={styles.productImage}
                contentFit="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{item.productBrand}</Text>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.price}>{item.price}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cartButton}>
              <Text style={styles.cartButtonText}>カートに追加</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewAnswersButton: {
    paddingVertical: 6,
  },
  viewAnswersText: {
    fontSize: 14,
    color: colors.text,
    textDecorationLine: 'underline',
  },
  postYoursButton: {
    paddingVertical: 6,
  },
  postYoursText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  qaCard: {
    width: 300,
    backgroundColor: colors.text,
    borderRadius: 16,
    padding: 16,
  },
  question: {
    fontSize: 14,
    color: colors.background,
    marginBottom: 16,
    lineHeight: 20,
  },
  productSection: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productBrand: {
    fontSize: 12,
    color: colors.background,
    marginBottom: 4,
    opacity: 0.7,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  cartButton: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cartButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
