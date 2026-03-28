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
