// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { isHexString } from "ethereumjs-util";
import { ethers } from "hardhat";
import readline from 'readline';

// TODO: update config.data before deploy
import { config, distributions } from "./input";

import { MerkleDistributorInfo } from '../utils/parse-balance-map';
import { generateMerkle } from '../utils/merkle';

function getClaimsInfo(_claims: any) {
  const claims = Object.keys(_claims).map((key) => {
    return {
      index: _claims[key].index,
      claimee: key,
      amount: _claims[key].amount,
      merkleProof: _claims[key].proof,
    };
  });
  const claimsAmount = claims.reduce((acc, claim) => acc.add(claim.amount), ethers.BigNumber.from(0));

  return { 'claims': claims ,'amount': claimsAmount };
}

async function main() {

  // Wait 10 blocks for re-org protection
  const blocksToWait = 10;

  if (!config.tokenAddress) {
    throw new Error('tokenAddress is not set in env!');
  } else if (!config.funderAddress) {
    throw new Error('funderAddress is not set in env!');
  }

  // Verify we have a valid merkle root
  const merkle: MerkleDistributorInfo = generateMerkle(distributions, config.tokenDecimal);
  const merkleRoot = merkle.merkleRoot;
  if (!merkleRoot || merkleRoot.length !== 66 || !isHexString(merkleRoot)) {
    throw new Error('Merkle root could not be found');
  }

  // --- Prompt user to verify data before continuing ---
  const claimsInfo = await getClaimsInfo(merkle.claims);
  await confirmContinue({
    'network              ': config.network,
    'tokenAddress         ': config.tokenAddress,
    'tokenDecimal         ': config.tokenDecimal,
    'funderAddress        ': config.funderAddress,
    'merkle root          ': merkleRoot,
    'total claims amount  ': claimsInfo.amount,
    'number of claims     ': claimsInfo.claims.length
  });


  // --- Deploy the Merkle Distributor ---
  const merkleFactory = await ethers.getContractFactory("MerklePayout");
  const merklePayout = await merkleFactory.deploy(
    config.tokenAddress,
    merkleRoot,
    config.funderAddress
  );

  console.log(`Deploying Merkle Distributor to ${merklePayout.address}....`);
  await merklePayout.deployTransaction.wait(blocksToWait);;
  console.log('✅ Deployed');

  console.log('////////////////// CLAIMS: THIS SHOULD BE SAVED //////////////////')
  console.log(claimsInfo.claims);
  // TODO: Write output to a file
  console.log('////////////////// END //////////////////')

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



// --- User verification ---
// Helper method for waiting on user input. Source: https://stackoverflow.com/a/50890409
async function waitForInput(query: string): Promise<unknown> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function confirmContinue(params: Record<string, unknown>) {
  console.log('\nPARAMETERS');
  console.table(params);

  const response = await waitForInput('\nDo you want to continue? y/N\n');
  if (response !== 'y') throw new Error('Aborting script: User chose to exit script');
  console.log('\n');
}