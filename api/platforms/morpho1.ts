import { MarketParams, Market, AccrualPosition, MarketId } from "@morpho-org/blue-sdk";
import { createClient, http } from "viem";
import { mainnet } from "viem/chains";
import "dotenv/config";
import "@morpho-org/blue-sdk-viem/lib/augment"
import { JsonRpcProvider, Contract, getAddress } from 'ethers'
import { Client } from "viem";
import { Time } from "@morpho-org/morpho-ts";
import { fetchMarket } from "@morpho-org/blue-sdk-viem";
import { VercelRequest, VercelResponse } from '@vercel/node'


// Set up the client
const client = createClient({
  chain: mainnet,
  transport: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`),
});

// https://app.morpho.org/ethereum/market/0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64/cbbtc-usdc
const marketId =
  "0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64" as MarketId;

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

    async function fetchMarketConfig() {
  
  console.log("Fetching market config...");

const MarketParamsWithFetch = MarketParams as typeof MarketParams & {
  fetch: (id: MarketId, client: Client) => Promise<MarketParams>;
};
const config = await MarketParamsWithFetch.fetch(marketId, client);


  console.log("Collateral Token:", config.collateralToken);
  console.log("Loan Token:", config.loanToken);
  console.log("LLTV:", config.lltv);
}


async function fetchMarketData() {
  console.log("Fetching market data...");
const MarketWithFetch = Market as typeof Market & {
  fetch: (id: MarketId, client: Client) => Promise<Market>;
};
const market = await MarketWithFetch.fetch(marketId, client);  
  console.log("Market Utilization:", market.utilization);
  console.log("Market Liquidity:", market.liquidity);
  console.log("Market APY at Target:", market.apyAtTarget);
  console.log("Borrow APY:", market.borrowApy);
   console.log("Supply APY:", market.supplyApy);
 
  
  // Accrue interest to the latest timestamp
  const accruedMarket = market.accrueInterest(Time.timestamp());
  
  // Convert supply shares to assets
  const shares = 1_000000000000000000n; // 1 share
  const assets = accruedMarket.toSupplyAssets(shares);
  console.log("Supply Assets for 1 Share:", assets);
  return market.supplyApy
}
const borrow = await fetchMarketData();


    res.status(200).json({ borrow })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
