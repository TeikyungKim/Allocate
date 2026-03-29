import { InterstitialAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ios: 'ca-app-pub-9164387280735910/3995337552',
      android: 'ca-app-pub-9164387280735910/3995337552',
    }) || TestIds.INTERSTITIAL;

let interstitial: InterstitialAd | null = null;
let hasShownThisSession = false;

function loadInterstitial() {
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  interstitial.addAdEventListener(AdEventType.LOADED, () => {});
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    loadInterstitial();
  });

  interstitial.load();
}

export function showInterstitialAd(): boolean {
  if (hasShownThisSession) return false;
  if (!interstitial?.loaded) return false;

  interstitial.show();
  hasShownThisSession = true;
  return true;
}

export function initAds() {
  loadInterstitial();
}
