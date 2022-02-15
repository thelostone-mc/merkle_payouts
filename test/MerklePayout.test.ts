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
const randomAddress = async () => ethers.Wallet.createRandom().address;

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

    describe('two account balance tree', () => {

      let tree: BalanceTree;

      let funder: SignerWithAddress;
      let claimee0: SignerWithAddress;
      let claimee1: SignerWithAddress;


      beforeEach('deploy', async () => {

        [funder, claimee0, claimee1] = await ethers.getSigners();

        tree = new BalanceTree([
          { account: claimee0.address, amount: BigNumber.from(100) },
          { account: claimee1.address, amount: BigNumber.from(101) },
        ])

        payout = await MerklePayout.deploy(token.address, tree.getHexRoot(), funder.address, overrides);
        await token.setBalance(payout.address, 201);
      });

      it('successful claim', async () => {

        // first claimee claims
        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

        await expect(payout.claim(claimArgs0)).to.emit(payout, 'FundsClaimed').withArgs(0, claimee0.address, 100);

        // second claimee claims
        const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
        const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };

        await expect(payout.claim(claimArgs1)).to.emit(payout, 'FundsClaimed').withArgs(1, claimee1.address, 101);
      });

      it('sucessfully transfers token', async() => {

        expect(await token.balanceOf(payout.address)).to.eq(201);
        expect(await token.balanceOf(claimee0.address)).to.eq(0);

        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

        await payout.claim(claimArgs0);
        expect(await token.balanceOf(payout.address)).to.eq(101);
        expect(await token.balanceOf(claimee0.address)).to.eq(100);
      });

      it('must have enough tokens to transfer', async() => {

        await token.setBalance(payout.address, 99)

        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

        await expect(payout.claim(claimArgs0)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
      });

      it('hasClaimed is set', async() => {

        expect(await payout.hasClaimed(0)).to.be.false;

        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };
        await payout.claim(claimArgs0);

        expect(await payout.hasClaimed(0)).to.be.true;
      });

      it('cannot allow 2 claims', async() => {
        // claimee claims
        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };
        await payout.claim(claimArgs0);

        // claimee attemps to claim again
        await expect(payout.claim(claimArgs0)).to.be.revertedWith('MerklePayout: Funds already claimed.');
      });

      it('claimee0 cannot claim second time after claimee1 has claimed', async() => {
        // first claimee claims
        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };
        await payout.claim(claimArgs0);

        // second claimee claims
        const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
        const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };
        await payout.claim(claimArgs1);

        // first claimee attemps to claim again
        await expect(payout.claim(claimArgs0)).to.be.revertedWith('MerklePayout: Funds already claimed.');
      });


      it('claimee1 cannot claim second time after claimee0 has claimed', async() => {

        // second claimee claims
        const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
        const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };
        await payout.claim(claimArgs1);

        // first claimee claims
        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };
        await payout.claim(claimArgs0);

        // second claimee attemps to claim again
        await expect(payout.claim(claimArgs1)).to.be.revertedWith('MerklePayout: Funds already claimed.');
      });

      it('cannot claim more than proof', async() => {
        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 105, merkleProof: merkleProof0 };

        await expect(payout.claim(claimArgs0)).to.be.revertedWith('MerklePayout: Invalid proof.');
      });

      it('cannot claim for address other than proof', async () => {
        const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
        const claimArgs1 = { index: 0, claimee: claimee1.address, amount: 100, merkleProof: merkleProof0 };

        await expect(payout.claim(claimArgs1)).to.be.revertedWith('MerklePayout: Invalid proof.');
      });
    });

  });

  describe('#batchClaim', () => {
    
    let tree: BalanceTree;

    let funder: SignerWithAddress;
    let claimee0: SignerWithAddress;
    let claimee1: SignerWithAddress;


    beforeEach('deploy', async () => {

      [funder, claimee0, claimee1] = await ethers.getSigners();

      tree = new BalanceTree([
        { account: claimee0.address, amount: BigNumber.from(100) },
        { account: claimee1.address, amount: BigNumber.from(101) },
      ])

      payout = await MerklePayout.deploy(token.address, tree.getHexRoot(), funder.address, overrides);
      await token.setBalance(payout.address, 201);
    });


    it('successful batch claim', async () => {

      const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
      const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

      const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
      const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };

      const batchClaim = await payout.batchClaim([claimArgs0, claimArgs1]);

      await expect(batchClaim).to.emit(payout, 'FundsClaimed').withArgs(0, claimee0.address, 100);
      await expect(batchClaim).to.emit(payout, 'FundsClaimed').withArgs(1, claimee1.address, 101);
    });

    it('BatchClaimTriggered fired on successful batch claim', async () => {

      const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
      const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

      const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
      const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };

      const batchClaim = await payout.batchClaim([claimArgs0, claimArgs1]);

      await expect(batchClaim).to.emit(payout, 'BatchClaimTriggered').withArgs(funder.address);
    });


    it('sets #hasClaimed', async () => {
      
      const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
      const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

      expect(await payout.hasClaimed(0)).to.false;

      await payout.batchClaim([claimArgs0]);

      expect(await payout.hasClaimed(0)).to.true;
    });

    it('sucessfully transfers token', async () => {
      
      expect(await token.balanceOf(payout.address)).to.eq(201);
      expect(await token.balanceOf(claimee0.address)).to.eq(0);
      expect(await token.balanceOf(claimee1.address)).to.eq(0);

      const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
      const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

      const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
      const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };

      await payout.batchClaim([claimArgs0, claimArgs1]);

      expect(await token.balanceOf(payout.address)).to.eq(0);
      expect(await token.balanceOf(claimee0.address)).to.eq(100);
      expect(await token.balanceOf(claimee1.address)).to.eq(101);
    });

    it('user who is not funder cannot call batch claim', async () => {
      const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
      const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

      const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
      const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };

      await(expect(payout.connect(claimee0).batchClaim([claimArgs0, claimArgs1]))).to.be.revertedWith('MerklePayout: caller is not the funder');
    });

    it('user cannot claim after batchClaim completed', async () => {
      
      const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
      const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

      const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
      const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };

      await payout.batchClaim([claimArgs0, claimArgs1]);

      await expect(payout.claim(claimArgs0)).to.be.revertedWith('MerklePayout: Funds already claimed.');
    });

    it('user can claim it not claimed via batchClaim', async () => {
      
      const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
      const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

      const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
      const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };

      await payout.batchClaim([claimArgs0]);

      await expect(payout.claim(claimArgs1)).to.emit(payout, 'FundsClaimed').withArgs(1, claimee1.address, 101);;
    });
  });

  describe('#reclaimFunds', () => {

    let tree: BalanceTree;

    let funder: SignerWithAddress;
    let claimee0: SignerWithAddress;
    let claimee1: SignerWithAddress;

    beforeEach('deploy', async () => {

      [funder, claimee0, claimee1] = await ethers.getSigners();

      tree = new BalanceTree([
        { account: claimee0.address, amount: BigNumber.from(100) },
        { account: claimee1.address, amount: BigNumber.from(101) },
      ])

      payout = await MerklePayout.deploy(token.address, tree.getHexRoot(), funder.address, overrides);
      await token.setBalance(payout.address, 201);
    });

    it('reclaimFunds invoked by another addrees', async () => {

      payout = await MerklePayout.deploy(token.address, tree.getHexRoot(), await randomAddress(), overrides);

      await(expect(payout.reclaimFunds(token.address))).to.be.revertedWith('MerklePayout: caller is not the funder');
    })

    it('reclaimFunds invoked before any claims', async () => {

      await token.setBalance(funder.address, 0);

      expect(await token.balanceOf(payout.address)).to.eq(201);
      expect(await token.balanceOf(funder.address)).to.eq(0);

      await payout.reclaimFunds(token.address);

      expect(await token.balanceOf(payout.address)).to.eq(0);
      expect(await token.balanceOf(funder.address)).to.eq(201);

    });

    it('reclaimFunds emits ReclaimFunds event before any claim', async () => {
      expect(await payout.reclaimFunds(token.address)).to.emit(payout, 'ReclaimFunds').withArgs(funder.address, token.address, 201);
    });

    it('reclaimFunds invoked after 1 claim', async () => {

      await token.setBalance(funder.address, 0);

      const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
      const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };

      await payout.claim(claimArgs0);
      
      expect(await token.balanceOf(payout.address)).to.eq(101);

      await payout.reclaimFunds(token.address);

      expect(await token.balanceOf(payout.address)).to.eq(0);
      expect(await token.balanceOf(claimee0.address)).to.eq(100);
      expect(await token.balanceOf(funder.address)).to.eq(101);
    });

    it('reclaimFunds invoked after all claim', async () => {

      await token.setBalance(funder.address, 0);

      const merkleProof0 = tree.getProof(0, claimee0.address, BigNumber.from(100));
      const claimArgs0 = { index: 0, claimee: claimee0.address, amount: 100, merkleProof: merkleProof0 };
      const merkleProof1 = tree.getProof(1, claimee1.address, BigNumber.from(101));
      const claimArgs1 = { index: 1, claimee: claimee1.address, amount: 101, merkleProof: merkleProof1 };

      await payout.batchClaim([claimArgs0, claimArgs1]);
      
      expect(await token.balanceOf(payout.address)).to.eq(0);

      await payout.reclaimFunds(token.address);

      expect(await token.balanceOf(funder.address)).to.eq(0);
      expect(await token.balanceOf(payout.address)).to.eq(0);
      expect(await token.balanceOf(claimee0.address)).to.eq(100);
      expect(await token.balanceOf(claimee1.address)).to.eq(101);

    });
  });
});
