export type StrategyStackParamList = {
  StrategyList: undefined;
  StrategyDetail: { strategyId: string };
};

export type CalculatorStackParamList = {
  Calculator: { strategyId?: string } | undefined;
};

export type PortfolioStackParamList = {
  PortfolioList: undefined;
  PortfolioDetail: { portfolioId: string };
  CustomStrategy: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type RootTabParamList = {
  StrategyTab: undefined;
  CalculatorTab: { screen?: string; params?: any };
  PortfolioTab: undefined;
  SettingsTab: undefined;
};
