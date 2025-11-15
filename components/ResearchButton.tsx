import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Hand, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

interface ResearchButtonProps {
  onPress: () => void;
  onBudgetSelect?: (budget: string) => void;
}

const budgetOptions = [
  '3000円以内',
  '5000円以内',
  '7000円以内',
  '10000円以内',
  '15000円以内',
  '20000円以内',
  '25000円以内',
  '30000円以内',
  '40000円以内',
  '50000円以内',
  '上限なし',
];

export default function ResearchButton({ onPress, onBudgetSelect }: ResearchButtonProps) {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  const handleBudgetPress = () => {
    setIsBudgetOpen(!isBudgetOpen);
  };

  const handleBudgetSelect = (budget: string) => {
    setSelectedBudget(budget);
    setIsBudgetOpen(false);
    onBudgetSelect?.(budget);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <View style={styles.leftSection} />
        
        <TouchableOpacity style={styles.budgetButton} onPress={handleBudgetPress}>
          <Text style={styles.budgetText}>
            {selectedBudget || '￥予算'}
          </Text>
          {isBudgetOpen ? (
            <ChevronUp size={12} color={colors.primary} />
          ) : (
            <ChevronDown size={12} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.researchButton} onPress={onPress}>
          <Hand size={14} color={colors.primary} />
          <Text style={styles.researchText}>Research</Text>
        </TouchableOpacity>
      </View>
      
      {isBudgetOpen && (
        <View style={styles.budgetDropdown}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetScrollContent}
          >
            {budgetOptions.map((budget, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.budgetOption,
                  selectedBudget === budget && styles.selectedBudgetOption
                ]}
                onPress={() => handleBudgetSelect(budget)}
              >
                <Text style={[
                  styles.budgetOptionText,
                  selectedBudget === budget && styles.selectedBudgetOptionText
                ]}>
                  {budget}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.background,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    width: 160,
  },
  budgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  budgetText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  researchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  researchText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  budgetDropdown: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
  },
  budgetScrollContent: {
    paddingHorizontal: 12,
  },
  budgetOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.shopBackground,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedBudgetOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  budgetOptionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  selectedBudgetOptionText: {
    color: colors.background,
  },
});