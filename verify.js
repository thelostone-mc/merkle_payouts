// yarn hardhat verify --constructor-args verify.js --network rinkeby <CONTRACT_ADDRESS>

// const owner = '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA'; // TODO: UPDATE
const token = "0xc944E90C64B2c07662A292be6244BDf05Cda44a7"; // TODO: UPDATE
const merkleRoot = "0x80ad9882896a6ac57fd26aa30ba3924a02e03382c4f5c8ffbd57545c44c40f8f"; // TODO: UPDATE
const funder = "0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6"; // TODO: UPDATE

module.exports = [token, merkleRoot, funder];
