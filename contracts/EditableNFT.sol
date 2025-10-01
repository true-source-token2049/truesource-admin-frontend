// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract EditableNFT is ERC721, ERC721URIStorage {
    uint256 private _tokenIds;
    
    // Events
    event TokenMinted(uint256 indexed tokenId, address indexed to, string metadataUri);
    
    constructor() ERC721("EditableNFT", "ENFT") {}
    
    /**
     * @dev Mint a new NFT to the caller's address
     * @param metadataUri The URI pointing to the metadata JSON
     * @return The token ID of the minted NFT
     */
    function mint(string memory metadataUri) public returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, metadataUri);
        
        emit TokenMinted(newTokenId, msg.sender, metadataUri);
        
        return newTokenId;
    }
    
    /**
     * @dev Mint multiple NFTs to the caller's address with the same metadata
     * @param metadataUri The URI pointing to the metadata JSON
     * @param quantity The number of NFTs to mint (max 100)
     * @return The first token ID of the minted batch
     */
    function mintBatch(string memory metadataUri, uint256 quantity) public returns (uint256) {
        require(quantity > 0 && quantity <= 100, "Quantity: 1-100");
        
        uint256 firstTokenId = _tokenIds + 1;
        uint256 currentId = _tokenIds;
        
        // Optimized loop - cache values, reduce storage writes
        for (uint256 i = 0; i < quantity;) {
            unchecked {
                ++currentId;
            }
            
            _mint(msg.sender, currentId);
            _setTokenURI(currentId, metadataUri);
            
            emit TokenMinted(currentId, msg.sender, metadataUri);
            
            unchecked {
                ++i;
            }
        }
        
        _tokenIds = currentId;
        
        return firstTokenId;
    }
    
    /**
     * @dev Get the total number of tokens minted
     * @return The total supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @dev Check if a token exists
     * @param tokenId The token ID
     * @return True if the token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
