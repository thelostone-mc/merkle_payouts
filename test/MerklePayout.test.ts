import { expect } from "chai";
import { artifacts, ethers } from "hardhat";
import { utils, Contract, BigNumber } from 'ethers';
import { isAddress } from 'ethers/lib/utils';
import { Artifact } from 'hardhat/types';
import { MerklePayout, MerklePayout__factory, TestERC20 } from '../typechain';
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

const overrides = {
  gasLimit: 9999999,
}

describe("MerklePayout", async function () {
  let MerklePayout: MerklePayout__factory;
  let payout: MerklePayout;

  let token: TestERC20;
  
  beforeEach('deploy token', async () => {
    MerklePayout = await ethers.getContractFactory("MerklePayout");

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    token = await TestERC20.deploy('Token', 'TKN', 0, overrides);
    await token.deployed();
  })

  describe('#constructor', () => {
    it('deploys properly', async function () {

      let [funder] = await ethers.getSigners();

      // Verify Token Deploy
      expect(isAddress(token.address), 'Failed to deploy TestERC20').to.be.true;

      // Deploy MerklePayout
     
      payout = await MerklePayout.deploy(token.address, RANDOM_BYTES32, funder.address, overrides)

      // Verify deploy
      expect(isAddress(payout.address), 'Failed to deploy MerklePayout').to.be.true;

      // Verify constructor parameters
      expect(await payout.token()).to.equal(token.address);
      expect(await payout.merkleRoot()).to.equal(utils.hexlify(RANDOM_BYTES32));
      expect(await payout.funder()).to.equal(funder.address);
    });
  });


  describe('#claim', () => {

    let payout: Contract;

    it('it fails for empty proof / invalid index', async () => {
      let [funder, claimee] = await ethers.getSigners();

      payout = await MerklePayout.deploy(token.address, RANDOM_BYTES32, funder.address, overrides);
      const claimArgs = { index: 0, claimee: claimee.address, amount: 10, merkleProof: [] };
      
      await expect(payout.claim(claimArgs)).to.be.revertedWith(
        'MerklePayout: Invalid proof.'
      );
    });

    it('two account balance tree', async() => {

      let tree: BalanceTree;
      let [funder, claimee0, claimee1] = await ethers.getSigners();


      beforeEach('deploy', async () => {
        console.log("NOT WORKING.");
        expect(false).to.eq(true);

        tree = new BalanceTree([
          { account: claimee0.address, amount: BigNumber.from(100) },
          { account: claimee1.address, amount: BigNumber.from(101) },
        ])
        
        payout = await MerklePayout.deploy(token.address, tree.getHexRoot(), funder.address, overrides);
        await token.setBalance(payout.address, 201);
      })

      it('successful claim', async () => {

        expect(false).to.eq(true);

        expect(await token.balanceOf(payout.address)).to.eq(201);
        expect(await token.balanceOf(claimee0.address)).to.eq(0);
        expect(await token.balanceOf(claimee1.address)).to.eq(0);

        // first claimee claims
        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

        await expect(payout.claim(claimArgs0)).to.emit(payout, 'FundsClaimed').withArgs(0, claimee0.address, 100);

        expect(await token.balanceOf(payout.address)).to.eq(101);
        expect(await token.balanceOf(claimee0.address)).to.eq(100);
        expect(await token.balanceOf(claimee1.address)).to.eq(0);

        // second claimee claims
        const merkleProof1 = tree.getProof(0, claimee1.address, BigNumber.from(101));
        const claimArgs1 = { index: 0, claimee: claimee0.address, amount: 101, merkleProof: merkleProof1 };

        await expect(payout.claim(claimArgs1)).to.emit(payout, 'FundsClaimed').withArgs(0, claimee1.address, 101);

        expect(await token.balanceOf(payout.address)).to.eq(0);
        expect(await token.balanceOf(claimee0.address)).to.eq(100);
        expect(await token.balanceOf(claimee1.address)).to.eq(101);
      })

    });

  })
});
