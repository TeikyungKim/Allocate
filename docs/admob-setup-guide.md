# AdMob 등록 및 설정 방법

## 1. Google AdMob 계정 생성

1. [admob.google.com](https://admob.google.com) 접속
2. Google 계정으로 로그인
3. 국가, 시간대, 결제 통화 설정 (한국/KRW)

## 2. 앱 등록

1. AdMob 대시보드 → **앱** → **앱 추가**
2. "앱이 스토어에 게시되어 있나요?" → 아직이면 **아니요** 선택
3. 앱 이름: `Allocate`, 플랫폼: **Android** / **iOS** 각각 등록
4. 등록 후 **앱 ID** 확인 (형식: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`)

## 3. 광고 단위 생성

각 앱에서 광고 단위 3개 생성:

| 용도 | 유형 | 비고 |
|------|------|------|
| 전략 목록 배너 | **배너** | BANNER_STRATEGY |
| 포트폴리오 배너 | **배너** | BANNER_PORTFOLIO |
| 계산 전면광고 | **전면** | INTERSTITIAL |

생성 후 **광고 단위 ID** 메모 (형식: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)

## 4. 프로젝트에 적용

### `.env` 파일에 ID 입력

```env
EXPO_PUBLIC_ADMOB_APP_ANDROID=ca-app-pub-XXXX~XXXX
EXPO_PUBLIC_ADMOB_APP_IOS=ca-app-pub-XXXX~XXXX
EXPO_PUBLIC_BANNER_STRATEGY=ca-app-pub-XXXX/XXXX
EXPO_PUBLIC_BANNER_PORTFOLIO=ca-app-pub-XXXX/XXXX
EXPO_PUBLIC_INTERSTITIAL=ca-app-pub-XXXX/XXXX
```

### EAS Build 시크릿 등록 (프로덕션용)

```bash
eas secret:create --name EXPO_PUBLIC_ADMOB_APP_ANDROID --value "ca-app-pub-XXXX~XXXX"
eas secret:create --name EXPO_PUBLIC_ADMOB_APP_IOS --value "ca-app-pub-XXXX~XXXX"
eas secret:create --name EXPO_PUBLIC_BANNER_STRATEGY --value "ca-app-pub-XXXX/XXXX"
eas secret:create --name EXPO_PUBLIC_BANNER_PORTFOLIO --value "ca-app-pub-XXXX/XXXX"
eas secret:create --name EXPO_PUBLIC_INTERSTITIAL --value "ca-app-pub-XXXX/XXXX"
```

## 5. 주의사항

- **개발 중에는 테스트 광고 ID 사용** — 실제 ID로 자체 클릭하면 계정 정지될 수 있음
- `app.config.ts`에 이미 `react-native-google-mobile-ads` 플러그인이 설정되어 있으므로, `.env`만 채우면 됨
- **Expo Go에서는 동작 안 함** — 반드시 `eas build`로 개발 빌드 생성 필요
- 앱 출시 전 AdMob의 **app-ads.txt** 설정도 필요 (스토어 등록 시)
