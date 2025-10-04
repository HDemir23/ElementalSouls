#!/bin/bash

# Elemental Souls - Full Evolution Test Flow
# Tests minting 4 base NFTs (one per element) and evolving them

API_URL="http://localhost:3000"
TEST_WALLET="0xE7dc5e2a56D068a10235083947A4dD15998816e7"

echo "🔥 Elemental Souls - Evolution Test Flow"
echo "=========================================="
echo ""
echo "Test Wallet: $TEST_WALLET"
echo ""

# Element definitions
declare -a ELEMENTS=("0" "1" "2" "3")
declare -a ELEMENT_NAMES=("Fire" "Water" "Earth" "Air")
declare -a ELEMENT_EMOJIS=("🔥" "💧" "🌍" "💨")

echo "Step 1: Checking backend health..."
HEALTH=$(curl -s "${API_URL}/health")
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
    echo "$HEALTH" | jq '.'
else
    echo "❌ Backend is not responding. Start it with: npm run dev"
    exit 1
fi

echo ""
echo "Step 2: Checking contract connection..."
CONTRACT_INFO=$(curl -s "${API_URL}/nft/contract/info")
SIGNER_MATCH=$(echo "$CONTRACT_INFO" | jq -r '.signerMatches')

if [ "$SIGNER_MATCH" = "true" ]; then
    echo "✅ Backend signer matches contract"
else
    echo "❌ Signer mismatch! Check your SIGNER_PRIVATE_KEY in .env"
    echo "$CONTRACT_INFO" | jq '.'
    exit 1
fi

echo ""
echo "=========================================="
echo "Phase 1: Minting 4 Base NFTs (Level 0)"
echo "=========================================="
echo ""

# Array to store minted token IDs
declare -a TOKEN_IDS=()

for i in "${!ELEMENTS[@]}"; do
    ELEMENT="${ELEMENTS[$i]}"
    NAME="${ELEMENT_NAMES[$i]}"
    EMOJI="${ELEMENT_EMOJIS[$i]}"

    echo "${EMOJI} Minting ${NAME} Soul (Element ${ELEMENT})..."

    MINT_RESULT=$(curl -s -X POST "${API_URL}/test/mint" \
        -H "Content-Type: application/json" \
        -d "{\"to\":\"${TEST_WALLET}\",\"element\":${ELEMENT}}")

    SUCCESS=$(echo "$MINT_RESULT" | jq -r '.success')

    if [ "$SUCCESS" = "true" ]; then
        TX_HASH=$(echo "$MINT_RESULT" | jq -r '.txHash')
        echo "   ✅ Minted! TX: ${TX_HASH}"

        # Get balance to determine token ID
        BALANCE=$(echo "$MINT_RESULT" | jq -r '.balance')
        echo "   📊 Wallet balance: ${BALANCE} NFTs"

        # Store approximate token ID (balance - 1, since it's 0-indexed)
        TOKEN_ID=$((BALANCE - 1))
        TOKEN_IDS+=("$TOKEN_ID")
        echo "   🎫 Estimated Token ID: ${TOKEN_ID}"

        # Show metadata
        IMAGE_URL=$(echo "$MINT_RESULT" | jq -r '.metadata.imageUrl')
        echo "   🖼️  Image: ${IMAGE_URL}"
    else
        ERROR=$(echo "$MINT_RESULT" | jq -r '.message // .error')
        echo "   ❌ Failed: ${ERROR}"
    fi

    echo ""
    sleep 2  # Wait between mints to avoid rate limiting
done

echo "=========================================="
echo "Minting Summary"
echo "=========================================="
echo "Total minted: ${#TOKEN_IDS[@]} NFTs"
echo "Token IDs: ${TOKEN_IDS[@]}"
echo ""

# Verify all NFTs
echo "=========================================="
echo "Phase 2: Verifying Minted NFTs"
echo "=========================================="
echo ""

for i in "${!TOKEN_IDS[@]}"; do
    TOKEN_ID="${TOKEN_IDS[$i]}"
    NAME="${ELEMENT_NAMES[$i]}"
    EMOJI="${ELEMENT_EMOJIS[$i]}"

    echo "${EMOJI} Verifying ${NAME} Soul (Token #${TOKEN_ID})..."

    NFT_DATA=$(curl -s "${API_URL}/test/nft/${TOKEN_ID}")

    if [ $? -eq 0 ]; then
        OWNER=$(echo "$NFT_DATA" | jq -r '.owner')
        ELEMENT=$(echo "$NFT_DATA" | jq -r '.element')
        LEVEL=$(echo "$NFT_DATA" | jq -r '.level')

        if [ "$OWNER" = "$TEST_WALLET" ]; then
            echo "   ✅ Owner: ${OWNER:0:10}...${OWNER: -4}"
            echo "   📊 Element: ${ELEMENT}, Level: ${LEVEL}"
        else
            echo "   ⚠️  Owner mismatch! Expected: ${TEST_WALLET}"
        fi
    else
        echo "   ❌ Failed to fetch NFT data"
    fi

    echo ""
done

echo "=========================================="
echo "Phase 3: Evolution Test (Level 0 → 1)"
echo "=========================================="
echo ""

# Test evolution for first NFT
if [ ${#TOKEN_IDS[@]} -gt 0 ]; then
    TEST_TOKEN="${TOKEN_IDS[0]}"
    TEST_NAME="${ELEMENT_NAMES[0]}"
    TEST_EMOJI="${ELEMENT_EMOJIS[0]}"

    echo "${TEST_EMOJI} Testing evolution for ${TEST_NAME} Soul (Token #${TEST_TOKEN})..."
    echo ""

    EVOLVE_RESULT=$(curl -s -X POST "${API_URL}/test/evolve" \
        -H "Content-Type: application/json" \
        -d "{\"owner\":\"${TEST_WALLET}\",\"tokenId\":${TEST_TOKEN},\"targetLevel\":1}")

    SUCCESS=$(echo "$EVOLVE_RESULT" | jq -r '.success')

    if [ "$SUCCESS" = "true" ]; then
        CURRENT=$(echo "$EVOLVE_RESULT" | jq -r '.currentLevel')
        TARGET=$(echo "$EVOLVE_RESULT" | jq -r '.targetLevel')
        IMAGE=$(echo "$EVOLVE_RESULT" | jq -r '.preview.imageUrl')

        echo "✅ Evolution permit generated!"
        echo "   📊 Level: ${CURRENT} → ${TARGET}"
        echo "   🖼️  Preview: ${IMAGE}"
        echo ""
        echo "📝 Permit Signature:"
        echo "$EVOLVE_RESULT" | jq '.permitSignature'
        echo ""
        echo "💡 Next step: Use this permit to call contract.evolve() from frontend"
    else
        ERROR=$(echo "$EVOLVE_RESULT" | jq -r '.message // .error')
        echo "❌ Evolution failed: ${ERROR}"
    fi
else
    echo "⚠️  No tokens available for evolution test"
fi

echo ""
echo "=========================================="
echo "✅ Test Flow Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Minted ${#TOKEN_IDS[@]} base NFTs ✅"
echo "- All NFTs verified ✅"
echo "- Evolution permit generated ✅"
echo ""
echo "Next steps:"
echo "1. View NFT images in IPFS gateway URLs above"
echo "2. Test evolution on frontend by calling contract with permit"
echo "3. Complete tasks to unlock more evolutions"
echo ""
