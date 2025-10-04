// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ElementalSouls} from "../src/ElementalSouls.sol";
import {LevelUpGateway} from "../src/LevelUpGateway.sol";

contract LevelUpTest is Test {
    ElementalSouls public collection;
    LevelUpGateway public gateway;

    address public admin;
    address public signer;
    address public user1;
    address public user2;

    uint256 public signerPrivateKey;

    function setUp() public {
        admin = address(this);
        signerPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;
        signer = vm.addr(signerPrivateKey);

        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy contracts
        collection = new ElementalSouls();
        gateway = new LevelUpGateway(address(collection), signer);

        // Grant roles to gateway
        collection.grantRole(collection.MINTER_ROLE(), address(gateway));
        collection.grantRole(collection.BURNER_ROLE(), address(gateway));

        // Grant minter role to admin for initial mints
        collection.grantRole(collection.MINTER_ROLE(), admin);
    }

    /**
     * @dev Helper to create and sign a LevelUpPermit
     */
    function _createSignedPermit(
        address owner,
        uint256 tokenId,
        uint8 fromLevel,
        uint8 toLevel,
        uint256 deadline,
        uint256 nonce,
        string memory newUri
    ) internal view returns (LevelUpGateway.LevelUpPermit memory, bytes memory) {
        LevelUpGateway.LevelUpPermit memory permit = LevelUpGateway.LevelUpPermit({
            owner: owner,
            tokenId: tokenId,
            fromLevel: fromLevel,
            toLevel: toLevel,
            deadline: deadline,
            nonce: nonce,
            newUri: newUri
        });

        bytes32 structHash = keccak256(
            abi.encode(
                gateway.LEVELUP_PERMIT_TYPEHASH(),
                permit.owner,
                permit.tokenId,
                permit.fromLevel,
                permit.toLevel,
                permit.deadline,
                permit.nonce,
                keccak256(bytes(permit.newUri))
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", gateway.domainSeparator(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        return (permit, signature);
    }

    // ============ HAPPY PATH TESTS ============

    function test_HappyPath_Level0To1() public {
        // 1. Mint initial L0 NFT to user1
        uint256 tokenId = collection.mint(user1, 0, "ipfs://level0");

        assertEq(collection.ownerOf(tokenId), user1);
        assertEq(collection.levelOf(tokenId), 0);
        assertEq(collection.tokenURI(tokenId), "ipfs://level0");

        // 2. Create signed permit for L0→L1
        (LevelUpGateway.LevelUpPermit memory permit, bytes memory sig) = _createSignedPermit(
            user1,
            tokenId,
            0, // fromLevel
            1, // toLevel
            block.timestamp + 1 hours,
            0, // nonce
            "ipfs://level1"
        );

        bytes memory data = abi.encode(permit, sig);

        // 3. User transfers NFT to gateway (triggers level up)
        vm.prank(user1);
        collection.safeTransferFrom(user1, address(gateway), tokenId, data);

        // 4. Verify old token is burned
        vm.expectRevert();
        collection.ownerOf(tokenId);

        // 5. Verify new token exists
        uint256 newTokenId = tokenId + 1; // _id counter incremented
        assertEq(collection.ownerOf(newTokenId), user1);
        assertEq(collection.levelOf(newTokenId), 1);
        assertEq(collection.tokenURI(newTokenId), "ipfs://level1");

        // 6. Verify nonce incremented
        assertEq(gateway.nonces(tokenId), 1);
    }

    function test_ConcurrentLevelUps() public {
        // Mint L0 for user1 and L7 for user2
        uint256 token1 = collection.mint(user1, 0, "ipfs://u1-l0");
        uint256 token2 = collection.mint(user2, 7, "ipfs://u2-l7");

        // Create permits
        (LevelUpGateway.LevelUpPermit memory p1, bytes memory sig1) = _createSignedPermit(
            user1, token1, 0, 1, block.timestamp + 1 hours, 0, "ipfs://u1-l1"
        );

        (LevelUpGateway.LevelUpPermit memory p2, bytes memory sig2) = _createSignedPermit(
            user2, token2, 7, 8, block.timestamp + 1 hours, 0, "ipfs://u2-l8"
        );

        // Both users level up in same block
        vm.prank(user1);
        collection.safeTransferFrom(user1, address(gateway), token1, abi.encode(p1, sig1));

        vm.prank(user2);
        collection.safeTransferFrom(user2, address(gateway), token2, abi.encode(p2, sig2));

        // Verify both succeeded
        // After token1 burns and mints new token (3), then token2 burns and mints new token (4)
        uint256 newToken1 = 3; // token1=1, token2=2, then mint creates token3
        uint256 newToken2 = 4; // then mint creates token4

        assertEq(collection.ownerOf(newToken1), user1);
        assertEq(collection.levelOf(newToken1), 1);

        assertEq(collection.ownerOf(newToken2), user2);
        assertEq(collection.levelOf(newToken2), 8);
    }

    function test_MultipleLevelUps() public {
        // L0 → L1 → L2
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        // First evolution L0→L1
        (LevelUpGateway.LevelUpPermit memory p1, bytes memory sig1) = _createSignedPermit(
            user1, tokenId, 0, 1, block.timestamp + 1 hours, 0, "ipfs://l1"
        );

        vm.prank(user1);
        collection.safeTransferFrom(user1, address(gateway), tokenId, abi.encode(p1, sig1));

        uint256 token1 = tokenId + 1;
        assertEq(collection.levelOf(token1), 1);

        // Second evolution L1→L2
        (LevelUpGateway.LevelUpPermit memory p2, bytes memory sig2) = _createSignedPermit(
            user1, token1, 1, 2, block.timestamp + 1 hours, 0, "ipfs://l2"
        );

        vm.prank(user1);
        collection.safeTransferFrom(user1, address(gateway), token1, abi.encode(p2, sig2));

        uint256 token2 = token1 + 1;
        assertEq(collection.levelOf(token2), 2);
        assertEq(collection.tokenURI(token2), "ipfs://l2");
    }

    // ============ ERROR TESTS ============

    function test_Revert_WrongCollection() public {
        // Deploy second collection
        ElementalSouls otherCollection = new ElementalSouls();
        otherCollection.grantRole(otherCollection.MINTER_ROLE(), admin);
        uint256 tokenId = otherCollection.mint(user1, 0, "ipfs://other");

        (LevelUpGateway.LevelUpPermit memory permit, bytes memory sig) = _createSignedPermit(
            user1, tokenId, 0, 1, block.timestamp + 1 hours, 0, "ipfs://l1"
        );

        vm.prank(user1);
        vm.expectRevert("wrong collection");
        otherCollection.safeTransferFrom(user1, address(gateway), tokenId, abi.encode(permit, sig));
    }

    function test_Revert_OwnerMismatch() public {
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        // Create permit with wrong owner
        (LevelUpGateway.LevelUpPermit memory permit, bytes memory sig) = _createSignedPermit(
            user2, // wrong owner
            tokenId,
            0,
            1,
            block.timestamp + 1 hours,
            0,
            "ipfs://l1"
        );

        vm.prank(user1);
        vm.expectRevert("owner mismatch");
        collection.safeTransferFrom(user1, address(gateway), tokenId, abi.encode(permit, sig));
    }

    function test_Revert_Expired() public {
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        uint256 pastDeadline = block.timestamp - 1;
        (LevelUpGateway.LevelUpPermit memory permit, bytes memory sig) = _createSignedPermit(
            user1, tokenId, 0, 1, pastDeadline, 0, "ipfs://l1"
        );

        vm.prank(user1);
        vm.expectRevert("expired");
        collection.safeTransferFrom(user1, address(gateway), tokenId, abi.encode(permit, sig));
    }

    function test_Revert_BadNonce() public {
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        // Create permit with wrong nonce
        (LevelUpGateway.LevelUpPermit memory permit, bytes memory sig) = _createSignedPermit(
            user1, tokenId, 0, 1, block.timestamp + 1 hours, 99, "ipfs://l1"
        );

        vm.prank(user1);
        vm.expectRevert("bad nonce");
        collection.safeTransferFrom(user1, address(gateway), tokenId, abi.encode(permit, sig));
    }

    function test_Revert_BadLevel() public {
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        // Try to jump from L0 to L5
        (LevelUpGateway.LevelUpPermit memory permit, bytes memory sig) = _createSignedPermit(
            user1, tokenId, 0, 5, block.timestamp + 1 hours, 0, "ipfs://l5"
        );

        vm.prank(user1);
        vm.expectRevert("bad level");
        collection.safeTransferFrom(user1, address(gateway), tokenId, abi.encode(permit, sig));
    }

    function test_Revert_StateDrift() public {
        uint256 tokenId = collection.mint(user1, 5, "ipfs://l5");

        // Permit says L0→L1 but token is actually L5
        (LevelUpGateway.LevelUpPermit memory permit, bytes memory sig) = _createSignedPermit(
            user1, tokenId, 0, 1, block.timestamp + 1 hours, 0, "ipfs://l1"
        );

        vm.prank(user1);
        vm.expectRevert("state drift");
        collection.safeTransferFrom(user1, address(gateway), tokenId, abi.encode(permit, sig));
    }

    function test_Revert_BadSigner() public {
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        // Create permit but sign with different key
        uint256 wrongKey = 0x9999999999999999999999999999999999999999999999999999999999999999;

        LevelUpGateway.LevelUpPermit memory permit = LevelUpGateway.LevelUpPermit({
            owner: user1,
            tokenId: tokenId,
            fromLevel: 0,
            toLevel: 1,
            deadline: block.timestamp + 1 hours,
            nonce: 0,
            newUri: "ipfs://l1"
        });

        bytes32 structHash = keccak256(
            abi.encode(
                gateway.LEVELUP_PERMIT_TYPEHASH(),
                permit.owner,
                permit.tokenId,
                permit.fromLevel,
                permit.toLevel,
                permit.deadline,
                permit.nonce,
                keccak256(bytes(permit.newUri))
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", gateway.domainSeparator(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, digest);
        bytes memory wrongSig = abi.encodePacked(r, s, v);

        vm.prank(user1);
        vm.expectRevert("bad signer");
        collection.safeTransferFrom(user1, address(gateway), tokenId, abi.encode(permit, wrongSig));
    }

    function test_Revert_ReplayAttack() public {
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        (LevelUpGateway.LevelUpPermit memory permit, bytes memory sig) = _createSignedPermit(
            user1, tokenId, 0, 1, block.timestamp + 1 hours, 0, "ipfs://l1"
        );

        bytes memory data = abi.encode(permit, sig);

        // First level up succeeds
        vm.prank(user1);
        collection.safeTransferFrom(user1, address(gateway), tokenId, data);

        uint256 newTokenId = tokenId + 1;

        // Try to replay same permit
        vm.prank(user1);
        vm.expectRevert("bad nonce");
        collection.safeTransferFrom(user1, address(gateway), newTokenId, data);
    }

    // ============ TRANSFER TESTS ============

    function test_NormalTransfer() public {
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        // NFTs should be transferable (not soulbound)
        vm.prank(user1);
        collection.transferFrom(user1, user2, tokenId);

        assertEq(collection.ownerOf(tokenId), user2);
    }

    function test_OnlyGatewayCanBurn() public {
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        // Regular user cannot burn
        vm.prank(user1);
        vm.expectRevert();
        collection.burn(tokenId);

        // Only gateway (with BURNER_ROLE) can burn
        vm.prank(address(gateway));
        collection.burn(tokenId);

        vm.expectRevert();
        collection.ownerOf(tokenId);
    }

    // ============ ADMIN TESTS ============

    function test_UpdateSigner() public {
        address newSigner = makeAddr("newSigner");

        vm.prank(signer);
        gateway.setSigner(newSigner);

        assertEq(gateway.signer(), newSigner);
    }

    function test_Revert_UnauthorizedSignerUpdate() public {
        address newSigner = makeAddr("newSigner");

        vm.prank(user1);
        vm.expectRevert("unauthorized");
        gateway.setSigner(newSigner);
    }

    function test_Revert_ZeroAddressSigner() public {
        vm.prank(signer);
        vm.expectRevert(bytes("zero"));
        gateway.setSigner(address(0));
    }

    // ============ VIEW FUNCTIONS ============

    function test_GetNonce() public {
        uint256 tokenId = collection.mint(user1, 0, "ipfs://l0");

        assertEq(gateway.getNonce(tokenId), 0);

        (LevelUpGateway.LevelUpPermit memory permit, bytes memory sig) = _createSignedPermit(
            user1, tokenId, 0, 1, block.timestamp + 1 hours, 0, "ipfs://l1"
        );

        vm.prank(user1);
        collection.safeTransferFrom(user1, address(gateway), tokenId, abi.encode(permit, sig));

        assertEq(gateway.getNonce(tokenId), 1);
    }

    function test_DomainSeparator() public view {
        bytes32 separator = gateway.domainSeparator();
        assertTrue(separator != bytes32(0));
    }
}
