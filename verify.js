// yarn hardhat verify --constructor-args verify.js --network rinkeby <CONTRACT_ADDRESS>

// const owner = '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA'; // TODO: UPDATE
const token = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // TODO: UPDATE
const merkleRoot = "0xaadde9ced96c96a201163ed6e42c77adc50a400853818291e779ec64b15a8893"; // TODO: UPDATE
const funder = "0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6"; // TODO: UPDATE

module.exports = [token, merkleRoot, funder];
