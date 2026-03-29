import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Card } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { Strategy } from '../../../data/strategies';
import { ETFUniverse } from '../../../data/etfs';
import { usePriceData } from '../../../hooks/usePriceData';
import { TickerMomentum, fetchUnemploymentData, analyzeUnemployment } from '../../../services/priceService';

interface Props {
  strategy: Strategy;
  etfMap: ETFUniverse;
  onMomentumLoaded?: (momentum: Record<string, TickerMomentum>) => void;
  onUnemploymentLoaded?: (info: { isAbove: boolean; current: number; sma12: number }) => void;
}

// ── 스코어 유형별 정의 ──────────────────────────────────

type ScoreType = '13612W' | '12m' | 'avg-multi' | 'sma' | 'breadth' | 'momentum-minvar' | 'none';

function getScoreType(method: string): ScoreType {
  switch (method) {
    case 'vaa': case 'daa': case 'baa': case 'vigilant':
      return '13612W';
    case 'dual-momentum': case 'papa-dm': case 'edm': case 'laa':
      return '12m';
    case 'adm': case 'cam':
      return 'avg-multi';
    case 'gtaa':
      return 'sma';
    case 'paa': case 'pdm': case 'gpm':
      return 'breadth';
    case 'aaa':
      return 'momentum-minvar';
    default:
      return 'none';
  }
}

const SCORE_DEFINITIONS: Record<ScoreType, {
  name: string;
  formula: string;
  variables: { symbol: string; def: string }[];
  explanation: string;
}> = {
  '13612W': {
    name: '13612W 가중 모멘텀 스코어',
    formula: 'Score(자산) = 12 × R_1m + 4 × R_3m + 2 × R_6m + 1 × R_12m',
    variables: [
      { symbol: 'R_1m', def: '최근 1개월 수익률 = (현재가 - 1개월전 가격) / 1개월전 가격' },
      { symbol: 'R_3m', def: '최근 3개월 수익률 = (현재가 - 3개월전 가격) / 3개월전 가격' },
      { symbol: 'R_6m', def: '최근 6개월 수익률 = (현재가 - 6개월전 가격) / 6개월전 가격' },
      { symbol: 'R_12m', def: '최근 12개월 수익률 = (현재가 - 12개월전 가격) / 12개월전 가격' },
    ],
    explanation: '가중치(12, 4, 2, 1)의 의미: 최근 1개월 수익률에 12배 가중치를 부여하여 단기 추세에 더 민감하게 반응합니다. 총 가중치 합 = 19.',
  },
  '12m': {
    name: '12개월 단순 모멘텀',
    formula: 'Score(자산) = R_12m',
    variables: [
      { symbol: 'R_12m', def: '최근 12개월 수익률 = (현재가 - 12개월전 가격) / 12개월전 가격' },
    ],
    explanation: '12개월(1년) 수익률만으로 추세를 판단합니다. 양수이면 상승 추세, 음수이면 하락 추세로 간주합니다.',
  },
  'avg-multi': {
    name: '다중 기간 평균 모멘텀',
    formula: 'Score(자산) = (R_1m + R_3m + R_6m) / 3  또는  (R_1m + R_3m + R_6m + R_12m) / 4',
    variables: [
      { symbol: 'R_1m', def: '최근 1개월 수익률' },
      { symbol: 'R_3m', def: '최근 3개월 수익률' },
      { symbol: 'R_6m', def: '최근 6개월 수익률' },
      { symbol: 'R_12m', def: '최근 12개월 수익률 (CAM에서 사용)' },
    ],
    explanation: '여러 기간의 수익률을 단순 평균하여 추세를 판단합니다. 12개월 단일 기간보다 추세 전환을 더 빠르게 감지할 수 있습니다.',
  },
  'sma': {
    name: '단순 이동평균 (SMA) 필터',
    formula: '판단 = 현재가 > SMA_10m(자산)',
    variables: [
      { symbol: 'SMA_10m', def: '최근 10개월간 종가의 단순 평균 = (P_1 + P_2 + ... + P_10) / 10' },
      { symbol: '현재가', def: '가장 최근 월말 종가' },
    ],
    explanation: '현재가가 10개월 이동평균 위에 있으면 "상승 추세"로 판단하여 투자, 아래에 있으면 "하락 추세"로 판단하여 현금 보유.',
  },
  'breadth': {
    name: '브레드스 (Breadth) 모멘텀',
    formula: 'BF = N개 자산 중 양수 모멘텀(또는 SMA 위) 자산의 수\n채권비중 = (1 - BF/N) ^ 보호계수',
    variables: [
      { symbol: 'BF', def: 'Breadth Factor — 양수 모멘텀 자산의 개수 (0 ~ N)' },
      { symbol: 'N', def: '전체 위험자산 수' },
      { symbol: '보호계수', def: '민감도 조절값 (PAA 기본값 = 2). 높을수록 빠르게 방어' },
    ],
    explanation: '개별 자산의 모멘텀이 아닌, "시장 전체가 얼마나 건강한가"를 측정합니다. 양수 모멘텀 자산이 많을수록(BF↑) 채권 비중이 줄어들고, 적을수록(BF↓) 채권 비중이 늘어납니다.',
  },
  'momentum-minvar': {
    name: '모멘텀 + 최소분산 최적화',
    formula: 'Step 1: 6개월 모멘텀 상위 K개 선택\nStep 2: K개 자산의 공분산 행렬로 최소분산 비중 계산',
    variables: [
      { symbol: 'R_6m', def: '최근 6개월 수익률' },
      { symbol: '공분산', def: '자산 간 수익률이 함께 움직이는 정도. 양수=같이 이동, 음수=반대로 이동' },
      { symbol: '최소분산', def: '포트폴리오 전체 변동성을 최소화하는 비중 조합' },
    ],
    explanation: '단순히 모멘텀이 높은 자산을 고르는 것이 아니라, 선택된 자산들 간의 상관관계를 고려하여 포트폴리오 변동성을 최소화하는 비중을 계산합니다.',
  },
  'none': {
    name: '',
    formula: '',
    variables: [],
    explanation: '',
  },
};

