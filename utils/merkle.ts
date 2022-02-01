import { parseUnits } from "ethers/lib/utils";
import { PayoutDistribution } from "../types";

import {
  MerkleDistributorInfo,
  NewFormat,
  parseBalanceMap,
} from './parse-balance-map';

/**
 * Generates hash of the GrantsDistribution distribution
 * @param distribution - PayoutDistribution[]
 * @param payoutTokenDecimal - The number of decimals used by the payout token
 * @returns {MerkleDistributorInfo} - merkle tree of the distribution
 * https://github.com/Uniswap/merkle-distributor
 */
export const generateMerkle = (distributions: PayoutDistribution[], payoutTokenDecimal: number) => {
  // initialize
  const merkleInput: NewFormat[] = [];

  // foreach payout parse the earnings
  distributions.forEach((distribution: PayoutDistribution) => {
    merkleInput.push({
      address: distribution.address,
      earnings: parseUnits(distribution.amount.toString(), payoutTokenDecimal).toHexString(),
      reasons: '',
    });
  });

   // parse and return the tree
   return parseBalanceMap(merkleInput) as MerkleDistributorInfo;
}


/**
 * Generates hash of the GrantsDistribution distribution
 * @param distribution - PayoutDistribution[]
 * @param payoutTokenDecimal - The number of decimals used by the payout token
 * @returns {string} - merkle root hash of the distribution
 * https://github.com/Uniswap/merkle-distributor
 */
 export const generateMerkleRoot = (distributions: PayoutDistribution[], payoutTokenDecimal: number): string => {
  // get the merkleTree
  const merkleDistributorInfo: MerkleDistributorInfo = generateMerkle(distributions, payoutTokenDecimal);

  // return merkleRoot
  return merkleDistributorInfo.merkleRoot;
};



/**
 * Generates merkle and outputs the proof of the GrantsDistribution distribution
 * @param address - address to find in the distribution
 * @param distributions - PayoutDistribution[]
 * @param matchingTokenDecimals - The number of decimals used by the payout token
 * @returns {string[]} - merkle proof for the provided address
 * https://github.com/Uniswap/merkle-distributor
 */
 export const generateMerkleProof = (
  address: string,
  distributions: PayoutDistribution[],
  matchingTokenDecimals: number
): string[] => {
  // get the merkleTree
  const merkleDistributorInfo: MerkleDistributorInfo = generateMerkle(distributions, matchingTokenDecimals);

  // return proof for address
  return merkleDistributorInfo.claims[address].proof;
};


/**
 * Gets a proof from the provided merkle tree
 * @param merkleDistributorInfo - MerkleDistributorInfo
 * @returns {string} - merkle root hash of the distribution
 * https://github.com/Uniswap/merkle-distributor
 */
 export const getMerkleRoot = (merkleDistributorInfo: MerkleDistributorInfo | undefined): string => {
  // when merkleDistributorInfo is provided
  if (merkleDistributorInfo) {
    // return root of the merkle
    return merkleDistributorInfo.merkleRoot;
  } else {
    return '';
  }
};


/**
 * Gets a proof from the provided merkle tree
 * @param address - address to find in the claims
 * @param merkleDistributorInfo - MerkleDistributorInfo
 * @returns {string[]} - merkle proof for the provided address
 * https://github.com/Uniswap/merkle-distributor
 */
 export const getMerkleProof = (address: string, merkleDistributorInfo: MerkleDistributorInfo | undefined): string[] => {
  // when merkleDistributorInfo is provided
  if (merkleDistributorInfo) {
    // return proof for address
    return merkleDistributorInfo.claims[address].proof;
  } else {
    return [];
  }
};