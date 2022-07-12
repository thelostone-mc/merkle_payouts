// yarn hardhat verify --constructor-args verify.js --network rinkeby <CONTRACT_ADDRESS>

// const owner = '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA'; // TODO: UPDATE
const token = "0x90DE74265a416e1393A450752175AED98fe11517"; // TODO: UPDATE
const merkleRoot = "0xbb995904a58b701116480d55bf2e11f88d5fbacebd3c7b6a600176dc3f690cf1"; // TODO: UPDATE
const funder = "0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6"; // TODO: UPDATE

module.exports = [token, merkleRoot, funder];
