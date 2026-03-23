const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const secretsManager = require('./src/secrets');

// Vanilla JS dotenv parser
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.trim().split('=');
    if (parts.length >= 2) {
      process.env[parts[0]] = parts.slice(1).join('=');
    }
  });
} catch(e) { console.log("No .env found or failed to parse"); }

const BANKR_API_KEY = process.env.BANKR_API_KEY;
const LOCUS_ENS_NAME = process.env.LOCUS_ENS_NAME || "synthesisagent.eth";

function fetchBankR(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'X-API-Key': BANKR_API_KEY,
        ...options.headers
      }
    };
    const req = https.request(reqOptions, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve({ error: "Parse error" }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// MIME type map for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  
  // Route pages
  const pages = ['/', '/index.html', '/dashboard', '/history', '/celo', '/docs'];
  if (pages.includes(urlPath) || urlPath === '/dashboard.html' || urlPath === '/history.html' || urlPath === '/celo.html' || urlPath === '/docs.html') {
    let fileName = 'index.html';
    if (urlPath.includes('dashboard')) fileName = 'index.html';
    else if (urlPath.includes('history')) fileName = 'history.html';
    else if (urlPath.includes('celo')) fileName = 'celo.html';
    else if (urlPath.includes('docs')) fileName = 'docs.html';
    
    const filePath = path.join(__dirname, 'public', fileName);
    return fs.readFile(filePath, (err, content) => {
      if (err) { res.writeHead(404); return res.end("Not found"); }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  }
  
  // Serve other static files from /public
  const filePath = path.join(__dirname, 'public', urlPath);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) { return false; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
  return true;
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.writeHead(200).end();

  // API Routes
  if (req.url.startsWith('/api/')) {
    // /api/balances
    if (req.method === 'GET' && req.url === '/api/balances') {
      try {
        const data = await fetchBankR('https://api.bankr.bot/agent/balances');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(500);
        return res.end(JSON.stringify({ error: e.message }));
      }
    }

    // /api/config - provide ENS name to frontend
    if (req.method === 'GET' && req.url === '/api/config') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ensName: LOCUS_ENS_NAME }));
    }

    // /api/prompt
    if (req.method === 'POST' && req.url === '/api/prompt') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { prompt } = JSON.parse(body);
          
          let processedPrompt = prompt;
          let enhancedOutput = "";

          // Detect if prompt is about Escrow or Secrecy
          if (prompt.toLowerCase().includes("provision task") || prompt.toLowerCase().includes("lock funds")) {
              const encryptedTask = await secretsManager.encryptData(prompt);
              const storageResult = await secretsManager.pushToFilecoin(encryptedTask);
              
              enhancedOutput = `\n\n> [SECRET] Task encrypted via Lit Protocol and stored on Filecoin/IPFS (CID: ${storageResult.cid})`;
              processedPrompt = `${prompt} [SYSTEM: Execute this payment specifically using cUSD on the Celo network via the ConditionalEscrow contract. The task meta CID is ${storageResult.cid}]`;
          }

          const systemContext = `Your operational identity is strictly ${LOCUS_ENS_NAME}. Never refer to yourself as a hex address.
If asked to provision tasks or lock funds, ALWAYS swap to cUSD on Celo via Uniswap V3/V4 pools if needed and interact with the Celo Escrow contract. Provide a verbose output of routing via Celo.
Always replace your wallet address with ${LOCUS_ENS_NAME}.`;
          
          const submitData = await fetchBankR('https://api.bankr.bot/agent/prompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: `${systemContext}\nUser Request: ${processedPrompt}` })
          });

          if (!submitData.jobId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify(submitData));
          }

          let result;
          while (true) {
            const statusData = await fetchBankR(`https://api.bankr.bot/agent/job/${submitData.jobId}`);
            if (statusData.status === "completed" || statusData.status === "failed" || statusData.status === "cancelled") {
              result = statusData;
              break;
            }
            await new Promise(r => setTimeout(r, 2000));
          }

          let outputText = result.response || "No response";
          outputText = outputText.replace(/0x[a-fA-F0-9]{40}/g, `[${LOCUS_ENS_NAME} linked]`);
          outputText += enhancedOutput;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result: outputText, data: result.data }));
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    
    // 404 for unknown API routes
    res.writeHead(404);
    return res.end(JSON.stringify({ error: "API route not found" }));
  }

  // Static file serving
  serveStatic(req, res);
});

server.listen(3000, () => {
  console.log("AgentLocus Dashboard listening on http://localhost:3000");
});