// ── 전략별 판단 규칙 상세 ─────────────────────────────

function getDecisionRules(method: string): string[] {
  switch (method) {
    case 'dual-momentum':
      return [
        '① 상대 모멘텀: R_12m(미국주식) vs R_12m(선진국주식) 비교하여 승자 선택',
        '② 절대 모멘텀: IF R_12m(승자) > 0 → 승자에 100% 투자',
        '③ 방어 전환: IF R_12m(승자) ≤ 0 → 미국채권(AGG)에 100% 전환',
        '※ "둘 다 오르고 있지만 누가 더 강한가" + "올라가기는 하는가"를 동시에 판단',
      ];
    case 'gtaa':
      return [
        '① 각 5개 자산에 대해: 현재가 > SMA_10m 인지 확인',
        '② 조건 충족 자산만 포함, 동일비중(각 1/5=20%) 배분',
        '③ 조건 미충족 자산의 비중 → 현금(단기채)으로 보유',
        '④ 예: 3개만 충족 → 각 20%씩 60% 투자, 40% 현금',
        '※ 최악의 경우 5개 모두 미충족 → 100% 현금',
      ];
    case 'vaa':
      return [
        '① 4개 공격자산(미국주식, 선진국주식, 신흥국주식, 미국채권)의 13612W Score 계산',
        '② 전부 Score > 0: 4개 중 Score가 가장 높은 1개에 100% 투자',
        '③ 하나라도 Score ≤ 0: 3개 방어자산 중 Score 최대 1개에 100% 전환',
        '※ 공격자산 중 단 하나라도 음수면 즉시 전액 방어 → 매우 민감한 전략',
      ];
    case 'daa':
      return [
        '① 카나리아 자산 2개(신흥국주식, 미국채권)의 13612W Score 계산',
        '② 둘 다 Score > 0: 공격자산 12개 중 Score 상위 6개에 동일비중(각 16.7%)',
        '③ 하나만 Score ≤ 0: 50% 공격 Top-3(각 16.7%) + 50% 방어 Top-1',
        '④ 둘 다 Score ≤ 0: 방어자산 3개 중 Score 최대 1개에 100% 전환',
        '※ 카나리아가 "위험 신호"를 먼저 감지하여 점진적으로 방어 비중을 높이는 구조',
      ];
    case 'baa':
      return [
        '① 카나리아 자산 2개(신흥국주식, 미국채권)의 13612W Score 계산',
        '② 둘 다 Score > 0: 공격자산 중 Score 최대 1개에 100% 집중 투자',
        '③ 하나라도 Score ≤ 0: 방어자산 중 Score 최대 1개에 100% 전환',
        '※ DAA의 공격적 변형 — 분산 없이 Top-1 집중으로 수익 극대화 시도',
      ];
    case 'laa':
      return [
        '① 기본 배분: 미국주식 25%, 선진국주식 25%, 미국채권 25%, 금 25%',
        '② 방어 조건: IF 미국 실업률 > 실업률 12개월 이동평균',
        '③ 방어 전환: 미국주식 25% → 단기채(SHY) 25%로 교체',
        '④ 나머지 3개 자산(선진국, 채권, 금)은 항상 25% 유지',
        '※ 실업률이 추세적으로 상승하면 경기 침체 신호로 판단',
      ];
    case 'adm':
      return [
        '① 평균 모멘텀: Score = (R_1m + R_3m + R_6m) / 3',
        '② 상대 모멘텀: Score(미국주식) vs Score(선진국주식) 비교',
        '③ 절대 모멘텀: IF Score(승자) > 0 → 승자 100%',
        '④ 방어 전환: IF Score(승자) ≤ 0 → 미국채권(AGG) 100%',
        '※ 12개월 단일 기간 대비 추세 전환을 더 빠르게 감지',
      ];
    case 'vigilant':
      return [
        '① 확장 공격자산 6개의 13612W Score 계산',
        '② 전부 Score > 0: Score 최대 1개에 100% 투자',
        '③ 하나라도 Score ≤ 0: 방어자산 3개 중 Score 최대 1개에 100%',
        '※ VAA와 동일한 로직이지만 공격자산 풀에 리츠, 금 추가',
      ];
    case 'aaa':
      return [
        '① 8개 자산의 6개월 모멘텀(R_6m) 계산 후 상위 5개 선택',
        '② 5개 자산의 최근 6개월 일간 수익률로 공분산 행렬 구성',
        '③ 최소분산 최적화로 비중 계산 (비중 제한: 5% ~ 25%)',
        '④ 모든 자산 R_6m < 0이면 100% 단기채',
        '※ 단순 모멘텀 전략보다 변동성이 낮고 분산 효과가 큼',
      ];
    case 'papa-dm':
      return [
        '① 레그 1 (34%): 미국주식 vs 선진국주식 → R_12m 비교, 승자 선택',
        '② 레그 2 (33%): 장기채 vs 미국채권 → R_12m 비교, 승자 선택',
        '③ 레그 3 (33%): 금 vs 리츠 → R_12m 비교, 승자 선택',
        '④ 각 레그 독립 절대 모멘텀: IF R_12m(승자) ≤ 0 → 단기채로 전환',
        '※ 3개 레그가 독립 판단 → 일부만 방어 전환 가능 (전량 방어 회피)',
      ];
    case 'paa':
      return [
        '① BF = 12개 위험자산 중 SMA(현재가 > 이동평균) 위에 있는 자산 수',
        '② 채권비중 = (1 - BF/12)^2',
        '   예: BF=12(전부 양수) → 채권 0%, BF=6(절반) → 채권 25%, BF=0 → 채권 100%',
        '③ 공격비중 = 1 - 채권비중 → 양수 모멘텀 자산 Top-6에 동일비중',
        '※ 시장 건강도에 따라 채권 비중이 자동으로 조절되는 연속적 보호',
      ];
    case 'cam':
      return [
        '① 각 기간(1/3/6/12개월) 수익률 계산 후 평균: Score = (R_1m + R_3m + R_6m + R_12m) / 4',
        '② 상대 모멘텀: Score(미국주식) vs Score(선진국주식)',
        '③ 절대 모멘텀: IF Score(승자) > 0 → 승자 100%',
        '④ 방어 전환: ELSE → 미국채권(AGG) 100%',
        '※ 4개 기간 모두 확인하여 보다 안정적인 추세 판단',
      ];
    case 'edm':
      return [
        '① 레그 1 (34%): 미국주식 vs 선진국주식 → R_12m 비교 (듀얼 모멘텀)',
        '② 레그 2 (33%): 리츠 → R_12m 절대 모멘텀 단독 체크',
        '③ 레그 3 (33%): 금 → R_12m 절대 모멘텀 단독 체크',
        '④ 각 레그: IF R_12m ≤ 0 → 미국채권(AGG)으로 전환',
        '※ 듀얼모멘텀에 리츠/금 레그를 추가하여 자산군 분산',
      ];
    case 'pdm':
      return [
        '① PAA 브레드스: BF = N개 자산 중 양수 SMA 자산 수',
        '② 채권비중 = (1 - BF/N)^2',
        '③ 공격비중 = 1 - 채권비중',
        '④ 공격 자산 선택: 듀얼 모멘텀 (미국주식 vs 선진국주식, R_12m 비교)',
        '⑤ IF R_12m(승자) ≤ 0 → 방어자산으로 전환',
        '※ PAA의 점진적 보호 + 듀얼모멘텀의 종목 선택 결합',
      ];
    case 'gpm':
      return [
        '① BF = N개 자산 중 양수 모멘텀(13612W > 0) 자산 수',
        '② 보호비중 = (1 - BF/N) ^ 보호계수',
        '③ 공격비중 = 1 - 보호비중',
        '④ 공격: 양수 모멘텀 자산 중 Top-K 동일비중',
        '⑤ 방어: 방어자산 중 Score 최대 1개',
        '※ PAA/PDM 등을 일반화 — N, K, 보호계수를 자유 설정 가능',
      ];
    default:
      return [];
  }
}

