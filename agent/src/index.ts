import 'dotenv/config';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

const LOCUS_ENS_NAME = process.env.LOCUS_ENS_NAME || "locus.agent.eth";
const BANKR_API_KEY = process.env.BANKR_API_KEY;

if (!BANKR_API_KEY) {
  console.error("Missing BANKR_API_KEY in .env");
  process.exit(1);
}

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http() // Optionally use a custom RPC
});

async function main() {
  console.log(`[AgentLocus] Initializing identity for ${LOCUS_ENS_NAME}...`);
  
  // 1. Resolve ENS name to get the underlying wallet address
  let agentAddress = null;
  try {
    agentAddress = await publicClient.getEnsAddress({
      name: normalize(LOCUS_ENS_NAME),
    });
  } catch (err) {
    console.warn(`[AgentLocus] Reverting to text-based ENS fallback, failed to resolve: ${(err as Error).message}`);
  }

  if (!agentAddress) {
    console.warn(`[AgentLocus] ENS name ${LOCUS_ENS_NAME} not fully resolved on Mainnet. Fetching from Bankr API directly as fallback...`);
    try {
      const balancesRes = await fetch("https://api.bankr.bot/agent/balances", {
        headers: { "X-API-Key": BANKR_API_KEY as string }
      });
      const balancesData = await balancesRes.json();
      
      // Usually bankr returns an array of chain balances with their wallet addresses
      if (balancesData && balancesData.length > 0) {
         agentAddress = balancesData[0].address;
      }
    } catch(e) { /* ignore */ }
  }

  console.log(`[AgentLocus] Identity Linked: ${LOCUS_ENS_NAME} <-> ${agentAddress || 'Unknown'}`);

  const userPrompt = process.argv.slice(2).join(" ");
  if (!userPrompt) {
    console.log("Usage: npx tsx src/index.ts <prompt>");
    console.log("Example: npx tsx src/index.ts \"Buy 0.01 ETH of UNI\"");
    process.exit(0);
  }

  // 2. Align context with ENS identity and Uniswap Swap Rules
  const systemContext = `Your operational identity is strictly ${LOCUS_ENS_NAME}. Never refer to yourself as a hex address. If you generate logs or transaction summaries (such as Uniswap trades or token transfers), always replace your wallet address with ${LOCUS_ENS_NAME}. You are equipped with Uniswap trading capabilities via the Agent framework.`;
  const fullPrompt = `${systemContext}\nUser Request: ${userPrompt}`;

  console.log(`[AgentLocus] Executing task via Locus/Bankr routing...`);

  // 3. Execute via Bankr API (Which handles Uniswap swaps and transactions natively under the hood)
  const submitRes = await fetch("https://api.bankr.bot/agent/prompt", {
    method: "POST",
    headers: {
      "X-API-Key": BANKR_API_KEY as string,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt: fullPrompt })
  });

  const submitData = await submitRes.json();
  if (!submitData.jobId) {
    console.error("[AgentLocus] Execution failed:", submitData);
    return;
  }

  const jobId = submitData.jobId;
  console.log(`[AgentLocus] Job started (ID: ${jobId}). Polling for completion...`);

  // 4. Poll for completion
  let result;
  while (true) {
    const statusRes = await fetch(`https://api.bankr.bot/agent/job/${jobId}`, {
      headers: { "X-API-Key": BANKR_API_KEY as string }
    });
    const statusData = await statusRes.json();
    
    if (statusData.status === "completed" || statusData.status === "failed" || statusData.status === "cancelled") {
      result = statusData;
      break;
    }
    // Wait before polling again
    await new Promise(res => setTimeout(res, 2000));
  }

  // 5. Output Formatting: Replace 0x addresses with ENS names where possible
  let outputText = result.response || "No response text.";
  
  if (agentAddress) {
    // Replace the specific agent address (case insensitive)
    const regex = new RegExp(agentAddress, "gi");
    outputText = outputText.replace(regex, LOCUS_ENS_NAME);
  }

  // Generic 0x replacement for display perfection
  outputText = outputText.replace(/0x[a-fA-F0-9]{40}/g, (match: string) => {
    return `[${LOCUS_ENS_NAME} linked]`;
  });

  console.log("\n--- [AgentLocus Response] ---");
  console.log(outputText);
  console.log("-----------------------------\n");
}

main().catch(console.error);
