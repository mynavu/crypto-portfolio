import { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { Alchemy, Network, TokenBalancesResponse } from "alchemy-sdk";
import { formatUnits, JsonRpcProvider, Contract, getAddress } from "ethers";
import fetch from "node-fetch";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import {
  USDC_str,
  USDT_str,
  WBTC_str,
  WSOL_str,
  WETH_str,
} from "../address.ts";
import { createPublicClient, http, parseAbi, Address } from "viem";
import { mainnet } from "viem/chains";

// ======================
// ETHEREUM PROVIDER
// ======================

const provider = new JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

/* =====================================================
   CONFIG
===================================================== */

const RPC = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
if (!RPC) throw new Error("Missing RPC_URL_MAINNET");

const client = createPublicClient({
  chain: mainnet,
  transport: http(RPC),
});

// Morpho Blue core contract
const MORPHO_BLUE: Address = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

// USDC address (Ethereum)
const USDC: Address = USDC_str;
const USDT: Address = USDT_str;
const BTC: Address = WBTC_str;
const SOL: Address = WSOL_str;
const ETH: Address = WETH_str;

/* =====================================================
   ABIs
===================================================== */

const MORPHO_ABI = parseAbi([
  "function market(bytes32 id) view returns (uint128,uint128,uint128,uint128,uint128,uint128)",
  "function idToMarketParams(bytes32 id) view returns (address,address,address,address,uint256)",
]);

const IRM_ABI = parseAbi([
  "function borrowRateView((address,address,address,address,uint256),(uint128,uint128,uint128,uint128,uint128,uint128)) view returns (uint256)",
]);

/* =====================================================
   CONSTANTS
===================================================== */

const WAD = 10n ** 18n;
const SECONDS_PER_YEAR = 31536000n;

/* =====================================================
   SIMPLE MATH HELPERS
===================================================== */

const mulWad = (a: bigint, b: bigint) => (a * b) / WAD;
const divWad = (a: bigint, b: bigint) => (a * WAD) / b;

// compounding approximation
const compound = (rate: bigint, time: bigint) => {
  const x = rate * time;
  const x2 = (x * x) / (2n * WAD);
  const x3 = (x2 * x) / (3n * WAD);
  return x + x2 + x3;
};

/* =====================================================
   CORE FUNCTION
===================================================== */

export async function getMorphoAPY(
  marketIds: `0x${string}`[],
  token_address: any,
) {
  const results: {
    marketId: string;
    borrowAPY: number;
    supplyAPY: number;
  }[] = [];

  const block = await client.getBlock({ blockTag: "latest" });
  const now = block.timestamp;

  for (const id of marketIds) {
    // ---- read market + params
    const [marketRaw, paramsRaw] = await client.multicall({
      contracts: [
        {
          address: MORPHO_BLUE,
          abi: MORPHO_ABI,
          functionName: "market",
          args: [id],
        },
        {
          address: MORPHO_BLUE,
          abi: MORPHO_ABI,
          functionName: "idToMarketParams",
          args: [id],
        },
      ],
      allowFailure: false,
    });

    const params = {
      loanToken: paramsRaw[0],
      collateralToken: paramsRaw[1],
      oracle: paramsRaw[2],
      irm: paramsRaw[3],
      lltv: paramsRaw[4],
    };

    // ✅ only USDC lending markets
    if (params.loanToken.toLowerCase() !== token_address.toLowerCase())
      continue;

    const state = {
      totalSupplyAssets: marketRaw[0],
      totalBorrowAssets: marketRaw[2],
      lastUpdate: marketRaw[4],
      fee: marketRaw[5],
    };

    // ---- borrow rate from IRM
    const borrowRate = (await client.readContract({
      address: params.irm,
      abi: IRM_ABI,
      functionName: "borrowRateView",
      args: [paramsRaw, marketRaw],
    })) as bigint;

    // ---- accrue interest
    const elapsed = now - state.lastUpdate;

    const interest =
      elapsed === 0n
        ? 0n
        : mulWad(state.totalBorrowAssets, compound(borrowRate, elapsed));

    const totalBorrow = state.totalBorrowAssets + interest;
    const totalSupply = state.totalSupplyAssets + interest;

    // ---- utilization
    const utilization =
      totalSupply === 0n ? 0n : divWad(totalBorrow, totalSupply);

    // ---- APYs
    const borrowAPY = compound(borrowRate, SECONDS_PER_YEAR);

    const supplyAPY = mulWad(mulWad(borrowAPY, utilization), WAD - state.fee);

    results.push({
      marketId: id,
      borrowAPY: Number(borrowAPY) / 1e16,
      supplyAPY: Number(supplyAPY) / 1e16,
    });
  }

  return results;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const markets = [
      "0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64",
    ] as `0x${string}`[];

    const usdcApys = (await getMorphoAPY(markets, USDC)) as any;

    const usdtApys = (await getMorphoAPY(markets, USDT)) as any;
    const btcApys = (await getMorphoAPY(markets, BTC)) as any;
    const solApys = (await getMorphoAPY(markets, SOL)) as any;
    const ethApys = (await getMorphoAPY(markets, ETH)) as any;

    const usdcSupplyAPY = usdcApys[0].supplyAPY;
    const usdcBorrowAPY = usdcApys[0].borrowAPY;

    const btcSupplyAPY = btcApys[0].supplyAPY;
    const btcBorrowAPY = btcApys[0].borrowAPY;

    const usdtSupplyAPY = usdtApys[0].supplyAPY;
    const usdtBorrowAPY = usdtApys[0].borrowAPY;

    /*
  const solSupplyAPY = solApys[0].supplyAPY
  const solBorrowAPY = solApys[0].borrowAPY;
  */

    const ethSupplyAPY = ethApys[0].supplyAPY;
    const ethBorrowAPY = ethApys[0].borrowAPY;

    /*
    if (!apys) {
      res.status(400).json({ error: 'AAVE supply and borrow APR not found' })
      return
    }
*/

    res
      .status(200)
      .json({
        usdcSupplyAPY,
        usdcBorrowAPY,
        usdtSupplyAPY,
        usdtBorrowAPY,
        btcSupplyAPY,
        btcBorrowAPY,
        ethSupplyAPY,
        ethBorrowAPY,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
