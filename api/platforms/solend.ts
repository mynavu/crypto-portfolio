
import { VercelRequest, VercelResponse } from '@vercel/node'
import { Connection, PublicKey } from "@solana/web3.js";

import * as solend from "@solendprotocol/solend-sdk";
import { fetchPoolMetadata, parseReserve } from "@solendprotocol/solend-sdk";





export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);








  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
  const USDC_RESERVE = "BgxfHJDzm44T92au21GsiyW3Bw5LejDzwziEZG8vEKFu";

const response = await fetch("https://api.solend.fi/markets/configs?scope=all&deployment=production");
const markets = await response.json();

/*
const mainPool = markets.find((m: any) => m.address === "4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY");
const usdcReserve = mainPool.reserves.find((r: any) => r.liquidityToken.symbol === "USDC");
console.log("USDC reserve address:", usdcReserve.address);

 
  
  const statsResponse = await fetch(`https://api.solend.fi/v1/reserves?ids=${USDC_RESERVE}`);
  const stats = await statsResponse.json();

  
  
  console.log(JSON.stringify(stats).slice(0, 500)); // remove after debugging
  
  const reserve = stats.results[0];
  const supplyAPY = reserve.rates.supplyInterest;
  const borrowAPY = reserve.rates.borrowInterest;




    if (!supplyAPY || !borrowAPY) {
      res.status(400).json({ error: 'SOLEND supply and borrow APR not found' })
      return
    }
      */

    res.status(200).json(markets)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}