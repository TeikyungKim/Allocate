import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function AdBanner() {
  // Native ads are loaded via AdBanner.native.tsx
  // This is the web/fallback version
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>AD</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
  placeholder: {
    height: 50,
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
});
