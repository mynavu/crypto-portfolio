import { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { JsonRpcProvider, Contract } from "ethers";

import { compound } from "../address/compound";
import { arbitrum_net, ethereum_net, optimism_net } from "../networks";

// ======================
// COMPOUND (COMET) ABI
// ======================

const CometABI = [
  "function totalSupply() view returns (uint256)",
  "function totalBorrow() view returns (uint256)",
  "function getSupplyRate(uint256 utilization) view returns (uint256)",
  "function getBorrowRate(uint256 utilization) view returns (uint256)",
];

// ======================
// PROVIDERS + ADDRESSES PER NETWORK
// Not all networks support all tokens — missing keys are simply skipped.
// Add new networks here as you implement them.
// ======================

type CompoundAddresses = Partial<Record<string, string>>;

const providerList: Record<string, [JsonRpcProvider, CompoundAddresses]> = {
  arbitrum: [arbitrum_net, compound.arbitrum],
  ethereum: [ethereum_net, compound.ethereum],
  optimism: [optimism_net, compound.optimism],
};

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

// ======================
// API HANDLER
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
    const networkResults = await Promise.allSettled(
      Object.entries(providerList).map(
        async ([networkName, [provider, tokenAddresses]]) => {
          // Only build contracts for tokens that exist on this network
          const availableComets: Array<{ token: string; comet: Contract }> =
            Object.entries(tokenAddresses)
              .filter(([, address]) => !!address)
              .map(([token, address]) => ({
                token,
                comet: new Contract(address as string, CometABI, provider),
              }));

          const tokenResults = await Promise.allSettled(
            availableComets.map(async ({ token, comet }) => {
              const [totalSupply, totalBorrow] = await Promise.all([
                comet.totalSupply(),
                comet.totalBorrow(),
              ]);

              const utilization =
                totalSupply === 0n
                  ? 0n
                  : (totalBorrow * 10n ** 18n) / totalSupply;

              const [supplyRatePerSecond, borrowRatePerSecond] =
                await Promise.all([
                  comet.getSupplyRate(utilization),
                  comet.getBorrowRate(utilization),
                ]);

              const supplyAPY =
                (1 + Number(supplyRatePerSecond) / 1e18) ** SECONDS_PER_YEAR -
                1;
              const borrowAPY =
                (1 + Number(borrowRatePerSecond) / 1e18) ** SECONDS_PER_YEAR -
                1;

              return { network: networkName, token, supplyAPY, borrowAPY };
            }),
          );

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
        console.warn(
          "Compound network fetch failed (skipping):",
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
      res
        .status(500)
        .json({ error: "All Compound networks failed to respond" });
      return;
    }

    console.log("Compound All APYS:", allAPYS);
    res.status(200).json(allAPYS);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
