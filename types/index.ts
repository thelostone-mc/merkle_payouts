export type PayoutDistribution = {
  address: string;
  amount: number;
};

export type PayoutConfig = {
  network: string;
  tokenAddress: string;
  tokenDecimal: number;
  funderAddress: string;
};
