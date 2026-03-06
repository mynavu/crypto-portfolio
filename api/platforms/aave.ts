import { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { JsonRpcProvider, Contract, getAddress } from "ethers";
import { USDC_str, USDT_str, WBTC_str, WSOL_str, WETH_str } from "../address";

// ======================
// ETHEREUM PROVIDER
// ======================

const provider = new JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// ======================
// AAVE
// ======================

const AAVE_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const USDC = getAddress(USDC_str);
const USDT = getAddress(USDT_str);
const WBTC = getAddress(WBTC_str);
const WETH = getAddress(WETH_str);

const addressList = { usdc: USDC, usdt: USDT, btc: WBTC, eth: WETH };

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

const pool = new Contract(AAVE_POOL, AavePoolABI, provider);

// ======================
// API HANDLER
// ======================

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
    const results = await Promise.all(
      Object.entries(addressList).map(async ([name, address]) => {
        const reserveData = await pool.getReserveData(address);
        const liquidityRate = reserveData.currentLiquidityRate;
        const variableBorrowRate = reserveData.currentVariableBorrowRate;
        const supplyAPR = Number(liquidityRate) / 1e27;
        const borrowAPR = Number(variableBorrowRate) / 1e27;
        const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
        const supplyAPY =
          (1 + supplyAPR / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1;
        const borrowAPY =
          (1 + borrowAPR / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1;
        return { name, supplyAPY, borrowAPY };
      }),
    );

    const allAPYS = Object.fromEntries(
      results.flatMap(({ name, supplyAPY, borrowAPY }) => [
        [name + "SupplyAPY", supplyAPY],
        [name + "BorrowAPY", borrowAPY],
      ]),
    );

    if (!allAPYS) {
      res.status(400).json({ error: "AAVE supply and borrow APY not found" });
      return;
    }

    res.status(200).json(allAPYS);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
