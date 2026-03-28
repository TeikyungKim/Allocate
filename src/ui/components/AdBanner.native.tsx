import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
    }) || TestIds.BANNER;

export function AdBanner() {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
});
