# AgentLocus 🎯
**Building Trust & Privacy for Autonomous Agents**

AgentLocus is a comprehensive framework establishing an agent's "Locus" of control, trust, privacy, and identity. Built for the **Synthesis Hackathon**, it tackles the core dilemma: When AI agents transact on-chain with raw hex addresses (`0x...`), humans perceive them as untrustworthy, opaque black-box bots.

AgentLocus bridges the gap between machine execution and human counterparty trust through four core pillars:

### 1. Agents That Pay (Celo & BankR)
AgentLocus utilizes the **Celo Network** and the `ConditionalEscrow.sol` smart contract (see `/contracts`) to facilitate trustless agent-to-agent task provisioning. Payments are routed with cUSD stablecoins.

### 2. Agents That Keep Secrets (Lit Protocol)
Inter-agent communications, dataset sharing, and execution parameters shouldn't leak to public observers. We integrated **Lit Protocol** (`agent/src/secrets.js`) to seamlessly encrypt task payloads on the fly before routing.

### 3. Agents That Cooperate (Filecoin/IPFS)
Decentralized agents shouldn't rely on centralized AWS nodes. AgentLocus pushes encrypted task instructions and execution receipts to **Filecoin/IPFS**, providing an immutable, cooperative data layer for all ecosystem agents.

### 4. Agents That Trust (ENS & EAS)
We completely mask the raw `0x` execution addresses. Everywhere an agent operates, trades, or assigns tasks, it uses its `.eth` representation. We also integrated a **Celo Trust System** to track verifiable EAS (Ethereum Attestation Service) attestations. Agent A can instantly verify Agent B's historical task rating.

## Features
- **ENS-First Identity:** Converts the raw agent API wallet to `.eth` everywhere.
- **Natural Language DeFi:** Executes token swaps and interacts with escrow securely via BankR network intents.
- **Glassmorphism Dashboard:** A sleek UI displaying agent holdings, an execution terminal, and a Celo Trust verification system.

## Setup & Run

### 1. Configure the Agent's Brain
Set up your `.env` file in the `agent/` directory:
```bash
LOCUS_ENS_NAME=synthesisagent.eth
BANKR_API_KEY=bk_yourkey
BANKR_LLM_KEY=bk_yourkey
```

### 2. Run the Dashboard
```bash
cd agent
npm install
node server.js
```
The server boot on `localhost:3000`. 

### 3. Execution
Ask the agent terminal to make a trade or provision a task:
`> Provision task and lock funds for Agent B`
AgentLocus intercepts the response, encrypts the instructions via Lit, stores it on Filecoin, provisions the Celo Escrow contract with cUSD, and replaces any outputted hex addresses with your `.eth` linked name.
