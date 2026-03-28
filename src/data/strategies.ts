export interface StrategyAllocation {
  assetClass: string;
  weight: number; // percentage, e.g. 30 = 30%
}

export interface Strategy {
  id: string;
  name: string;
  type: 'static' | 'dynamic';
  description: string;
  defaultAllocations: StrategyAllocation[];
  rebalanceRule?: string;
  riskLevel?: '낮음' | '중간' | '높음';
  // Dynamic strategy specifics
  dynamicConfig?: {
    method: string;
    offensiveAssets?: string[];
    defensiveAssets?: string[];
    lookbackMonths?: number[];
    canaryAssets?: string[];
    topN?: number;
  };
  // 동적 전략 공식 및 간단 설명
  formula?: string;
  shortDescription?: string;
}

export const strategies: Strategy[] = [
  // ===== 정적 전략 (Static) =====
  {
    id: 'all-weather',
    name: 'All Weather (올웨더)',
    type: 'static',
    description: '레이 달리오의 올웨더 전략. 경제의 4가지 시즌(성장/하락 × 인플레/디플레)에 균형있게 대응합니다.',
    riskLevel: '낮음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 30 },
      { assetClass: '장기채', weight: 40 },
      { assetClass: '중기채', weight: 15 },
      { assetClass: '금', weight: 7.5 },
      { assetClass: '원자재', weight: 7.5 },
    ],
    rebalanceRule: '연 1회 또는 비중 이탈 5%p 초과 시 리밸런싱',
  },
  {
    id: 'sixty-forty',
    name: '60/40 포트폴리오',
    type: 'static',
    description: '전통적인 주식 60%, 채권 40% 배분. 단순하지만 장기적으로 검증된 전략입니다.',
    riskLevel: '중간',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 60 },
      { assetClass: '미국채권', weight: 40 },
    ],
    rebalanceRule: '연 1회 리밸런싱',
  },
  {
    id: 'golden-butterfly',
    name: 'Golden Butterfly',
    type: 'static',
    description: '영구 포트폴리오에 소형 가치주를 추가한 변형. 5개 자산군에 균등 배분합니다.',
    riskLevel: '낮음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 20 },
      { assetClass: '소형가치주', weight: 20 },
      { assetClass: '장기채', weight: 20 },
      { assetClass: '단기채', weight: 20 },
      { assetClass: '금', weight: 20 },
    ],
    rebalanceRule: '연 1회 리밸런싱',
  },
  {
    id: 'permanent',
    name: 'Permanent Portfolio',
    type: 'static',
    description: '해리 브라운의 영구 포트폴리오. 4가지 자산에 균등 배분하여 모든 경제 환경에 대비합니다.',
    riskLevel: '낮음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 25 },
      { assetClass: '장기채', weight: 25 },
      { assetClass: '금', weight: 25 },
      { assetClass: '단기채', weight: 25 },
    ],
    rebalanceRule: '연 1회 또는 비중 이탈 10%p 초과 시 리밸런싱',
  },

  // ===== 동적 전략 (Dynamic) =====
  {
    id: 'dual-momentum',
    name: 'Dual Momentum',
    type: 'dynamic',
    description: '게리 안토나치의 듀얼 모멘텀. SPY vs EFA 상대 모멘텀 비교 후, 절대 모멘텀 필터로 안전자산 전환.',
    shortDescription: '상대 모멘텀으로 미국/선진국 중 강한 쪽을 선택하고, 둘 다 약하면 채권으로 대피하는 전략입니다. 단순하지만 강력한 추세추종 전략의 대표격.',
    formula: '1. 상대 모멘텀: R_12m(SPY) vs R_12m(EFA)\n2. 승자 선택 후 절대 모멘텀 필터:\n   IF R_12m(승자) > 0 → 승자 100%\n   ELSE → AGG(채권) 100%',
    riskLevel: '높음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 100 },
    ],
    rebalanceRule: '월 1회, 12개월 모멘텀 기준',
    dynamicConfig: {
      method: 'dual-momentum',
      offensiveAssets: ['미국주식', '선진국주식'],
      defensiveAssets: ['미국채권'],
      lookbackMonths: [12],
      topN: 1,
    },
  },
  {
    id: 'gtaa',
    name: 'GTAA (Global Tactical)',
    type: 'dynamic',
    description: '멥 파버의 글로벌 전술적 자산배분. 5개 자산의 10개월 이동평균 위/아래로 투자 결정.',
    shortDescription: '각 자산이 10개월 이동평균 위에 있으면 투자, 아래면 현금 보유. 추세를 따라가면서도 하락장에서 자동으로 현금 비중을 높이는 전략.',
    formula: '각 자산 i에 대해:\n  IF Price(i) > SMA_10m(i) → 자산 i 동일비중 배분\n  ELSE → 현금\n\n배분 = 조건 충족 자산에 1/5씩 동일비중',
    riskLevel: '중간',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 20 },
      { assetClass: '선진국주식', weight: 20 },
      { assetClass: '미국채권', weight: 20 },
      { assetClass: '리츠', weight: 20 },
      { assetClass: '원자재', weight: 20 },
    ],
    rebalanceRule: '월 1회, 10개월 SMA 기준 필터링',
    dynamicConfig: {
      method: 'gtaa',
      offensiveAssets: ['미국주식', '선진국주식', '미국채권', '리츠', '원자재'],
      defensiveAssets: ['단기채'],
      lookbackMonths: [10],
    },
  },
  {
    id: 'vaa',
    name: 'VAA (Vigilant)',
    type: 'dynamic',
    description: 'Wouter Keller의 VAA. 4개 공격자산의 13612W 모멘텀이 모두 양수면 top-1 공격, 아니면 방어자산.',
    shortDescription: '4개 공격자산 모두 양수 모멘텀이어야 공격 투자. 하나라도 음수면 즉시 방어자산으로 전환하는 매우 민감한 경계 전략.',
    formula: '13612W 모멘텀 스코어:\n  Score = 12×R_1m + 4×R_3m + 2×R_6m + 1×R_12m\n\nIF 공격자산 4개 모두 Score > 0:\n  → 공격 Top-1 (Score 최대) 100%\nELSE:\n  → 방어 Top-1 100%',
    riskLevel: '높음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 100 },
    ],
    rebalanceRule: '월 1회, 13612W 모멘텀 스코어 기준',
    dynamicConfig: {
      method: 'vaa',
      offensiveAssets: ['미국주식', '선진국주식', '신흥국주식', '미국채권'],
      defensiveAssets: ['중기채', '단기채', '장기채'],
      lookbackMonths: [1, 3, 6, 12],
      topN: 1,
    },
  },
  {
    id: 'daa',
    name: 'DAA (Defensive)',
    type: 'dynamic',
    description: 'Keller의 DAA. 카나리아 자산(EEM, AGG)으로 위험 감지 후, 12개 공격자산 또는 3개 방어자산에 배분.',
    shortDescription: '카나리아(EEM, AGG)가 위험을 미리 감지하는 역할. 카나리아 상태에 따라 공격 비중을 0%, 50%, 100%로 단계적 조절.',
    formula: '카나리아 모멘텀: Score(EEM), Score(AGG)\n\nIF 둘 다 > 0:\n  → 공격 Top-6 동일비중 (각 16.7%)\nIF 하나만 < 0:\n  → 50% 공격 Top-3 + 50% 방어 Top-1\nIF 둘 다 < 0:\n  → 방어 Top-1 100%',
    riskLevel: '중간',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 100 },
    ],
    rebalanceRule: '월 1회, 카나리아 모멘텀 기반 전환',
    dynamicConfig: {
      method: 'daa',
      canaryAssets: ['신흥국주식', '미국채권'],
      offensiveAssets: ['미국주식', '선진국주식', '신흥국주식', '미국채권', '장기채', '중기채', '리츠', '금', '원자재', '나스닥', '미국배당', '소형가치주'],
      defensiveAssets: ['단기채', '중기채', '미국채권'],
      lookbackMonths: [1, 3, 6, 12],
      topN: 6,
    },
  },
  {
    id: 'laa',
    name: 'LAA (Lethargic)',
    type: 'dynamic',
    description: 'Keller의 LAA. 25% 고정배분(미국주식/선진국/채권/금) + 실업률 기반 방어 전환.',
    shortDescription: '기본적으로 4자산 균등 배분하되, 미국 실업률이 12개월 이동평균 위로 올라가면 주식을 단기채로 전환하는 느긋한 전략.',
    formula: 'IF 미국 실업률 > 실업률 12m 이동평균:\n  SPY 25% → SHY 25% (방어 전환)\nELSE:\n  SPY 25%, GLD 25%, IWD 25%, IEF 25%',
    riskLevel: '중간',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 25 },
      { assetClass: '선진국주식', weight: 25 },
      { assetClass: '미국채권', weight: 25 },
      { assetClass: '금', weight: 25 },
    ],
    rebalanceRule: '월 1회, 미국 실업률 12개월 이동평균 기반',
    dynamicConfig: {
      method: 'laa',
      offensiveAssets: ['미국주식', '선진국주식', '미국채권', '금'],
      defensiveAssets: ['단기채'],
      lookbackMonths: [12],
    },
  },
  {
    id: 'baa',
    name: 'BAA (Bold)',
    type: 'dynamic',
    description: 'DAA의 공격적 변형. 카나리아 기반 감지 후 Top-1 집중 투자.',
    shortDescription: 'DAA와 같은 카나리아 감지를 사용하지만 공격 시 Top-1 집중 투자. 높은 수익 잠재력과 함께 높은 변동성.',
    formula: 'IF 카나리아(EEM, AGG) 둘 다 Score > 0:\n  → 공격 Top-1 100% 집중\nELSE:\n  → 방어 Top-1 100%',
    riskLevel: '높음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 100 },
    ],
    rebalanceRule: '월 1회, 카나리아 + 13612W 모멘텀',
    dynamicConfig: {
      method: 'baa',
      canaryAssets: ['신흥국주식', '미국채권'],
      offensiveAssets: ['미국주식', '선진국주식', '신흥국주식', '미국채권', '장기채', '리츠', '금', '원자재', '나스닥'],
      defensiveAssets: ['단기채', '중기채', '미국채권'],
      lookbackMonths: [1, 3, 6, 12],
      topN: 1,
    },
  },
  {
    id: 'adm',
    name: 'Accelerating Dual Momentum',
    type: 'dynamic',
    description: '듀얼 모멘텀의 확장. 다중 룩백(1/3/6개월) 평균 모멘텀으로 더 빠른 추세 전환 감지.',
    shortDescription: '기존 듀얼모멘텀이 12개월만 보는 것과 달리, 1/3/6개월의 평균 모멘텀으로 추세 전환을 더 빠르게 감지합니다.',
    formula: '평균 모멘텀:\n  Score = (R_1m + R_3m + R_6m) / 3\n\n1. SPY vs EFA: Score 비교 → 승자 선택\n2. IF Score(승자) > 0 → 승자 100%\n   ELSE → AGG 100%',
    riskLevel: '높음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 100 },
    ],
    rebalanceRule: '월 1회, 다중 룩백 평균 모멘텀',
    dynamicConfig: {
      method: 'adm',
      offensiveAssets: ['미국주식', '선진국주식'],
      defensiveAssets: ['미국채권'],
      lookbackMonths: [1, 3, 6],
      topN: 1,
    },
  },
  {
    id: 'vigilant',
    name: 'Vigilant Asset Allocation',
    type: 'dynamic',
    description: 'VAA의 확장 버전. 더 넓은 자산 풀에서 13612W 모멘텀 기반 배분.',
    shortDescription: 'VAA와 동일한 13612W 모멘텀을 사용하되 더 많은 자산군(리츠, 금 포함)으로 확장. 분산 효과가 더 큼.',
    formula: '13612W Score = 12×R_1m + 4×R_3m + 2×R_6m + 1×R_12m\n\nIF 공격자산 전부 Score > 0:\n  → 공격 Top-1 100%\nELSE:\n  → 방어 Top-1 100%\n\n* VAA 대비 공격자산 풀 확대',
    riskLevel: '높음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 100 },
    ],
    rebalanceRule: '월 1회, 확장 13612W 모멘텀',
    dynamicConfig: {
      method: 'vigilant',
      offensiveAssets: ['미국주식', '선진국주식', '신흥국주식', '미국채권', '리츠', '금'],
      defensiveAssets: ['중기채', '단기채', '장기채'],
      lookbackMonths: [1, 3, 6, 12],
      topN: 1,
    },
  },
  {
    id: 'aaa',
    name: 'Adaptive Asset Allocation',
    type: 'dynamic',
    description: '모멘텀 + 최소분산 최적화. 상위 모멘텀 자산 중 최소 변동성 조합을 찾습니다.',
    shortDescription: '단순히 모멘텀이 높은 자산을 고르는 것이 아니라, 상위 자산들 간의 상관관계를 고려해 최소 변동성 포트폴리오를 구성합니다.',
    formula: 'Step 1: 6개월 모멘텀 상위 5개 자산 선택\nStep 2: 상위 5개의 공분산 행렬 계산\nStep 3: 최소분산 최적화로 비중 결정\nStep 4: 비중 제한 (최소 5%, 최대 25%)',
    riskLevel: '중간',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 20 },
      { assetClass: '선진국주식', weight: 20 },
      { assetClass: '미국채권', weight: 20 },
      { assetClass: '금', weight: 20 },
      { assetClass: '리츠', weight: 20 },
    ],
    rebalanceRule: '월 1회, 모멘텀 상위 + 최소분산',
    dynamicConfig: {
      method: 'aaa',
      offensiveAssets: ['미국주식', '선진국주식', '신흥국주식', '미국채권', '장기채', '금', '리츠', '원자재'],
      defensiveAssets: ['단기채'],
      lookbackMonths: [1, 3, 6],
      topN: 5,
    },
  },
  {
    id: 'papa-dm',
    name: 'Papa Dual Momentum',
    type: 'dynamic',
    description: '다중 레그 듀얼 모멘텀. 주식/채권/대안 각각에 듀얼모멘텀 적용.',
    shortDescription: '포트폴리오를 주식/채권/금 3개 레그로 나누고 각각 독립적으로 듀얼모멘텀을 적용. 한 레그가 방어로 전환되어도 나머지는 유지.',
    formula: '레그 1 (주식 34%): SPY vs EFA → R_12m 비교\n레그 2 (채권 33%): TLT vs AGG → R_12m 비교\n레그 3 (대안 33%): GLD vs VNQ → R_12m 비교\n\n각 레그 독립적으로:\n  IF R_12m(승자) > 0 → 승자\n  ELSE → SHY(단기채)',
    riskLevel: '높음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 34 },
      { assetClass: '장기채', weight: 33 },
      { assetClass: '금', weight: 33 },
    ],
    rebalanceRule: '월 1회, 각 레그별 12개월 모멘텀',
    dynamicConfig: {
      method: 'papa-dm',
      offensiveAssets: ['미국주식', '선진국주식', '장기채', '미국채권', '금', '리츠'],
      defensiveAssets: ['단기채'],
      lookbackMonths: [12],
      topN: 1,
    },
  },
  {
    id: 'paa',
    name: 'Protective Asset Allocation (PAA)',
    type: 'dynamic',
    description: '브레드스(breadth) 모멘텀. 양수 모멘텀 자산 수로 보호 수준을 결정합니다.',
    shortDescription: '12개 위험자산 중 몇 개가 양수 모멘텀인지(브레드스)를 세어 전체 포트폴리오의 채권 비중을 결정합니다. 시장 전반의 건강상태를 측정.',
    formula: 'BF(브레드스) = 12개 자산 중 SMA 위에 있는 자산 수\n\n채권 비중 = (1 - BF/12)^2\n공격 비중 = 1 - 채권 비중\n\n공격 비중은 양수 모멘텀 자산 Top-6에 동일비중',
    riskLevel: '중간',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 50 },
      { assetClass: '단기채', weight: 50 },
    ],
    rebalanceRule: '월 1회, 브레드스 기반 보호 비중 결정',
    dynamicConfig: {
      method: 'paa',
      offensiveAssets: ['미국주식', '선진국주식', '신흥국주식', '미국채권', '장기채', '금', '리츠', '원자재', '나스닥', '미국배당', '소형가치주', '중기채'],
      defensiveAssets: ['단기채'],
      lookbackMonths: [1, 3, 6, 12],
      topN: 6,
    },
  },
  {
    id: 'cam',
    name: 'Composite Absolute Momentum',
    type: 'dynamic',
    description: '다중 룩백 기간(1/3/6/12개월)의 절대모멘텀을 복합하여 투자 결정.',
    shortDescription: '하나의 기간이 아닌 4개 기간(1/3/6/12개월) 모두에서 양수 수익률인지 확인. 보다 안정적인 추세 확인이 가능.',
    formula: '각 기간 k ∈ {1, 3, 6, 12}개월에 대해:\n  M_k = R_km (k개월 수익률)\n\nScore = (M_1 + M_3 + M_6 + M_12) / 4\n\nIF Score(SPY) > Score(EFA) AND Score(승자) > 0:\n  → 승자 100%\nELSE:\n  → AGG 100%',
    riskLevel: '중간',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 100 },
    ],
    rebalanceRule: '월 1회, 복합 절대모멘텀',
    dynamicConfig: {
      method: 'cam',
      offensiveAssets: ['미국주식', '선진국주식'],
      defensiveAssets: ['미국채권'],
      lookbackMonths: [1, 3, 6, 12],
      topN: 1,
    },
  },
  {
    id: 'edm',
    name: 'Extended Dual Momentum',
    type: 'dynamic',
    description: '듀얼모멘텀에 리츠/금 레그를 추가한 확장판. 3개 자산군에 각각 모멘텀 적용.',
    shortDescription: '듀얼모멘텀의 주식 레그에 리츠, 금 레그를 추가하여 자산군 분산. 각 레그가 독립적으로 risk-on/off 판단.',
    formula: '레그 1 (34%): SPY vs EFA → 12m 모멘텀\n레그 2 (33%): VNQ(리츠) → 12m 절대 모멘텀\n레그 3 (33%): GLD(금) → 12m 절대 모멘텀\n\n각 레그: IF R_12m > 0 → 해당 자산\n         ELSE → AGG(채권)',
    riskLevel: '높음',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 34 },
      { assetClass: '리츠', weight: 33 },
      { assetClass: '금', weight: 33 },
    ],
    rebalanceRule: '월 1회, 3-레그 듀얼모멘텀',
    dynamicConfig: {
      method: 'edm',
      offensiveAssets: ['미국주식', '선진국주식', '리츠', '금'],
      defensiveAssets: ['미국채권'],
      lookbackMonths: [12],
      topN: 1,
    },
  },
  {
    id: 'pdm',
    name: 'Protective Dual Momentum',
    type: 'dynamic',
    description: 'PAA의 보호 메커니즘 + 듀얼모멘텀 결합. 브레드스 기반 보호 + 상대/절대 모멘텀.',
    shortDescription: 'PAA의 브레드스 신호로 시장 위험도를 측정하고, 듀얼모멘텀으로 종목을 선택. 두 가지 보호 장치의 결합.',
    formula: 'Step 1: BF = N자산 중 양수 SMA 자산 수\nStep 2: 채권비중 = (1 - BF/N)^2\nStep 3: 공격비중 = 1 - 채권비중\nStep 4: 공격 → 듀얼모멘텀으로 종목 선택\n  SPY vs EFA → R_12m 비교 → 절대 필터',
    riskLevel: '중간',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 100 },
    ],
    rebalanceRule: '월 1회, PAA 보호 + 듀얼모멘텀',
    dynamicConfig: {
      method: 'pdm',
      offensiveAssets: ['미국주식', '선진국주식', '신흥국주식', '미국채권', '장기채', '금', '리츠'],
      defensiveAssets: ['단기채', '중기채'],
      lookbackMonths: [1, 3, 6, 12],
      topN: 1,
    },
  },
  {
    id: 'gpm',
    name: 'Generalized Protective Momentum',
    type: 'dynamic',
    description: 'Keller의 일반화 보호 모멘텀 프레임워크. 모든 보호+모멘텀 전략의 상위 프레임워크.',
    shortDescription: 'PAA, PDM 등 보호 모멘텀 전략을 일반화한 프레임워크. N자산, Top-K 선택, 보호계수를 자유롭게 설정 가능.',
    formula: 'Step 1: BF = N자산 중 양수 모멘텀 자산 수\nStep 2: 보호비중 = (1 - BF/N)^보호계수\nStep 3: 공격비중 = 1 - 보호비중\nStep 4: 공격 → 양수 모멘텀 Top-K 동일비중\nStep 5: 방어 → Top-1 방어자산',
    riskLevel: '중간',
    defaultAllocations: [
      { assetClass: '미국주식', weight: 100 },
    ],
    rebalanceRule: '월 1회, 일반화 보호 모멘텀',
    dynamicConfig: {
      method: 'gpm',
      offensiveAssets: ['미국주식', '선진국주식', '신흥국주식', '미국채권', '장기채', '금', '리츠', '원자재'],
      defensiveAssets: ['단기채', '중기채', '미국채권'],
      lookbackMonths: [1, 3, 6, 12],
      topN: 1,
    },
  },
];
