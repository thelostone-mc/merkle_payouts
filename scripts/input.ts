import { PayoutConfig, PayoutDistribution } from "../types";

// TODO: UPDATE
export const config: PayoutConfig = {
  network: "rinkeby",
  tokenAddress: "0xC48ea75748bE6335476C6EdF6DDc7782F2ddaAE8",
  tokenDecimal: 18,
  funderAddress: "0x5cdb35fADB8262A3f88863254c870c2e6A848CcA",
};

// TODO : UPDATE
export const distributions: PayoutDistribution[] = [
  { address: "0x76577d204A5bd63b6D006222429c4D5124f4619c", amount: 1 },
  { address: "0x5cdb35fADB8262A3f88863254c870c2e6A848CcA", amount: 5 },
  { address: "0x997D35b300bA1775fdB175dF045252e57D6EA5B0", amount: 10 },
  { address: "0x2A5B1B6188669da07947403Da21F1CAB501374e6", amount: 5 },
  { address: "0x6B5918D8EF9094679F4b4e1Bf397a66eA411B118", amount: 5 },
  { address: "0xb010ca9Be09C382A9f31b79493bb232bCC319f01", amount: 5 },
  { address: "0xBADCdDEA250f1e317Ba59999232464933C4E8D90", amount: 5 },
  { address: "0xD7db3B3300E9d15E680807381d8B21E2B0773402", amount: 5 },
  { address: "0xb9376ae861cB2D5D217F8670ec99B22d3794a333", amount: 5 },
  { address: "0x0aE16533212C0983e336f51688440492980d6C62", amount: 5 },
  { address: "0xC9a238405ef9D753D55EC1EB8F7A7b17B8d83E63", amount: 5 },
];