// ── 자산군 → 미국 기준 티커 매핑 ───────────────────────
// 한국/퇴직연금 ETF는 동일 기초자산을 추종하므로 미국 ETF 모멘텀 데이터를 공유
export const ASSET_CLASS_TO_US_TICKER: Record<string, string> = {
  '미국주식': 'SPY',
  '선진국주식': 'EFA',
  '신흥국주식': 'EEM',
  '미국채권': 'AGG',
  '장기채': 'TLT',
  '중기채': 'IEF',
  '단기채': 'SHY',
  '금': 'GLD',
  '원자재': 'DBC',
  '리츠': 'VNQ',
  '나스닥': 'QQQ',
  '소형가치주': 'VBR',
  '현금': 'BIL',
  '미국배당': 'SCHD',
  '미국가치': 'VTV',
  '하이일드': 'HYG',
  '투자등급채': 'LQD',
};

// ── 자산 행 구조 ─────────────────────────────────────

interface AssetRow {
  assetClass: string;
  role: 'canary' | 'offensive' | 'defensive' | 'allocation';
  roleLabel: string;
  ticker: string;         // 선택된 유니버스의 실제 ETF 티커
  name: string;
  price: number;
  currency: string;
  available: boolean;
  usTicker: string;       // 모멘텀 데이터 조회용 미국 기준 티커
}

