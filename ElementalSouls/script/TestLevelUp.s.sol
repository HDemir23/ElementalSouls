// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ElementalSouls} from "../src/ElementalSouls.sol";
import {LevelUpGateway} from "../src/LevelUpGateway.sol";

contract TestLevelUp is Script {
    ElementalSouls constant collection = ElementalSouls(0x0a5C90D70153408Bc68dE50601581f9A0a08aB95);
    LevelUpGateway constant gateway = LevelUpGateway(0x066A9C7Fe82C3B1E567C2CE6313B704B11158fDF);

    function run() external {
        uint256 userPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 signerPrivateKey = userPrivateKey; // Same for testing
        address user = vm.addr(userPrivateKey);

        console.log("User address:", user);

        // 1. Check current NFT
        uint256 tokenId = 1;
        console.log("\n=== BEFORE LEVEL UP ===");
        console.log("Token ID:", tokenId);

        try collection.ownerOf(tokenId) returns (address owner) {
            console.log("Owner:", owner);
            console.log("Level:", collection.levelOf(tokenId));
            console.log("URI:", collection.tokenURI(tokenId));
        } catch {
            console.log("Token does not exist");
            return;
        }

        // 2. Create permit
        uint256 nonce = gateway.getNonce(tokenId);
        console.log("Current nonce:", nonce);

        LevelUpGateway.LevelUpPermit memory permit = LevelUpGateway.LevelUpPermit({
            owner: user,
            tokenId: tokenId,
            fromLevel: 0,
            toLevel: 1,
            deadline: block.timestamp + 1 hours,
            nonce: nonce,
            newUri: "ipfs://QmTest123/level-1-fire.json"
        });

        // 3. Sign permit (EIP-712)
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

        console.log("\n=== PERMIT DETAILS ===");
        console.log("From Level:", permit.fromLevel);
        console.log("To Level:", permit.toLevel);
        console.log("Nonce:", permit.nonce);
        console.log("Deadline:", permit.deadline);

        // 4. Execute level up
        bytes memory data = abi.encode(permit, signature);

        vm.startBroadcast(userPrivateKey);

        console.log("\n=== EXECUTING LEVEL UP ===");
        collection.safeTransferFrom(user, address(gateway), tokenId, data);

        vm.stopBroadcast();

        // 5. Verify result
        console.log("\n=== AFTER LEVEL UP ===");

        // Old token should be burned
        try collection.ownerOf(tokenId) returns (address) {
            console.log("ERROR: Old token still exists!");
        } catch {
            console.log("Old token (ID 1) successfully burned");
        }

        // New token should exist
        uint256 newTokenId = 2; // Counter incremented
        try collection.ownerOf(newTokenId) returns (address newOwner) {
            console.log("\nNew Token ID:", newTokenId);
            console.log("New Owner:", newOwner);
            console.log("New Level:", collection.levelOf(newTokenId));
            console.log("New URI:", collection.tokenURI(newTokenId));
            console.log("New Nonce:", gateway.getNonce(tokenId));

            if (newOwner == user && collection.levelOf(newTokenId) == 1) {
                console.log("\n SUCCESS: Level up completed!");
            }
        } catch {
            console.log("ERROR: New token not found!");
        }
    }
}
