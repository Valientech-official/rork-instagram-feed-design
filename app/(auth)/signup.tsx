import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// このファイルは将来的な拡張用
// 現在はlogin画面で自動的に新規登録も処理される
export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text>Signup Screen (Reserved for future use)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
