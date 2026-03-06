import { VercelRequest, VercelResponse } from '@vercel/node'
import 'dotenv/config'
import { Alchemy, Network, TokenBalancesResponse } from 'alchemy-sdk'
import { formatUnits, JsonRpcProvider, Contract, getAddress } from 'ethers'
import fetch from 'node-fetch'


const provider = new JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
);

// ======================
// KAMINO (API)
// ======================

const KAMINO_BASE = "https://api.kamino.finance";

type KaminoMarket = {
  lendingMarket: string
  isPrimary: boolean
  name: string
  description: string
};


type ReserveMetrics = {
  reserve: string;
  liquidityToken: string;
  liquidityTokenMint: string;
  maxLtv: string;
  borrowApy: string;
  supplyApy: string;
  totalSupply: string;
  totalBorrow: string;
  totalBorrowUsd: string;
  totalSupplyUsd: string;
};

function isKaminoMarketArray(data: unknown): data is KaminoMarket[] {
  return (
    Array.isArray(data) &&
    data.every(
      (m) =>
        typeof m === "object" &&
        m !== null &&
        "lendingMarket" in m &&
        "isPrimary" in m
    )
  );
}


function isReserveMetricsArray(data: unknown): data is ReserveMetrics[] {
  return (
    Array.isArray(data) &&
    data.every(
      (r) =>
        typeof r === "object" &&
        r !== null &&
        "liquidityToken" in r &&
        "supplyApy" in r &&
        "borrowApy" in r
    )
  );
}


async function fetchWithRetry(url: string, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    await new Promise(r => setTimeout(r, delay));
  }
  throw new Error(`Failed to fetch ${url}`);
}

// ======================
// MAIN (YIELDS TEST)
// ======================

async function main() {

  // ===== KAMINO =====

  const marketsRes = await fetch(`${KAMINO_BASE}/kamino-market`);
  if (!marketsRes.ok) throw new Error("Failed to fetch Kamino markets");
  //console.log("marketsRes", marketsRes);

const marketsData: unknown = await marketsRes.json();
  //console.log("marketsData raw:", JSON.stringify(marketsData, null, 2));

  if (!isKaminoMarketArray(marketsData))
    throw new Error("Invalid Kamino markets response");

const mainnetMarket = marketsData.find((m) => m.isPrimary);
if (!mainnetMarket)
  throw new Error("Kamino mainnet market not found");

const marketPubkey = mainnetMarket.lendingMarket;


  // console.log("mainnetMarket", mainnetMarket);

  if (!mainnetMarket)
    throw new Error("Kamino mainnet market not found");

const reservesRes = await fetch(
  `${KAMINO_BASE}/kamino-market/${marketPubkey}/reserves/metrics`
);

  // console.log("reservesRes", reservesRes);

  if (!reservesRes.ok)
    throw new Error("Failed to fetch Kamino reserves");

  const reservesData: unknown = await reservesRes.json();
  if (!isReserveMetricsArray(reservesData))
    throw new Error("Invalid Kamino reserves response");

const usdcReserve = (reservesData as any[]).find(
  (r) => r.liquidityToken.toUpperCase() === "USDC" 
      || r.liquidityTokenMint === "yourUSDCmintAddressHere"
);

  // console.log("usdcReserve:", usdcReserve);



  if (usdcReserve) {
    const supplyApy = Number(usdcReserve.supplyApy);
    const borrowApy = Number(usdcReserve.borrowApy);

    console.log("Kamino USDC Supply APY %:", supplyApy * 100);
    console.log("Kamino USDC Borrow APY %:", borrowApy * 100);
}

}

main();


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
  // ===== KAMINO =====

  const marketsRes = await fetch(`${KAMINO_BASE}/kamino-market`);
  if (!marketsRes.ok) throw new Error("Failed to fetch Kamino markets");
  //console.log("marketsRes", marketsRes);

const marketsData: unknown = await marketsRes.json();
  //console.log("marketsData raw:", JSON.stringify(marketsData, null, 2));

  if (!isKaminoMarketArray(marketsData))
    throw new Error("Invalid Kamino markets response");

const mainnetMarket = marketsData.find((m) => m.isPrimary);
if (!mainnetMarket)
  throw new Error("Kamino mainnet market not found");

const marketPubkey = mainnetMarket.lendingMarket;


  // console.log("mainnetMarket", mainnetMarket);

  if (!mainnetMarket)
    throw new Error("Kamino mainnet market not found");

const reservesRes = await fetch(
  `${KAMINO_BASE}/kamino-market/${marketPubkey}/reserves/metrics`
);

  // console.log("reservesRes", reservesRes);

  if (!reservesRes.ok)
    throw new Error("Failed to fetch Kamino reserves");

  const reservesData: unknown = await reservesRes.json();
  if (!isReserveMetricsArray(reservesData))
    throw new Error("Invalid Kamino reserves response");

const usdcReserve = (reservesData as any[]).find(
  (r) => r.liquidityToken.toUpperCase() === "USDC" 
      || r.liquidityTokenMint === "yourUSDCmintAddressHere"
);

  // console.log("usdcReserve:", usdcReserve);



    const supplyApy = Number(usdcReserve.supplyApy);
    const borrowApy = Number(usdcReserve.borrowApy);

    console.log("Kamino USDC Supply APY %:", supplyApy * 100);
    console.log("Kamino USDC Borrow APY %:", borrowApy * 100);


    if (!supplyApy || !borrowApy) {
      res.status(400).json({ error: 'Kamino supply and borrow APR not found' })
      return
    }

    res.status(200).json({ supplyApy, borrowApy })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
