// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ElementalSouls} from "../src/ElementalSouls.sol";
import {LevelUpGateway} from "../src/LevelUpGateway.sol";

contract DeployLevelUp is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address signerAddress = vm.envAddress("SIGNER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ElementalSouls collection
        ElementalSouls collection = new ElementalSouls();
        console.log("ElementalSouls deployed at:", address(collection));

        // 2. Deploy LevelUpGateway
        LevelUpGateway gateway = new LevelUpGateway(address(collection), signerAddress);
        console.log("LevelUpGateway deployed at:", address(gateway));

        // 3. Grant roles to gateway
        bytes32 MINTER_ROLE = collection.MINTER_ROLE();
        bytes32 BURNER_ROLE = collection.BURNER_ROLE();

        collection.grantRole(MINTER_ROLE, address(gateway));
        console.log("Granted MINTER_ROLE to gateway");

        collection.grantRole(BURNER_ROLE, address(gateway));
        console.log("Granted BURNER_ROLE to gateway");

        // 4. Optional: Grant MINTER_ROLE to deployer for initial base mints
        collection.grantRole(MINTER_ROLE, msg.sender);
        console.log("Granted MINTER_ROLE to deployer:", msg.sender);

        vm.stopBroadcast();

        // Print summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("ElementalSouls:", address(collection));
        console.log("LevelUpGateway:", address(gateway));
        console.log("Backend Signer:", signerAddress);
        console.log("Deployer:", msg.sender);
    }
}
