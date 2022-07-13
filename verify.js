// yarn hardhat verify --constructor-args verify.js --network rinkeby <CONTRACT_ADDRESS>

// const owner = '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA'; // TODO: UPDATE
const token = "0xAaAAAA20D9E0e2461697782ef11675f668207961"; // TODO: UPDATE
const merkleRoot = "0xfe0beb513d7ae3c18cba86c1e4ad2a0e97977bf6afc32743362d2a9854670b3a"; // TODO: UPDATE
const funder = "0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6"; // TODO: UPDATE

module.exports = [token, merkleRoot, funder];
