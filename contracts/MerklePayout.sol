// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerklePayout {
  using SafeERC20 for IERC20;

  // --- Data ---

  /// @notice Address where funding comes from address which funds the contract
  address public immutable funder;

  /// @notice Token in which payouts woulc be made
  IERC20 public immutable token;

  /// @notice merkle root generated from distribution
  bytes32 public immutable merkleRoot;

  /// @dev packed array of booleans to keep track of claims
  mapping(uint256 => uint256) private claimedBitMap;


  // --- Events ---

  /// @notice Emitted when funder reclaims funds
  event ReclaimFunds(address funder, IERC20 token, uint256 amount);

  /// @notice Emitted when user succesfully claims funds
  event FundsClaimed(uint256 index, address indexed claimee, uint256 amount);


  // --- Types ---

  struct Claim {
    uint256 index;
    address claimee;
    uint256 amount;
    bytes32[] merkleProof;
  }

  // --- Constructor ---
  
  /// @notice sets the funder address, payout token, merkleRoot 
  constructor(
    IERC20 _token,
    bytes32 _merkleRoot,
    address _funder
  ) {
    token =  _token;
    merkleRoot = _merkleRoot;
    funder = _funder;
  }


  // --- Core methods ---

  /**
   * @notice Marks claim on the claimedBitMap for given index
   * @param _index index in claimedBitMap which has claimed funds
   */
  function _setClaimed(uint256 _index) private {
    uint256 claimedWordIndex = _index / 256;
    uint256 claimedBitIndex = _index % 256;
    claimedBitMap[claimedWordIndex] |= (1 << claimedBitIndex);
  }


  /**
   * @notice Check if claimee has already claimed funds.
   * @dev Checks if index has been marked as claimed.
   *
   * @param _index Index in claimedBitMap
   */
  function hasClaimed(uint256 _index) public view returns (bool) {
    uint256 claimedWordIndex = _index / 256;
    uint256 claimedBitIndex = _index % 256;
    uint256 claimedWord = claimedBitMap[claimedWordIndex];

    uint256 mask = (1 << claimedBitIndex);
    return claimedWord & mask == mask;
  }


  /**
   * @notice Claims token to given address and updates claimedBitMap
   * @dev Reverts a claim if inputs are invalid
   * @param _claim Claim
   */
  function claim(Claim calldata _claim) public {
    uint256 _index = _claim.index;
    address _claimee = _claim.claimee;
    uint256 _amount = _claim.amount;
    bytes32[] calldata _merkleProof = _claim.merkleProof;

    // check if payee has not claimed funds
    require(!hasClaimed(_index), "MerklePayout: Funds already claimed.");

    // verify the merkle proof
    bytes32 node = keccak256(abi.encodePacked(_index, _claimee, _amount));
    require(MerkleProof.verify(_merkleProof, merkleRoot, node), "MerklePayout: Invalid proof.");

    // mark as claimed and transfer
    _setClaimed(_index);
    token.safeTransfer(_claimee, _amount);

    // emit event
    emit FundsClaimed(_index, _claimee, _amount);
  }


  /**
   * @notice Enables the funder to withrdraw remaining balance
   * @dev Escape hatch, intended to be used if the merkle root uploaded is incorrect
   * @dev We trust the funder, which is why they are allowed to withdraw funds at any time
   *
   * @param _token Address of token to withdraw from this contract
   */
  function reclaimFunds(IERC20 _token) external {
    require(msg.sender == funder, "MerklePayout: caller is not the funder");

    uint256 _balance = _token.balanceOf(address(this));

    emit ReclaimFunds(funder, _token, _balance);
  }

  /**
   * @notice Batch Claim
   * @dev Useful for batch claims (complete pending claims)
   *
   * @param _claims Array of Claim
   */
  function batchClaim(Claim[] calldata _claims) external {
    require(msg.sender == funder, "MerklePayout: caller is not the funder");
  
    for (uint256 i = 0; i < _claims.length; i++) {
      claim(_claims[i]);
    }
  }
}