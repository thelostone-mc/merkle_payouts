// yarn hardhat verify --constructor-args verify.js --network rinkeby <CONTRACT_ADDRESS>

// const owner = '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA'; // TODO: UPDATE
const token = '0xC48ea75748bE6335476C6EdF6DDc7782F2ddaAE8'; // TODO: UPDATE
const merkleRoot = '0x91b136504a30be213e007df37b6c3c2444827a6948682996fe973b11d5570877'; // TODO: UPDATE
const funder = '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA'; // TODO: UPDATE

module.exports = [token, merkleRoot, funder];