function buildAssetRows(strategy: Strategy, etfMap: ETFUniverse): AssetRow[] {
  const dc = strategy.dynamicConfig;
  if (!dc) return [];

  const rows: AssetRow[] = [];
  const seen = new Set<string>();

  function addGroup(assets: string[] | undefined, role: AssetRow['role'], roleLabel: string) {
    if (!assets) return;
    for (const ac of assets) {
      if (seen.has(ac)) continue;
      seen.add(ac);
      const etf = etfMap[ac];
      rows.push({
        assetClass: ac,
        role,
        roleLabel,
        ticker: etf?.ticker ?? '-',
        name: etf?.name ?? '매핑 없음',
        price: etf?.price ?? 0,
        currency: etf?.currency ?? 'USD',
        available: !!etf,
        usTicker: ASSET_CLASS_TO_US_TICKER[ac] ?? '-',
      });
    }
  }

  addGroup(dc.canaryAssets, 'canary', '카나리아');
  addGroup(dc.offensiveAssets, 'offensive', '공격');
  addGroup(dc.defensiveAssets, 'defensive', '방어');

  return rows;
}

// ── 스코어 값 포맷 ─────────────────────────────────────

function fmtPct(v: number | null): string {
  if (v == null) return '-';
  return `${(v * 100).toFixed(2)}%`;
}

function fmtScore(v: number | null): string {
  if (v == null) return '-';
  return v.toFixed(4);
}

