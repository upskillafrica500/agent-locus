# AgentLocus 🎯
**The ENS-First Identity & Trust Framework for Autonomous AI Agents**

AgentLocus is a comprehensive framework establishing an agent's "Locus" of control, trust, privacy, and identity. It tackles a core dilemma in AI agent operations: when AI agents transact on-chain with raw hex addresses (`0x...`), humans perceive them as untrustworthy, opaque black-box bots. 

By enforcing an ENS-first identity vector and utilizing decentralized privacy & settlement layers, AgentLocus bridges the gap between machine execution and human counterparty trust.

## Core Pillars

### 1. Agents That Pay (Celo & BankR)
AgentLocus utilizes the **Celo Network** and a `ConditionalEscrow.sol` smart contract (see `/contracts`) to facilitate trustless agent-to-agent task provisioning. Payments are executed using **cUSD** stablecoins for low-volatility, high-speed settlement.

### 2. Agents That Keep Secrets (Lit Protocol)
Inter-agent communications and task parameters should not leak to public observers. We utilize **Lit Protocol** (`agent/src/secrets.js`) to encrypt task payloads on the fly, ensuring only authorized counterparties can access sensitive instructions.

### 3. Agents That Cooperate (Filecoin/IPFS)
Decentralized agents shouldn't rely on centralized servers. AgentLocus pushes encrypted task instructions and execution receipts to **Filecoin/IPFS**, providing an immutable, cooperative data layer for all ecosystem agents.

### 4. Agents That Trust (ENS & EAS)
We completely mask the raw `0x` execution addresses. Everywhere an agent operates, trades, or assigns tasks, it uses its human-readable **.eth** representation. We also integrated a **Celo Trust System** to track verifiable **EAS** (Ethereum Attestation Service) attestations, allowing agents to rate and verify each other before transacting.

## Key Features
- **ENS-First Identity Layer:** Replaces raw wallet addresses with `.eth` names across all outputs and transaction logs.
- **Natural Language DeFi:** Execute token swaps and provision tasks securely via natural language intents.
- **Classic Institutional Dashboard:** A premium, high-contrast UI built with:
    - **Command Control:** Live terminal with ENS-masking and Lucide iconography.
    - **Live Holdings:** Real-time balance tracking across Base, Ethereum, and Celo.
    - **Trade History:** Filterable execution logs.
    - **Celo Trust Deck:** Manage escrows and verify agent attestations on Celo.
- **Privacy-Preserving Infrastructure:** Native integration with Lit Protocol and Filecoin for secure, decentralized data handling.

## Getting Started

### 1. Configuration
Create a `.env` file in the `agent/` directory:
```bash
LOCUS_ENS_NAME=youragent.eth
BANKR_API_KEY=your_bankr_api_key
BANKR_LLM_KEY=your_bankr_llm_key
```

### 2. Installation & Execution
```bash
cd agent
npm install
node server.js
```
The dashboard will be available at `http://localhost:3000`.

## Built By
**[Upskill Africa](https://github.com/Upskill-Africa)** — Empowering the next generation of AI and Web3 builders.

