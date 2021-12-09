import { expect } from "chai";
import { artifacts, ethers } from "hardhat";
import { utils, Contract, BigNumber } from 'ethers';
import { isAddress } from 'ethers/lib/utils';
import { Artifact } from 'hardhat/types';
import { MerklePayout } from '../typechain';
import { balanceOf, setBalance, tokens } from '../utils/index';
import { BalanceTree } from '../utils/balance-tree';
import { deployContract } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


const RANDOM_BYTES32 = utils.randomBytes(32);
const randomAddress = () => ethers.Wallet.createRandom().address;

type Claim = {
  index: number;
  payee: string;
  amount: number;
  merkleProof: string[];
};


describe("MerklePayout", function () {
  let user: SignerWithAddress;
  let funder: SignerWithAddress;
  let payout: MerklePayout;

  before(async () => {
    [user, funder] = await ethers.getSigners();

    // Deploy MerklePayout
    // const payoutArtifact: Artifact = await artifacts.readArtifact('MerklePayout');
    // payout = <MerklePayout>await deployContract(user, payoutArtifact, [tokens.dai.address, RANDOM_BYTES32]);
  });

});