function fmtPrice(price: number, currency: string): string {
  if (price === 0) return '-';
  return currency === 'KRW' ? `${price.toLocaleString()}원` : `$${price.toLocaleString()}`;
}

/** Get the primary score value based on strategy score type */
function getPrimaryScore(m: TickerMomentum, scoreType: ScoreType): number | null {
  switch (scoreType) {
    case '13612W': return m.score13612W;
    case '12m': return m.r12m;
    case 'avg-multi': return m.avgMomentum;
    case 'sma': return m.aboveSMA10m != null ? (m.aboveSMA10m ? 1 : 0) : null;
    case 'breadth': return m.aboveSMA10m != null ? (m.aboveSMA10m ? 1 : 0) : null;
    case 'momentum-minvar': return m.r6m;
    default: return null;
  }
}

// ── 메인 컴포넌트 ────────────────────────────────────

export function FormulaExplainer({ strategy, etfMap, onMomentumLoaded, onUnemploymentLoaded }: Props) {
  const { theme } = useTheme();
  const dc = strategy.dynamicConfig;
  if (!dc) return null;

  const scoreType = getScoreType(dc.method);
  const scoreDef = SCORE_DEFINITIONS[scoreType];
  const decisionRules = getDecisionRules(dc.method);
  const assetRows = buildAssetRows(strategy, etfMap);

  // Collect US reference tickers for fetching momentum data
  const usTickers = assetRows.filter((r) => r.usTicker !== '-').map((r) => r.usTicker);
  const priceData = usePriceData([...new Set(usTickers)]);

  // Notify parent when momentum data is loaded
  useEffect(() => {
    if (onMomentumLoaded && Object.keys(priceData.momentum).length > 0) {
      onMomentumLoaded(priceData.momentum);
    }
  }, [priceData.momentum, onMomentumLoaded]);

  // LAA: fetch unemployment data
  const [unemploymentInfo, setUnemploymentInfo] = useState<{
    isAbove: boolean; current: number; sma12: number;
  } | null>(null);
  const [unemploymentError, setUnemploymentError] = useState(false);
  useEffect(() => {
    if (dc.method === 'laa') {
      setUnemploymentError(false);
      fetchUnemploymentData().then((data) => {
        if (data) {
          const info = analyzeUnemployment(data);
          if (info) {
            setUnemploymentInfo(info);
            onUnemploymentLoaded?.(info);
          } else {
            setUnemploymentError(true);
          }
        } else {
          setUnemploymentError(true);
        }
      });
    }
  }, [dc.method]);

  const roleColor = (role: AssetRow['role']) => {
    switch (role) {
      case 'canary': return theme.warning;
      case 'offensive': return theme.primary;
      case 'defensive': return theme.success;
      default: return theme.textSecondary;
    }
  };

  // Breadth calculation for PAA/PDM/GPM
  const breadthInfo = (() => {
    if (scoreType !== 'breadth' && scoreType !== 'sma') return null;
    const offensiveRows = assetRows.filter((r) => r.role === 'offensive');
    const total = offensiveRows.length;
    let aboveCount = 0;
    let dataAvailable = false;
    for (const row of offensiveRows) {
      const m = priceData.momentum[row.usTicker];
      if (m?.aboveSMA10m != null) {
        dataAvailable = true;
        if (m.aboveSMA10m) aboveCount++;
      }
    }
    if (!dataAvailable) return null;
    const bf = aboveCount;
    const bondWeight = Math.pow(1 - bf / total, 2);
    const offWeight = 1 - bondWeight;
    return { total, bf, bondWeight, offWeight };
  })();

  return (
    <>
      {/* 1. 모멘텀 스코어 정의 */}
      {scoreDef.name !== '' && (
        <Card style={{ marginTop: 4 }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>
            모멘텀 스코어 정의
          </Text>

          <Text style={[typography.captionBold, { color: theme.primary, marginBottom: 4 }]}>
            {scoreDef.name}
          </Text>

          <View style={[s.codeBox, { backgroundColor: theme.surfaceVariant }]}>
            <Text style={[s.mono, { color: theme.text }]}>{scoreDef.formula}</Text>
          </View>

          <Text style={[typography.captionBold, { color: theme.text, marginTop: 12, marginBottom: 4 }]}>
            변수 설명
          </Text>
          {scoreDef.variables.map((v) => (
            <View key={v.symbol} style={s.varRow}>
              <View style={[s.varBadge, { backgroundColor: theme.surfaceVariant }]}>
                <Text style={[s.mono, { color: theme.primary, fontSize: 12 }]}>{v.symbol}</Text>
              </View>
              <Text style={[typography.small, { color: theme.textSecondary, flex: 1 }]}>{v.def}</Text>
            </View>
          ))}

          <View style={[s.noteBox, { backgroundColor: theme.surfaceVariant, marginTop: 10 }]}>
            <Text style={[typography.small, { color: theme.textSecondary, lineHeight: 18 }]}>
              {scoreDef.explanation}
            </Text>
          </View>
        </Card>
      )}

      {/* 2. 자산별 현재값 테이블 */}
      <Card style={{ marginTop: 4 }}>
        <View style={s.sectionHeader}>
          <Text style={[typography.h3, { color: theme.text }]}>
            자산별 현재값
          </Text>
          {priceData.loading && (
            <ActivityIndicator size="small" color={theme.primary} />
          )}
          {!priceData.loading && (
            <Pressable onPress={priceData.refresh} style={[s.refreshBtn, { backgroundColor: theme.surfaceVariant }]}>
              <Text style={[typography.small, { color: theme.primary }]}>새로고침</Text>
            </Pressable>
          )}
        </View>

        {/* 데이터 소스 안내 */}
        {!priceData.loading && Object.keys(priceData.momentum).length === 0 && !priceData.error && (
          <View style={[s.noteBox, { backgroundColor: theme.warningLight ?? theme.surfaceVariant, marginBottom: 10 }]}>
            <Text style={[typography.small, { color: theme.warning, fontWeight: '600' }]}>
              가격 데이터가 아직 준비되지 않았습니다
            </Text>
            <Text style={[typography.small, { color: theme.textSecondary, marginTop: 4, lineHeight: 18 }]}>
              GitHub Actions로 데이터가 업데이트되면 자동으로 표시됩니다.
            </Text>
          </View>
        )}

        {/* 에러 표시 */}
        {priceData.error && (
          <View style={[s.noteBox, { backgroundColor: theme.dangerLight ?? theme.surfaceVariant, marginBottom: 10 }]}>
            <Text style={[typography.small, { color: theme.danger }]}>
              데이터 로드 실패: {priceData.error}
            </Text>
          </View>
        )}

        {/* 마지막 업데이트 */}
        {priceData.lastFetchedAt && (
          <Text style={[typography.small, { color: theme.textTertiary, marginBottom: 8 }]}>
            데이터 기준: {new Date(priceData.lastFetchedAt).toLocaleString('ko-KR')}
          </Text>
        )}

        {/* 브레드스 요약 (PAA/PDM/GPM) */}
        {breadthInfo && (
          <View style={[s.breadthBox, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
            <Text style={[typography.captionBold, { color: theme.primary }]}>
              브레드스: BF = {breadthInfo.bf} / {breadthInfo.total}
            </Text>
            <Text style={[typography.small, { color: theme.textSecondary, marginTop: 2 }]}>
              채권비중 = (1 - {breadthInfo.bf}/{breadthInfo.total})² = {(breadthInfo.bondWeight * 100).toFixed(1)}%{' · '}
              공격비중 = {(breadthInfo.offWeight * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        {assetRows.map((row, i) => {
          const m = priceData.momentum[row.usTicker];
          const hasData = !!m;
          const primaryScore = m ? getPrimaryScore(m, scoreType) : null;
          const isPositive = primaryScore != null && primaryScore > 0;

          return (
            <View
              key={row.assetClass}
              style={[
                s.assetCard,
                {
                  backgroundColor: theme.surfaceVariant,
                  borderLeftColor: roleColor(row.role),
                },
                i > 0 && { marginTop: 6 },
              ]}
            >
              {/* 헤더: 자산군 + 역할 + 가격 */}
              <View style={s.assetHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[typography.bodyBold, { color: theme.text, fontSize: 13 }]}>
                      {row.assetClass}
                    </Text>
                    <View style={[s.roleBadge, { backgroundColor: roleColor(row.role) + '22' }]}>
                      <Text style={{ color: roleColor(row.role), fontSize: 10, fontWeight: '700' }}>
                        {row.roleLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={[typography.small, { color: theme.textSecondary, marginTop: 2 }]}>
                    {row.ticker !== '-' ? `${row.ticker} · ${row.name}` : '매핑 없음'}
                    {row.usTicker !== '-' && row.usTicker !== row.ticker ? ` (모멘텀: ${row.usTicker})` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.bodyBold, { color: theme.text, fontSize: 14 }]}>
                    {fmtPrice(row.price, row.currency)}
                  </Text>
                  {hasData && m?.currentPrice != null && row.usTicker !== row.ticker && (
                    <Text style={[typography.small, { color: theme.textTertiary }]}>
                      {row.usTicker}: ${m.currentPrice.toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>

              {/* 모멘텀 데이터 — 실제 값 표시 */}
              {hasData && (
                <View style={[s.momentumSection, { borderTopColor: theme.border }]}>
                  {/* 개별 수익률 */}
                  <View style={s.returnGrid}>
                    <View style={s.returnCell}>
                      <Text style={[s.returnLabel, { color: theme.textTertiary }]}>R_1m</Text>
                      <Text style={[s.returnValue, { color: m.r1m != null && m.r1m >= 0 ? theme.success : theme.danger }]}>
                        {fmtPct(m.r1m)}
                      </Text>
                    </View>
                    <View style={s.returnCell}>
                      <Text style={[s.returnLabel, { color: theme.textTertiary }]}>R_3m</Text>
                      <Text style={[s.returnValue, { color: m.r3m != null && m.r3m >= 0 ? theme.success : theme.danger }]}>
                        {fmtPct(m.r3m)}
                      </Text>
                    </View>
                    <View style={s.returnCell}>
                      <Text style={[s.returnLabel, { color: theme.textTertiary }]}>R_6m</Text>
                      <Text style={[s.returnValue, { color: m.r6m != null && m.r6m >= 0 ? theme.success : theme.danger }]}>
                        {fmtPct(m.r6m)}
                      </Text>
                    </View>
                    <View style={s.returnCell}>
                      <Text style={[s.returnLabel, { color: theme.textTertiary }]}>R_12m</Text>
                      <Text style={[s.returnValue, { color: m.r12m != null && m.r12m >= 0 ? theme.success : theme.danger }]}>
                        {fmtPct(m.r12m)}
                      </Text>
                    </View>
                  </View>

                  {/* 주요 스코어 */}
                  <View style={[s.scoreBox, { backgroundColor: isPositive ? (theme.successLight ?? '#E8F5E9') : (theme.dangerLight ?? '#FFEBEE') }]}>
                    <Text style={[typography.small, { color: theme.textSecondary }]}>
                      {scoreType === '13612W' && 'Score (13612W)'}
                      {scoreType === '12m' && 'Score (12m 수익률)'}
                      {scoreType === 'avg-multi' && 'Score (평균 모멘텀)'}
                      {scoreType === 'sma' && 'SMA_10m 판단'}
                      {scoreType === 'breadth' && 'SMA 위 여부'}
                      {scoreType === 'momentum-minvar' && 'R_6m 모멘텀'}
                    </Text>
                    <Text style={[
                      typography.bodyBold,
                      { color: isPositive ? theme.success : theme.danger, fontSize: 16 },
                    ]}>
                      {scoreType === 'sma' || scoreType === 'breadth'
                        ? (m.aboveSMA10m != null
                          ? (m.aboveSMA10m ? '상승 추세 (SMA 위)' : '하락 추세 (SMA 아래)')
                          : '-')
                        : fmtScore(primaryScore)}
                      {scoreType !== 'sma' && scoreType !== 'breadth' && primaryScore != null && (
                        <Text style={{ fontSize: 12 }}>
                          {' '}({isPositive ? '양수' : '음수'})
                        </Text>
                      )}
                    </Text>

                    {/* 13612W 계산 과정 */}
                    {scoreType === '13612W' && m.r1m != null && m.r3m != null && m.r6m != null && m.r12m != null && (
                      <Text style={[s.mono, { color: theme.textSecondary, fontSize: 10, marginTop: 4 }]}>
                        = 12×{(m.r1m * 100).toFixed(1)}% + 4×{(m.r3m * 100).toFixed(1)}% + 2×{(m.r6m * 100).toFixed(1)}% + 1×{(m.r12m * 100).toFixed(1)}%
                      </Text>
                    )}

                    {/* SMA 값 표시 */}
                    {(scoreType === 'sma' || scoreType === 'breadth') && m.sma10m != null && m.currentPrice != null && (
                      <Text style={[s.mono, { color: theme.textSecondary, fontSize: 10, marginTop: 4 }]}>
                        현재가 {fmtPrice(m.currentPrice, row.currency)} vs SMA {fmtPrice(m.sma10m, row.currency)}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* 데이터 없음 */}
              {!hasData && row.usTicker !== '-' && !priceData.loading && (
                <View style={[s.momentumSection, { borderTopColor: theme.border }]}>
                  <Text style={[typography.small, { color: theme.textTertiary, fontStyle: 'italic' }]}>
                    가격 데이터 대기 중
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </Card>

      {/* LAA: 실업률 현재값 */}
      {dc.method === 'laa' && (
        <Card style={{ marginTop: 4 }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>
            미국 실업률 현재값
          </Text>
          {unemploymentInfo ? (
            <View style={[s.scoreBox, {
              backgroundColor: unemploymentInfo.isAbove
                ? (theme.dangerLight ?? '#FFEBEE')
                : (theme.successLight ?? '#E8F5E9'),
            }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[typography.small, { color: theme.textSecondary }]}>현재 실업률</Text>
                <Text style={[typography.bodyBold, { color: theme.text, fontSize: 18 }]}>
                  {unemploymentInfo.current.toFixed(1)}%
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={[typography.small, { color: theme.textSecondary }]}>12개월 이동평균</Text>
                <Text style={[typography.bodyBold, { color: theme.textSecondary }]}>
                  {unemploymentInfo.sma12.toFixed(2)}%
                </Text>
              </View>
              <View style={{ marginTop: 8, padding: 8, borderRadius: 6, backgroundColor: unemploymentInfo.isAbove ? (theme.danger + '15') : (theme.success + '15') }}>
                <Text style={[typography.bodyBold, {
                  color: unemploymentInfo.isAbove ? theme.danger : theme.success,
                  textAlign: 'center',
                }]}>
                  {unemploymentInfo.isAbove
                    ? '실업률 상승 추세 → 미국주식 → 단기채 전환'
                    : '실업률 안정 → 미국주식 유지'}
                </Text>
              </View>
            </View>
          ) : unemploymentError ? (
            <Text style={[typography.small, { color: theme.danger ?? '#EF4444', fontStyle: 'italic' }]}>
              실업률 데이터를 불러올 수 없습니다. 기본 배분(미국주식 25%)을 적용합니다.
            </Text>
          ) : (
            <Text style={[typography.small, { color: theme.textTertiary, fontStyle: 'italic' }]}>
              실업률 데이터 로딩 중...
            </Text>
          )}
        </Card>
      )}

      {/* 3. 판단 규칙 상세 */}
      {decisionRules.length > 0 && (
        <Card style={{ marginTop: 4 }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 10 }]}>
            판단 규칙 상세
          </Text>
          {decisionRules.map((rule, i) => {
            const isNote = rule.startsWith('※');
            return (
              <View
                key={i}
                style={[
                  s.ruleRow,
                  isNote && [s.noteBox, { backgroundColor: theme.surfaceVariant }],
                ]}
              >
                <Text
                  style={[
                    typography.small,
                    {
                      color: isNote ? theme.textSecondary : theme.text,
                      lineHeight: 20,
                      fontStyle: isNote ? 'italic' : 'normal',
                    },
                  ]}
                >
                  {rule}
                </Text>
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

const s = StyleSheet.create({
  codeBox: {
    padding: 10,
    borderRadius: 8,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  varRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  varBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  noteBox: {
    padding: 10,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  breadthBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  assetCard: {
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: 10,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  momentumSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  returnGrid: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  returnCell: {
    flex: 1,
    alignItems: 'center',
  },
  returnLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  returnValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  scoreBox: {
    padding: 8,
    borderRadius: 6,
  },
  ruleRow: {
    marginBottom: 8,
  },
});
