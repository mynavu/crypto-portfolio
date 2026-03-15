import { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { JsonRpcProvider, Contract } from "ethers";

import { compound } from "../address/compound";
import {
  arbitrum_net,
  ethereum_net,
  optimism_net,
  base_net,
  linea_net,
  polygon_net,
  scroll_net,
} from "../networks";

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
  base: [base_net, compound.base],
  linea: [linea_net, compound.linea],
  polygon: [polygon_net, compound.polygon],
  scroll: [scroll_net, compound.scroll],
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
          console.log(`\n--- Testing network: ${networkName} ---`);

          const availableComets: Array<{ token: string; comet: Contract }> =
            Object.entries(tokenAddresses)
              .filter(([, address]) => !!address)
              .map(([token, address]) => {
                console.log(
                  `Creating contract for ${networkName} ${token}: ${address}`,
                );
                return {
                  token,
                  comet: new Contract(address as string, CometABI, provider),
                };
              });

          const tokenResults = await Promise.allSettled(
            availableComets.map(async ({ token, comet }) => {
              try {
                console.log(
                  `Calling totalSupply/totalBorrow for ${networkName} ${token}`,
                );

                const [totalSupply, totalBorrow] = await Promise.all([
                  comet.totalSupply(),
                  comet.totalBorrow(),
                ]);

                console.log(
                  `${networkName} ${token} totals`,
                  totalSupply.toString(),
                  totalBorrow.toString(),
                );

                const utilization =
                  totalSupply === 0n
                    ? 0n
                    : (totalBorrow * 10n ** 18n) / totalSupply;

                console.log(
                  `${networkName} ${token} utilization`,
                  utilization.toString(),
                );

                const [supplyRatePerSecond, borrowRatePerSecond] =
                  await Promise.all([
                    comet.getSupplyRate(utilization),
                    comet.getBorrowRate(utilization),
                  ]);

                console.log(
                  `${networkName} ${token} rates`,
                  supplyRatePerSecond.toString(),
                  borrowRatePerSecond.toString(),
                );

                const supplyAPY =
                  (1 + Number(supplyRatePerSecond) / 1e18) ** SECONDS_PER_YEAR -
                  1;

                const borrowAPY =
                  (1 + Number(borrowRatePerSecond) / 1e18) ** SECONDS_PER_YEAR -
                  1;

                console.log(
                  `${networkName} ${token} APY`,
                  supplyAPY,
                  borrowAPY,
                );

                return { network: networkName, token, supplyAPY, borrowAPY };
              } catch (err) {
                console.error(
                  `❌ Compound error for ${networkName} ${token}:`,
                  err,
                );
                throw err;
              }
            }),
          );

          console.log(`Finished network: ${networkName}`);

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

    console.log("\n✅ Compound All APYS:", allAPYS);

    res.status(200).json(allAPYS);
  } catch (err) {
    console.error("❌ Internal server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
