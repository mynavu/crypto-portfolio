import { VercelRequest, VercelResponse } from '@vercel/node'
import 'dotenv/config'
import { createSolanaRpc, address } from "@solana/kit";
import { KaminoMarket } from "@kamino-finance/klend-sdk";

const rpc = createSolanaRpc(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_KEY}`);
const marketPubkey = address("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF");
const slotDuration = 400;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Move awaits inside handler
    const [slot, market] = await Promise.all([
      rpc.getSlot().send(),
      KaminoMarket.load(rpc as any, marketPubkey, slotDuration),
    ]);

    const allAPYS = {} as any;
    for (const reserve of market!.getReserves()) {
      let validTokens = ["ETH", "SOL", "USDC", "USDT", "WBTC"];
      if (!validTokens.includes(reserve.symbol)) {
        continue
      }

      if (reserve.symbol === "BTC") {
        allAPYS['btcSupplyAPY'] = reserve.totalSupplyAPY(slot);
        allAPYS['btcBorrowAPY'] = reserve.totalBorrowAPY(slot);
        continue
      }

      allAPYS[reserve.symbol.toLowerCase() + 'SupplyAPY'] = reserve.totalSupplyAPY(slot);
      allAPYS[reserve.symbol.toLowerCase() + 'BorrowAPY'] = reserve.totalBorrowAPY(slot);
    }

    res.status(200).json(allAPYS)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}