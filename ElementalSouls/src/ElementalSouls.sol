// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ElementalSouls
 * @dev ERC721 collection with level-based evolution system
 * - Transferable (not soulbound)
 * - Burnable by authorized gateway
 * - Level tracking per token
 */
contract ElementalSouls is ERC721, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Storage
    uint256 private _id;
    mapping(uint256 => uint8) public levelOf;
    mapping(uint256 => string) private _tokenURIs;

    // Events
    event Minted(address indexed to, uint256 indexed tokenId, uint8 level, string uri);
    event Burned(address indexed owner, uint256 indexed tokenId);

    constructor() ERC721("ElementalSouls", "ELS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Mint new NFT with specific level
     * @param to Recipient address
     * @param level Initial level (0-255)
     * @param uri Token metadata URI
     * @return tokenId The newly minted token ID
     */
    function mint(address to, uint8 level, string calldata uri)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256 tokenId)
    {
        require(to != address(0), "zero");

        tokenId = ++_id;
        _safeMint(to, tokenId);
        levelOf[tokenId] = level;
        _tokenURIs[tokenId] = uri;

        emit Minted(to, tokenId, level, uri);
    }

    /**
     * @dev Burn token and clear metadata
     * @param tokenId Token to burn
     */
    function burn(uint256 tokenId) external onlyRole(BURNER_ROLE) {
        address owner = ownerOf(tokenId);

        _burn(tokenId);
        delete levelOf[tokenId];
        delete _tokenURIs[tokenId];

        emit Burned(owner, tokenId);
    }

    /**
     * @dev Get token URI
     * @param tokenId Token ID
     * @return Token metadata URI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Override supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
