import { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { JsonRpcProvider, Contract, getAddress } from "ethers";

import { aave } from "../address/aave";

import { USDC_str, USDT_str, WBTC_str, WETH_str } from "../address";
import { AAVE_POOLS } from "../pools/aave";
import {
  arbitrum_net,
  ethereum_net,
  optimism_net,
  avalanche_net,
  base_net,
  polygon_net,
} from "../networks";

// ======================
// PROVIDERS + POOLS PER NETWORK
// ======================

const providerList: Record<string, [JsonRpcProvider, string, Object]> = {
  arbitrum: [arbitrum_net, AAVE_POOLS.arbitrum, aave.arbitrum],
  ethereum: [ethereum_net, AAVE_POOLS.ethereum, aave.ethereum],
  optimism: [optimism_net, AAVE_POOLS.optimism, aave.optimism],
  avalanche: [avalanche_net, AAVE_POOLS.avalanche, aave.avalanche],
  base: [base_net, AAVE_POOLS.base, aave.base],
  polygon: [polygon_net, AAVE_POOLS.polygon, aave.polygon],
};

// ======================
// TOKENS
// ======================

const addressList = {
  usdc: getAddress(USDC_str),
  usdt: getAddress(USDT_str),
  btc: getAddress(WBTC_str),
  eth: getAddress(WETH_str),
};

// ======================
// AAVE ABI
// ======================

const AavePoolABI = [
  `function getReserveData(address asset)
   view returns (
     tuple(
       uint256 configuration,
       uint128 liquidityIndex,
       uint128 currentLiquidityRate,
       uint128 variableBorrowIndex,
       uint128 currentVariableBorrowRate,
       uint128 currentStableBorrowRate,
       uint40 lastUpdateTimestamp,
       address aTokenAddress,
       address stableDebtTokenAddress,
       address variableDebtTokenAddress,
       address interestRateStrategyAddress,
       uint8 id
     )
   )`,
];

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

// ======================
// HANDLER
// ======================

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    // Use allSettled so one broken network (e.g. Alchemy 403) doesn't crash everything
    const networkResults = await Promise.allSettled(
      Object.entries(providerList).map(
        async ([networkName, [provider, poolAddress, tokenAddress]]) => {
          const pool = new Contract(poolAddress, AavePoolABI, provider);

          const tokenResults = await Promise.allSettled(
            Object.entries(tokenAddress).map(async ([name, address]) => {
              const reserveData = await pool.getReserveData(address);

              const supplyAPR = Number(reserveData.currentLiquidityRate) / 1e27;
              const borrowAPR =
                Number(reserveData.currentVariableBorrowRate) / 1e27;

              const supplyAPY =
                (1 + supplyAPR / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1;
              const borrowAPY =
                (1 + borrowAPR / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1;

              return {
                network: networkName,
                token: name,
                supplyAPY,
                borrowAPY,
              };
            }),
          );

          // Filter to only successful token fetches
          return tokenResults
            .filter(
              (
                r,
              ): r is PromiseFulfilledResult<{
                network: string;
                token: string;
                supplyAPY: number;
                borrowAPY: number;
              }> => r.status === "fulfilled",
            )
            .map((r) => r.value);
        },
      ),
    );

    const allAPYS: Record<string, number> = {};

    for (const networkResult of networkResults) {
      if (networkResult.status === "rejected") {
        // Log which network failed but continue building the response
        console.warn(
          "Network fetch failed (skipping):",
          networkResult.reason?.message ?? networkResult.reason,
        );
        continue;
      }

      for (const {
        network,
        token,
        supplyAPY,
        borrowAPY,
      } of networkResult.value) {
        allAPYS[`${network}_${token}_supplyAPY`] = supplyAPY;
        allAPYS[`${network}_${token}_borrowAPY`] = borrowAPY;
      }
    }

    if (!Object.keys(allAPYS).length) {
      res.status(500).json({ error: "All networks failed to respond" });
      return;
    }

    // console.log("AAVE All APYS:", allAPYS);
    res.status(200).json(allAPYS);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
