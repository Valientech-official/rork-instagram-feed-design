/**
 * 課金モーダル - AI生成回数パック購入
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Sparkles, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';
import { useIAPStore } from '@/store/iapStore';
import { useIAP } from '@/hooks/useIAP';
import { getAllPacks } from '@/constants/products';

interface PurchaseModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PurchaseModal({ visible, onClose }: PurchaseModalProps) {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const { aiGenerationCount } = useIAPStore();
  const { products, loading, error, purchasing, purchaseProduct, restorePurchases } = useIAP();

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  const packs = getAllPacks();

  const handlePurchase = async () => {
    if (!selectedPackId) {
      Alert.alert('エラー', 'パックを選択してください');
      return;
    }

    try {
      await purchaseProduct(selectedPackId);
      // 購入成功時はモーダルを閉じる
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      // ユーザーキャンセルはアラート不要
      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('購入エラー', err.message || '購入処理に失敗しました');
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('復元完了', '購入履歴を復元しました');
    } catch (err: any) {
      Alert.alert('復元エラー', err.message || '購入復元に失敗しました');
    }
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* ヘッダー */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <Sparkles size={24} color={colors.primary} />
            <Text style={styles.modalTitle}>AI着せ替え回数を購入</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* 現在の残り回数 */}
          <View style={styles.currentCountBox}>
            <Text style={styles.currentCountLabel}>現在の残り回数</Text>
            <Text style={styles.currentCountValue}>{aiGenerationCount}回</Text>
          </View>

          {/* ローディング */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>商品情報を読み込んでいます...</Text>
            </View>
          )}

          {/* エラー */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* パック一覧 */}
          {!loading && !error && (
            <View style={styles.packsContainer}>
              {packs.map((pack) => {
                const isSelected = selectedPackId === pack.id;

                return (
                  <TouchableOpacity
                    key={pack.id}
                    style={[
                      styles.packCard,
                      isSelected && styles.packCardSelected,
                    ]}
                    onPress={() => setSelectedPackId(pack.id)}
                    activeOpacity={0.7}
                  >
                    {/* バッジ */}
                    {pack.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{pack.badge}</Text>
                      </View>
                    )}

                    {/* 選択インジケーター */}
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Check size={20} color="white" />
                      </View>
                    )}

                    <View style={styles.packHeader}>
                      <Text style={styles.packName}>{pack.name}</Text>
                      {pack.discount && (
                        <Text style={styles.packDiscount}>{pack.discount}</Text>
                      )}
                    </View>

                    <View style={styles.packBody}>
                      <Text style={styles.packPrice}>{pack.price}</Text>
                      <Text style={styles.packPricePerUse}>{pack.pricePerUse}</Text>
                    </View>

                    <View style={styles.packFooter}>
                      <Sparkles size={16} color={colors.secondaryText} />
                      <Text style={styles.packCount}>{pack.count}回分</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 購入ボタン */}
          {!loading && !error && (
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                (!selectedPackId || purchasing) && styles.purchaseButtonDisabled,
              ]}
              onPress={handlePurchase}
              disabled={!selectedPackId || purchasing}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.purchaseButtonText}>購入する</Text>
              )}
            </TouchableOpacity>
          )}

          {/* 購入復元ボタン */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={purchasing}
          >
            <Text style={styles.restoreButtonText}>購入を復元する</Text>
          </TouchableOpacity>

          {/* 注意事項 */}
          <View style={styles.noticeContainer}>
            <Text style={styles.noticeText}>
              ※ 購入した回数に有効期限はありません
            </Text>
            <Text style={styles.noticeText}>
              ※ 購入後のキャンセル・返金はできません
            </Text>
            <Text style={styles.noticeText}>
              ※ 機種変更時は「購入を復元する」をご利用ください
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  currentCountBox: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.shopBackground,
    alignItems: 'center',
  },
  currentCountLabel: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  currentCountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.secondaryText,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  packsContainer: {
    padding: 16,
    gap: 12,
  },
  packCard: {
    position: 'relative',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.border,
  },
  packCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.shopBackground,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  checkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  packName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  packDiscount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.shopSale,
  },
  packBody: {
    marginBottom: 12,
  },
  packPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.shopPrice,
    marginBottom: 4,
  },
  packPricePerUse: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  packFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  packCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  purchaseButton: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: colors.border,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  restoreButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  noticeContainer: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.shopBackground,
    gap: 8,
  },
  noticeText: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 18,
  },
});
