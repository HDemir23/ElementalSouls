#!/bin/bash

# Test Mint Script for Elemental Souls
# Creates 4 base NFTs (one for each element)

API_URL="http://localhost:3000"
TEST_WALLET="0xE7dc5e2a56D068a10235083947A4dD15998816e7"

echo "🔥 Elemental Souls - Test Mint Script"
echo "======================================"
echo ""

# First, we need to login with SIWE to get JWT token
# For testing, let's create a simple test token generator

echo "Step 1: Testing available tasks..."
curl -s "${API_URL}/tasks/available?level=0" | jq '.'

echo ""
echo "Step 2: Checking mint eligibility..."
curl -s "${API_URL}/mint/check/${TEST_WALLET}" | jq '.'

echo ""
echo "Step 3: Getting EIP-712 domain..."
curl -s "${API_URL}/nft/eip712/domain" | jq '.'

echo ""
echo "=========================================="
echo "To mint NFTs, you need to:"
echo "1. Create SIWE signature with your wallet"
echo "2. Login to get JWT token"
echo "3. Call mint endpoints with token"
echo ""
echo "For now, let's test the mint preparation endpoint:"
echo ""

# Test elements
ELEMENTS=("0" "1" "2" "3")
ELEMENT_NAMES=("Fire" "Water" "Earth" "Air")

for i in "${!ELEMENTS[@]}"; do
    echo "Testing ${ELEMENT_NAMES[$i]} (Element ${ELEMENTS[$i]})..."
    echo "This would mint a ${ELEMENT_NAMES[$i]} soul if authenticated"
    echo ""
done

echo "Next steps:"
echo "1. Install a wallet extension (MetaMask, Rainbow, etc.)"
echo "2. Connect wallet to Monad testnet"
echo "3. Sign SIWE message to authenticate"
echo "4. Mint NFTs through authenticated endpoints"
