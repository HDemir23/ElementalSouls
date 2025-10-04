# Repository Guidelines

## Project Structure & Module Organization
- `Frontend/` hosts the Next.js client; pages sit in `app/`, shared UI in `components/`, and hooks in `hooks/`.
- `Backend/` contains the Fastify + TypeScript API (`src/`), queue and database helpers in `src/services/` and `src/db/`, and Vitest specs under `tests/`.
- `ElementalSouls/` is the Foundry workspace for on-chain contracts (`src/`), deployment scripts in `script/`, and contract tests in `test/`.
- `Core/ElementalSouls.sol` exposes the shared contract artifact; update types here before mirroring into Foundry.

## Build, Test, and Development Commands
- Backend: `cd Backend && npm install` once, then `npm run dev` for live reload, `npm run build` to emit `dist/`, `npm run start` to run compiled output, and `npm run migrate` / `npm run seed` for database setup.
- Frontend: `cd Frontend && npm install`, `npm run dev` for a local UI, `npm run build` for production checks, and `npm run lint` to validate React code.
- Contracts: `cd ElementalSouls && forge build` to compile, `forge test` for specs, and `forge script script/Deploy.s.sol --broadcast` after exporting an RPC URL.

## Coding Style & Naming Conventions
- TypeScript and React files use Prettier defaults (2-space indent) and ESLint; run `npm run lint`/`npm run format` before committing.
- Keep component folders PascalCase, utilities camelCase, and route segments kebab-case.
- Solidity contracts should pass `forge fmt`; keep interfaces in `Core/` singular and suffix tests with `.t.sol` in Foundry.

## Testing Guidelines
- Write Vitest suites alongside new backend features in `Backend/tests/*.test.ts`; cover API edges, queue jobs, and schema guards.
- Maintain Foundry invariants; add regression tests under `ElementalSouls/test/` whenever contract logic shifts.

## Commit & Pull Request Guidelines
- Use imperative, scoped commit summaries (e.g., `Add soul evolution queue handler`); keep body lines wrapped at ~72 characters when context is needed.
- Every PR should describe motivation, list impacted modules, link relevant tickets, and attach screenshots or test logs when touching UI or contracts.
- Confirm `npm run lint`, `npm run test`, and `forge test` before requesting review; include failure context if a suite is intentionally skipped.

## Security & Configuration Tips
- Copy `Backend/.env.example` to `.env` and avoid committing secrets; rely on Docker Compose for local Postgres and Redis when possible.
- Restrict RPC keys and storage tokens to least privilege, and rotate them if broadcast scripts or queue workers are exposed.
