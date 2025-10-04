// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IElementalSouls {
    function ownerOf(uint256 tokenId) external view returns (address);
    function levelOf(uint256 tokenId) external view returns (uint8);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

contract VerifyNFTs is Script {
    IElementalSouls constant collection = IElementalSouls(0x0a5C90D70153408Bc68dE50601581f9A0a08aB95);

    function run() external view {
        console.log("=== Fire NFT (Token #3) ===");
        try collection.ownerOf(3) returns (address owner) {
            console.log("Owner:", owner);
        } catch {
            console.log("Token #3 does not exist");
            return;
        }

        uint8 level = collection.levelOf(3);
        console.log("Level:", level);

        string memory uri = collection.tokenURI(3);
        console.log("URI:", uri);

        console.log("\n=== Air NFT (Token #4) ===");
        try collection.ownerOf(4) returns (address owner) {
            console.log("Owner:", owner);
        } catch {
            console.log("Token #4 does not exist");
            return;
        }

        level = collection.levelOf(4);
        console.log("Level:", level);

        uri = collection.tokenURI(4);
        console.log("URI:", uri);
    }
}
