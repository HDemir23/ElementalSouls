// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ElementalSouls} from "../src/ElementalSouls.sol";

contract ElementalSoulsScript is Script {
    ElementalSouls public elementalSouls;

    function run() public {
        // Get the deployer private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the ElementalSouls contract
        elementalSouls = new ElementalSouls();

        vm.stopBroadcast();

        // Log the deployed contract address
        console.log("ElementalSouls deployed at:", address(elementalSouls));
    }
}