// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ElementalSouls} from "./ElementalSouls.sol";

/**
 * @title LevelUpGateway
 * @dev Atomic NFT evolution: receive old NFT → verify permit → burn → mint new level
 * - EIP-712 signed permits with nonce and deadline
 * - Concurrency-safe with per-token processing locks
 * - Single transaction atomic burn + mint
 */
contract LevelUpGateway is IERC721Receiver, EIP712, ReentrancyGuard {
    // Immutable collection reference
    ElementalSouls public immutable coll;

    // Authorized signer for permits
    address public signer;

    // Per-token processing lock (prevent race conditions)
    mapping(uint256 => bool) public processing;

    // Per-token nonce (replay protection)
    mapping(uint256 => uint256) public nonces;

    // EIP-712 TypeHash
    bytes32 public constant LEVELUP_PERMIT_TYPEHASH = keccak256(
        "LevelUpPermit(address owner,uint256 tokenId,uint8 fromLevel,uint8 toLevel,uint256 deadline,uint256 nonce,string newUri)"
    );

    // Events
    event LeveledUp(
        address indexed owner,
        uint256 indexed oldId,
        uint256 indexed newId,
        uint8 fromLevel,
        uint8 toLevel,
        string newUri
    );

    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    /**
     * @dev EIP-712 permit structure for level up
     */
    struct LevelUpPermit {
        address owner;
        uint256 tokenId;
        uint8 fromLevel;
        uint8 toLevel;
        uint256 deadline;
        uint256 nonce;
        string newUri;
    }

    constructor(address collection, address _signer) EIP712("LevelUpGateway", "1") {
        require(collection != address(0), "zero");
        require(_signer != address(0), "zero");

        coll = ElementalSouls(collection);
        signer = _signer;
    }

    /**
     * @dev Update authorized signer
     * @param newSigner New signer address
     */
    function setSigner(address newSigner) external {
        require(newSigner != address(0), "zero");
        // Simple ownership check - in production use Ownable or AccessControl
        require(msg.sender == signer, "unauthorized");

        emit SignerUpdated(signer, newSigner);
        signer = newSigner;
    }

    /**
     * @dev ERC721 receiver - handles the atomic level up flow
     * @param from Token sender (must be permit.owner)
     * @param tokenId Token being sent
     * @param data Encoded (LevelUpPermit, bytes signature)
     */
    function onERC721Received(
        address, /* operator */
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external nonReentrant returns (bytes4) {
        // 1. Validate collection
        require(msg.sender == address(coll), "wrong collection");

        // 2. Lock token processing
        require(!processing[tokenId], "in progress");
        processing[tokenId] = true;

        // 3. Decode permit and signature
        (LevelUpPermit memory p, bytes memory signature) = abi.decode(data, (LevelUpPermit, bytes));

        // 4. Validate ownership and parameters
        require(p.owner == from, "owner mismatch");
        require(block.timestamp <= p.deadline, "expired");
        require(p.nonce == nonces[p.tokenId], "bad nonce");
        require(p.toLevel == p.fromLevel + 1, "bad level");

        // 5. Validate current state
        uint8 currentLevel = coll.levelOf(tokenId);
        require(currentLevel == p.fromLevel, "state drift");

        // 6. Verify EIP-712 signature
        bytes32 structHash = keccak256(
            abi.encode(
                LEVELUP_PERMIT_TYPEHASH,
                p.owner,
                p.tokenId,
                p.fromLevel,
                p.toLevel,
                p.deadline,
                p.nonce,
                keccak256(bytes(p.newUri))
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        require(recovered == signer, "bad signer");

        // 7. Increment nonce (replay protection)
        nonces[p.tokenId] += 1;

        // 8. Atomic burn + mint
        coll.burn(p.tokenId);
        uint256 newId = coll.mint(p.owner, p.toLevel, p.newUri);

        // 9. Unlock processing
        processing[tokenId] = false;

        // 10. Emit event
        emit LeveledUp(p.owner, p.tokenId, newId, p.fromLevel, p.toLevel, p.newUri);

        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev Get domain separator for EIP-712
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Get current nonce for a token
     */
    function getNonce(uint256 tokenId) external view returns (uint256) {
        return nonces[tokenId];
    }
}
