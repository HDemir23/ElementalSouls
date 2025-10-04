# GEMINI.md - Elemental Souls

This document provides a comprehensive overview of the Elemental Souls project, designed to be used as a context for future interactions with the Gemini CLI.

## Project Overview

Elemental Souls is a gamified Soulbound NFT system built on the Monad blockchain. Users mint elemental companions (Fire, Water, Earth, Air) that evolve by completing real-world and on-chain tasks. Each evolution generates a unique AI-generated image, while maintaining the core elemental identity of the soul.

The project is divided into three main components:

1.  **ElementalSouls (Smart Contract):** A Foundry-based Solidity project that implements the core NFT logic, including minting, evolution, and soul-binding.
2.  **Backend (API):** A Node.js (Fastify) application that manages tasks, generates AI images, and provides a secure EIP-712 signature service for NFT evolution.
3.  **Frontend (Web App):** A Next.js application that provides the user interface for minting, viewing, and evolving Elemental Souls.

## Building and Running

### 1. ElementalSouls (Smart Contract)

The smart contract is a Foundry project.

*   **Build:** `forge build`
*   **Test:** `forge test`
*   **Deploy:** `forge script script/ElementalSouls.s.sol:ElementalSoulsScript --rpc-url $MONAD_RPC_URL --broadcast`

### 2. Backend (API)

The backend is a Node.js application.

*   **Install Dependencies:** `npm install`
*   **Run in Development:** `npm run dev`
*   **Run in Production:** `npm start`
*   **Run with Docker:** `docker-compose up -d`

### 3. Frontend (Web App)

The frontend is a Next.js application.

*   **Install Dependencies:** `npm install`
*   **Run in Development:** `npm run dev`
*   **Run in Production:** `npm start`

## Development Conventions

### Smart Contract

*   **Language:** Solidity
*   **Framework:** Foundry
*   **Style:** The contract follows standard Solidity best practices, with a focus on security and gas optimization. It uses OpenZeppelin contracts for common patterns like `AccessControl` and `ReentrancyGuard`.

### Backend

*   **Language:** TypeScript
*   **Framework:** Fastify
*   **Style:** The backend follows a standard Node.js project structure, with a clear separation of concerns between routes, services, and database logic. It uses `viem` for all blockchain interactions.

### Frontend

*   **Language:** TypeScript
*   **Framework:** Next.js (App Router)
*   **Style:** The frontend uses `wagmi` and `RainbowKit` for wallet integration, and `TailwindCSS` for styling. It follows modern React best practices, with a focus on component-based architecture.
