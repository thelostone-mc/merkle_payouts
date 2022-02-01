export type PayoutDistribution = {
  address: string;
  match: number;
};

export type PayoutConfig = {
  network: string;
  tokenAddress: string;
  tokenDecimal: number;
  funderAddress: string;
}