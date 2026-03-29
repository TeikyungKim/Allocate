import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

type AdPlacement = 'strategy' | 'portfolio';

const AD_UNIT_IDS: Record<AdPlacement, string> = {
  strategy: 'ca-app-pub-9164387280735910/3565032060',
  portfolio: 'ca-app-pub-9164387280735910/1346062833',
};

function getAdUnitId(placement: AdPlacement): string {
  if (__DEV__) return TestIds.BANNER;
  return Platform.select({
    ios: AD_UNIT_IDS[placement],
    android: AD_UNIT_IDS[placement],
  }) || TestIds.BANNER;
}

export function AdBanner({ placement = 'strategy' }: { placement?: AdPlacement }) {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={getAdUnitId(placement)}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
});
