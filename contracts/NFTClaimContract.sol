// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NFTClaimContract
 * @dev Manages NFT claims using pre-approved authority from retailers
 * Retailers approve this contract to transfer specific NFTs, then customers
 * can claim them using unique one-time codes without retailer's private key
 */
contract NFTClaimContract is Ownable, ReentrancyGuard {
    // The NFT contract this claim system manages
    IERC721 public nftContract;
    
    // Structure to store claim information
    struct Claim {
        uint256 tokenId;
        address retailer;
        bool isClaimed;
        address claimedBy;
        uint256 claimedAt;
    }
    
    // Mapping from claim code hash to claim information
    mapping(bytes32 => Claim) public claims;
    
    // Mapping to check if a token has an active claim
    mapping(uint256 => bytes32) public tokenIdToClaim;
    
    // Events
    event ClaimCreated(bytes32 indexed claimCodeHash, uint256 indexed tokenId, address indexed retailer);
    event ClaimExecuted(bytes32 indexed claimCodeHash, uint256 indexed tokenId, address indexed customer, address retailer);
    event ClaimCancelled(bytes32 indexed claimCodeHash, uint256 indexed tokenId, address indexed retailer);
    
    /**
     * @dev Constructor sets the NFT contract address
     * @param _nftContract The address of the NFT contract to manage
     */
    constructor(address _nftContract) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = IERC721(_nftContract);
    }
    
    /**
     * @dev Create multiple claims at once (batch operation)
     * @param claimCodes Array of claim codes
     * @param tokenIds Array of token IDs (must match length of claimCodes)
     */
    function createClaimBatch(string[] memory claimCodes, uint256[] memory tokenIds) external nonReentrant {
        require(claimCodes.length == tokenIds.length, "Arrays length mismatch");
        require(claimCodes.length > 0, "Empty arrays");
        require(claimCodes.length <= 100, "Max 100 claims per batch");
        
        for (uint256 i = 0; i < claimCodes.length; i++) {
            _createClaim(claimCodes[i], tokenIds[i]);
        }
    }
    
    /**
     * @dev Create a new claim for an NFT
     * The retailer must have approved this contract for the specific tokenId
     * @param claimCode The unique claim code (will be hashed)
     * @param tokenId The NFT token ID to be claimed
     */
    function createClaim(string memory claimCode, uint256 tokenId) external nonReentrant {
        _createClaim(claimCode, tokenId);
    }
    
    /**
     * @dev Internal function to create a claim
     */
    function _createClaim(string memory claimCode, uint256 tokenId) internal {
        require(bytes(claimCode).length > 0, "Claim code cannot be empty");
        require(nftContract.ownerOf(tokenId) == msg.sender, "You don't own this NFT");
        
        // Check if this contract is approved for the token
        address approvedAddress = nftContract.getApproved(tokenId);
        require(
            approvedAddress == address(this) || nftContract.isApprovedForAll(msg.sender, address(this)),
            "Contract not approved for this NFT"
        );
        
        bytes32 claimHash = keccak256(abi.encodePacked(claimCode));
        
        // Check if claim code already exists
        require(claims[claimHash].retailer == address(0), "Claim code already exists");
        
        // Check if token already has an active claim
        require(tokenIdToClaim[tokenId] == bytes32(0), "Token already has an active claim");
        
        claims[claimHash] = Claim({
            tokenId: tokenId,
            retailer: msg.sender,
            isClaimed: false,
            claimedBy: address(0),
            claimedAt: 0
        });
        
        tokenIdToClaim[tokenId] = claimHash;
        
        emit ClaimCreated(claimHash, tokenId, msg.sender);
    }
    
    /**
     * @dev Execute a claim - transfer NFT from retailer to customer
     * @param claimCode The unique claim code
     * @param customerAddress The customer's wallet address
     */
    function executeClaim(string memory claimCode, address customerAddress) external nonReentrant {
        require(customerAddress != address(0), "Invalid customer address");
        
        bytes32 claimHash = keccak256(abi.encodePacked(claimCode));
        Claim storage claim = claims[claimHash];
        
        // Validate claim
        require(claim.retailer != address(0), "Invalid claim code");
        require(!claim.isClaimed, "Claim already used");
        require(nftContract.ownerOf(claim.tokenId) == claim.retailer, "Retailer no longer owns NFT");
        
        // Verify approval is still valid
        address approvedAddress = nftContract.getApproved(claim.tokenId);
        require(
            approvedAddress == address(this) || nftContract.isApprovedForAll(claim.retailer, address(this)),
            "Contract no longer approved"
        );
        
        // Mark as claimed
        claim.isClaimed = true;
        claim.claimedBy = customerAddress;
        claim.claimedAt = block.timestamp;
        
        // Clear token mapping
        delete tokenIdToClaim[claim.tokenId];
        
        // Transfer NFT from retailer to customer using pre-approved authority
        nftContract.transferFrom(claim.retailer, customerAddress, claim.tokenId);
        
        emit ClaimExecuted(claimHash, claim.tokenId, customerAddress, claim.retailer);
    }
    
    /**
     * @dev Cancel a claim (only by retailer who created it)
     * @param claimCode The claim code to cancel
     */
    function cancelClaim(string memory claimCode) external nonReentrant {
        bytes32 claimHash = keccak256(abi.encodePacked(claimCode));
        Claim storage claim = claims[claimHash];
        
        require(claim.retailer == msg.sender, "Only retailer can cancel");
        require(!claim.isClaimed, "Claim already used");
        
        uint256 tokenId = claim.tokenId;
        
        // Clear mappings
        delete tokenIdToClaim[tokenId];
        delete claims[claimHash];
        
        emit ClaimCancelled(claimHash, tokenId, msg.sender);
    }
    
    /**
     * @dev Check if a claim code is valid and available
     * @param claimCode The claim code to check
     * @return isValid Whether the claim is valid
     * @return tokenId The NFT token ID
     * @return retailer The retailer's address
     * @return isClaimed Whether it has been claimed
     */
    function checkClaim(string memory claimCode) external view returns (
        bool isValid,
        uint256 tokenId,
        address retailer,
        bool isClaimed
    ) {
        bytes32 claimHash = keccak256(abi.encodePacked(claimCode));
        Claim storage claim = claims[claimHash];
        
        isValid = claim.retailer != address(0);
        tokenId = claim.tokenId;
        retailer = claim.retailer;
        isClaimed = claim.isClaimed;
    }
    
    /**
     * @dev Get claim information by claim code
     * @param claimCode The claim code
     * @return The full claim information
     */
    function getClaimInfo(string memory claimCode) external view returns (Claim memory) {
        bytes32 claimHash = keccak256(abi.encodePacked(claimCode));
        return claims[claimHash];
    }
} 