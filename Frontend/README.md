# ElementalSouls Monorepo

Full-stack workspace for the ElementalSouls evolution experience. The repository bundles the Fastify backend, Next.js portal, shared typing utilities, and infrastructure helpers.

## Project layout

```
apps/
  api/        # Fastify API, BullMQ workers, Prisma schema, Vitest suites
  web/        # Next.js 14 client with RainbowKit, wagmi, shadcn/ui components
  shared/     # Shared Zod DTOs, ABIs, and EIP-712 helpers reused by both sides
infra/
  docker-compose.yml  # Postgres, Redis, optional ComfyUI stub
```

## Quick start

1. Install dependencies (pnpm 8+ is required):

   ```bash
   pnpm install
   ```

2. Copy environment templates and fill the secrets:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

3. Launch the local services (Postgres, Redis, optional ComfyUI) in another terminal:

   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

4. Prime the Prisma client and generate types:

   ```bash
   pnpm --filter @elementalsouls/api prisma:generate
   ```

5. Run the API and web app in parallel:

   ```bash
   pnpm -w dev
   ```

   - Backend runs on `http://localhost:3000`
   - Frontend dev server defaults to `http://localhost:3000`; run `pnpm --filter @elementalsouls/web dev -- --port 3001` if you need a different port

## Backend notes

- `apps/api/src/env.ts` enforces strict environment configuration. Important keys:
  - `OPERATOR_PK` – private key with `MINTER_ROLE` & `BURNER_ROLE` on the ElementalSouls contract.
  - `PERMIT_SIGNER_PK` – private key LevelUpGateway trusts for EIP-712 permits.
  - `NFT_STORAGE_TOKEN` – API token for nft.storage uploads.
  - `ADMIN_HMAC_KEY` – long random string for securing admin endpoints.
- After editing the Prisma schema (`apps/api/src/db/schema.prisma`), run `pnpm --filter @elementalsouls/api prisma:generate` again.
- Queue processing (BullMQ workers) and Redis locks are disabled automatically when `NODE_ENV=test` to keep Vitest isolated.

### Granting on-chain roles

Once the ElementalSouls contract is deployed the operator wallet must hold mint/burn privileges. Using Foundry's `cast` (replace addresses as needed):

```bash
# Grant MINTER_ROLE to the server operator
cast send 0xCollectionAddress "grantRole(bytes32,address)" \
  $(cast keccak "MINTER_ROLE") 0xOperatorAddress \
  --rpc-url $RPC_URL --private-key $ADMIN_PK

# Grant BURNER_ROLE to the operator as well
cast send 0xCollectionAddress "grantRole(bytes32,address)" \
  $(cast keccak "BURNER_ROLE") 0xOperatorAddress \
  --rpc-url $RPC_URL --private-key $ADMIN_PK
```

### Example API calls

User endpoints require a wallet signature of the JSON body hash (`sha256`). The snippet below uses `cast wallet sign` for demonstration.

```bash
BODY='{"element":"Fire","mode":"txt2img","toLevel":1}'
HASH=$(printf "%s" "$BODY" | openssl dgst -sha256 -hex | awk '{print "0x"$2}')
SIG=$(cast wallet sign --keystore ~/.foundry/keystores/user.json "$HASH")

curl -X POST http://localhost:3000/images/generate \
  -H "content-type: application/json" \
  -H "x-wallet: 0xUserAddress" \
  -H "x-sig: $SIG" \
  -d "$BODY"
```

Preparing metadata (admin HMAC secured):

```bash
ADMIN_BODY='{"wallet":"0xUserAddress","element":"Fire","level":0,"imageCid":"ipfs://..."}'
ADMIN_SIG=$(printf "%s" "$ADMIN_BODY" | openssl dgst -sha256 -hmac "$ADMIN_HMAC_KEY" -hex | awk '{print $2}')

curl -X POST http://localhost:3000/mint/prepare \
  -H "content-type: application/json" \
  -H "x-admin-hmac: $ADMIN_SIG" \
  -d "$ADMIN_BODY"
```

Requesting an evolve permit once metadata is ready:

```bash
E_BODY='{"tokenId":"1","fromLevel":0,"toLevel":1,"newUri":"ipfs://...","ttlSec":900}'
E_HASH=$(printf "%s" "$E_BODY" | openssl dgst -sha256 -hex | awk '{print "0x"$2}')
E_SIG=$(cast wallet sign --keystore ~/.foundry/keystores/user.json "$E_HASH")

curl -X POST http://localhost:3000/permits/levelup \
  -H "content-type: application/json" \
  -H "x-wallet: 0xUserAddress" \
  -H "x-sig: $E_SIG" \
  -d "$E_BODY"
```

## Frontend notes

- Environment variables live in `apps/web/.env` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RPC_URL`, etc.).
- The app integrates wagmi, RainbowKit, and shadcn-inspired primitives. Wallet signatures are requested client-side before every sensitive call.
- Hooks:
  - `useImageJob(jobId)` polls the backend queue with React Query and stops once complete.
  - `useTokens(address)` merges cached metadata with on-chain reads for the profile screen.
- The evolve wizard walks through image generation, metadata preparation, permit signing, and `safeTransferFrom` execution inside a single flow.

## Testing & linting

```bash
pnpm --filter @elementalsouls/shared test    # Shared DTO & EIP-712 specs
pnpm --filter @elementalsouls/api test       # Backend unit & route specs
pnpm --filter @elementalsouls/web test       # Frontend unit tests (Vitest + RTL)

pnpm --filter @elementalsouls/api lint       # ESLint (backend)
pnpm --filter @elementalsouls/web lint       # ESLint (frontend)
```

Playwright e2e scaffolding is available under `apps/web/tests/e2e`; enable it once the backend and chain simulators run locally.

## Demo flow (end-to-end)

1. **Mint (admin)** – generate art in the UI, copy the CID, call `/mint/prepare` and `/mint/exec` with the operator wallet.
2. **Evolve (user)** – select your token, generate upgrade art, request `/evolve/prepare`, obtain `/permits/levelup`, and execute `safeTransferFrom(..., bytesForData)` via the evolve wizard.
3. **Gateway** performs an atomic burn + mint, returning the upgraded token to the user in the same transaction.

All validation layers—owner checks, level increments, nonce & deadline enforcement—are active by default.
