import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import { NetworkUserConfig } from 'hardhat/types';
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
require('solidity-coverage');

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const chainIds = {
  hardhat: 31337,
  mainnet: 1,
  rinkeby: 4,
};


let mnemonic = process.env.MNEMONIC as string;
if (!mnemonic) {
  console.warn('Please set your MNEMONIC in a .env file');
}


const infuraIdKey = process.env.INFURA_ID as string;
if (!infuraIdKey) {
  console.warn('Please set your INFURA_ID in a .env file');
}


// Configure dummy private key, so CI doesn't fail due a lack of private key env var, which is only needed for
// contract deployment anyway (i.e. not required for CI)
let deployPrivateKey = process.env.DEPLOYER_PRIVATE_KEY as string;
if (!deployPrivateKey) {
  console.warn('Please set your DEPLOYER_PRIVATE_KEY in a .env file');
  deployPrivateKey = '0x0000000000000000000000000000000000000000000000000000000000000001';
}

function createTestnetConfig(network: keyof typeof chainIds): NetworkUserConfig {

  const url: string = `https://${network}.infura.io/v3/${infuraIdKey}`;
  return {
    accounts: [deployPrivateKey],
    chainId: chainIds[network],
    allowUnlimitedContractSize: true,
    url,
  };
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    rinkeby: createTestnetConfig('rinkeby'),
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
