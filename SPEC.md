# Technical Specification: AgentLocus

## 1. Architecture Stack
- **Agent Runtime:** OpenClaw / Claude Code CLI.
- **Identity Layer:** ENS (Ethereum Name Service) via Viem/ethers.js.
- **Wallet/Execution:** Bankr API (Base/Ethereum).
- **DeFi Layer:** Uniswap V4 API / `uniswap-ai` plugin.
- **Frontend/Testing:** React/Next.js locally tested via `gstack` persistent browser.
- **Payments:** Locus (paywithlocus.com) integration.

## 2. Data Flow
1. **Initialization:** Agent reads `LOCUS_ENS_NAME` from environment variables.
2. **Resolution:** Agent uses an RPC to resolve the ENS name to its underlying Bankr wallet address.
3. **Action Trigger:** User prompts agent: "Buy 0.01 ETH of UNI".
4. **Execution:** Agent uses `uniswap-ai` to calculate the route, and `bankr` to sign/execute the transaction.
5. **Output Formatting:** Agent formats the successful transaction log: `locus.agent.eth successfully swapped 0.01 ETH for UNI.`

## 3. Implementation Steps (Timeline)
- **Hour 1-3:** Configure Bankr wallet and register/assign an ENS name to the generated `0x` address on a testnet (or Base/Mainnet if funded).
- **Hour 4-8:** Write the Node.js/Python script that binds the ENS name to the Agent's prompt context.
- **Hour 9-14:** Integrate `uniswap-ai` so the agent can execute a swap.
- **Hour 15-20:** Build a minimalist frontend displaying the agent's ENS profile and transaction history.
- **Hour 20-24:** Record demo video, write README, and submit to synthesis.md.
