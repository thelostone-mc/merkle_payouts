## Merkle Payout

This is an implementation of Uniswap's merkle payout contract and is built using hardhat.
The original implementation can be found [here](https://github.com/Uniswap/merkle-distributor/blob/0d478d722da2e5d95b7292fd8cbdb363d98e9a93/contracts/MerkleDistributor.sol)

This is a sample contract which has been deployed on [rinkeby](https://rinkeby.etherscan.io/address/0x2aFFFe0B3BA1D3FD4a1Fc0a06AD0cAe4D22ABa4C)


### Features offered

This merkle contract supports

- deploying on `mainnet`/`rinkeby`
- on deploy
    - `funder`
    - `token`
    - `merkleRoot`


#### Read functions

- `funder`          : the address who deposts and can reclaim funds
- `token`           : ERC20 token in which the payouts should happen
- `merkleRoot`      : generated merkle root of the distribution
- `hasClaimed`      : check if an address has a pending claim

#### Write functions

- `claim`           : allows address to make a claim against the contract
- `batchClaim`      : invoked by `funder` to trigger all pending claims
- `reclaimFunds`    : invoked by `funder` and allowed `token` to be sent back to `funder`


#### Events Emitted

- `ReclaimFunds`        : emitted when `funder` invokes `reclaimFunds`
- `FundsClaimed`        : emitted when `address` succesfully invokes `claim`
- `BatchClaimTriggered` : emitted when `funder` succesfully invokes `batchClaim`


### Deploying merkle contract

- Create an `.env` file and fill out
    - `INFURA_ID`               : Infura ID for deploying contract
    - `DEPLOYER_PRIVATE_KEY`    : address which deploys the contract
    - `ETHERSCAN_API_KEY`       : API key for etherscan verification
    - `TOKEN`                   : Access token for the `ingest_merkle_claim_to_clr_match` API
    - `GRANT_PAYOUT_PK`         : Grant payout primary key
    - `API_BASE_URL`            : Base backend API URL (`http://localhost:8000` or `https://gitcoin.co`)


- Update `input.ts` parameters
    - `PayoutConfig`
    - `PayoutDistribution[]`
- Update `verify.ts` parameter
    - `token`
    - `merkleRoot`
    - `funder`

- Deploy contract
    ```shell
    yarn deploy:rinkeby #  deploy on rinkeby
    yarn deploy:mainnet #  deploy on mainnet
    ```


- Verify contract on etherscan
    ```shell
    # rinkeby
    yarn hardhat verify --constructor-args verify.js --network rinkeby <CONTRACT_ADDRESS>
    # mainnet
    yarn hardhat verify --constructor-args verify.js --network mainnet <CONTRACT_ADDRESS>
    ```

- The claims object would be generated and stored in `scripts/output.json`.
    This would be required for an address to make a claim
    Note: To make a claim against via etherscan, the claim object would be of the following format
    ```js
    [2,'0x5cdb35fADB8262A3f88863254c870c2e6A848CcA','0x4563918244f40000',['0x025ddd38f5815f027203629fc384e2a7beb453a112c2de03feb75dca73aef3bf','0xc1d74d73190dcdd156b817d78d3459ecd5efac2345c34fa48ad52d2ae11dc526','0x2bb06b1200f1a5d9c3d252ec853852c5042118c7fa74781e510ed334add6a1f2','0x2107e84fe9e2588768a806612070bc0c2095c08e70af311cad5ae5c2c0fa27a4']]
    ```

- Ingest merkle claims in the backend:
    ```shell
    yarn ingest_merkle_claims
    ```

### Contract Changes

Any time you make changes to the contract/ deploy scripts. Ensure these steps are run before raising a PR to make changes

```shell
hardhat clean   # clean artifacts
hardhat compile # compile contract

yarn lint       # eslint
yarn prettier   # prettier

yarn test       # test

yarn coverage   # coverage report
```

### Coverage Report

Coverage report is built using [solidity-coverage](https://github.com/sc-forks/solidity-coverage/blob/master/HARDHAT_README.md) plugin.

```shell
alias chrome="open -a 'Google Chrome'"

yarn coverage
chrome coverage/index.html
```
