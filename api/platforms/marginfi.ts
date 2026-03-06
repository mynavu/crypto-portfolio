
import { VercelRequest, VercelResponse } from '@vercel/node'
import { Connection, Keypair } from "@solana/web3.js";

import { MarginfiClient, getConfig } from "@mrgnlabs/marginfi-client-v2";
import { NodeWallet } from "@mrgnlabs/mrgn-common";

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

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");









  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    
const wallet = new NodeWallet(Keypair.generate());
const config = getConfig("production");
const client = await MarginfiClient.fetch(config, wallet, connection);

const bank = client.getBankByTokenSymbol("USDC");
if (!bank) throw new Error("USDC bank not found");

const supplyAPY = bank.computeInterestRates().lendingRate.toNumber();
const borrowAPY = bank.computeInterestRates().borrowingRate.toNumber();



    if (!supplyAPY || !borrowAPY) {
      res.status(400).json({ error: 'SOLEND supply and borrow APR not found' })
      return
    }

    res.status(200).json({ supplyAPY, borrowAPY })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}