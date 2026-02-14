import { VercelRequest, VercelResponse } from '@vercel/node'
import 'dotenv/config'
import { Alchemy, Network, TokenBalancesResponse } from 'alchemy-sdk'
import { formatUnits, JsonRpcProvider, Contract, getAddress } from 'ethers'
import fetch from 'node-fetch'
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import {
  createPublicClient,
  http,
  parseAbi,
  Address,
} from "viem";
import { mainnet } from "viem/chains";


// ======================
// ETHEREUM PROVIDER
// ======================

const provider = new JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
);

// ======================
// COMPOUND (COMET)
// ======================

const COMET_ADDRESS = '0xc3d688B66703497DAA19211EEdff47f25384cdc3';

const CometABI = [
  "function totalSupply() view returns (uint256)",
  "function totalBorrow() view returns (uint256)",
  "function getUtilization() view returns (uint256)",
  "function getSupplyRate(uint256 utilization) view returns (uint256)",
  "function getBorrowRate(uint256 utilization) view returns (uint256)"
];

const comet = new Contract(COMET_ADDRESS, CometABI, provider);

// ======================
// AAVE
// ======================

const AAVE_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const USDC = getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

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
   )`
];

const pool = new Contract(AAVE_POOL, AavePoolABI, provider);

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
const MORPHO_BLUE: Address =
  "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

// USDC address (Ethereum)
const USDC1: Address =
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

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

export async function getMorphoUSDCAPY(
  marketIds: `0x${string}`[]
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
        { address: MORPHO_BLUE, abi: MORPHO_ABI, functionName: "market", args: [id] },
        { address: MORPHO_BLUE, abi: MORPHO_ABI, functionName: "idToMarketParams", args: [id] },
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
    if (params.loanToken.toLowerCase() !== USDC1.toLowerCase())
      continue;

    const state = {
      totalSupplyAssets: marketRaw[0],
      totalBorrowAssets: marketRaw[2],
      lastUpdate: marketRaw[4],
      fee: marketRaw[5],
    };

    // ---- borrow rate from IRM
    const borrowRate = await client.readContract({
      address: params.irm,
      abi: IRM_ABI,
      functionName: "borrowRateView",
      args: [paramsRaw, marketRaw],
    }) as bigint;

    // ---- accrue interest
    const elapsed = now - state.lastUpdate;

    const interest =
      elapsed === 0n
        ? 0n
        : mulWad(
            state.totalBorrowAssets,
            compound(borrowRate, elapsed)
          );

    const totalBorrow = state.totalBorrowAssets + interest;
    const totalSupply = state.totalSupplyAssets + interest;

    // ---- utilization
    const utilization =
      totalSupply === 0n
        ? 0n
        : divWad(totalBorrow, totalSupply);

    // ---- APYs
    const borrowAPY = compound(borrowRate, SECONDS_PER_YEAR);

    const supplyAPY = mulWad(
      mulWad(borrowAPY, utilization),
      WAD - state.fee
    );

    results.push({
      marketId: id,
      borrowAPY: Number(borrowAPY) / 1e16,
      supplyAPY: Number(supplyAPY) / 1e16,
    });
  }

  return results;
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
  // MORPHO
    const markets = [
    "0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64",
  ] as `0x${string}`[];

  const apys = await getMorphoUSDCAPY(markets);

  console.log("Morpho APY",apys);
  // ===== COMPOUND =====
  const totalSupply = await comet.totalSupply();
  const totalBorrow = await comet.totalBorrow();

  const utilization = (totalBorrow * 10n ** 18n) / totalSupply;

  const supplyRatePerSecond = await comet.getSupplyRate(utilization);
  const borrowRatePerSecond = await comet.getBorrowRate(utilization);

  console.log("Compound Supply Rate:", supplyRatePerSecond.toString());
  console.log("Compound Borrow Rate:", borrowRatePerSecond.toString());

  // ===== AAVE =====
  const reserveData = await pool.getReserveData(USDC);

  const liquidityRate = reserveData.currentLiquidityRate;
  const variableBorrowRate = reserveData.currentVariableBorrowRate;

  const supplyAPR = Number(liquidityRate) / 1e27;
  const borrowAPR = Number(variableBorrowRate) / 1e27;

  console.log("Aave Supply APR:", supplyAPR);
  console.log("Aave Borrow APR:", borrowAPR);





}

main();



type Token = {
    address: string
    symbol: string | null
    decimals: number | null
    logo: string | null
    balance: string
}

type PortfolioResponse = {
    tokens: Token[]
}

type ErrorResponse = { error: string }

type PortfolioApiResponse = PortfolioResponse | ErrorResponse

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Handle root path
  if (req.url === '/api' || req.url === '/api/') {
    res.status(200).send('Backend running' as any)
    return
  }


if (req.url?.startsWith('/api/portfolio')) {
  try {
    const { address, chainId } = req.query

    if (!address || !chainId) {
      res.status(400).json({ error: 'address and chainId required' })
      return
    }

    const alchemyChains: Record<number, Network> = {
      1: Network.ETH_MAINNET,
      10: Network.OPT_MAINNET,
      42161: Network.ARB_MAINNET,
      8453: Network.BASE_MAINNET,
      56: Network.BNB_MAINNET,
      137: Network.MATIC_MAINNET,
      43114: Network.AVAX_MAINNET,
      250: Network.FANTOM_MAINNET,
      324: Network.ZKSYNC_MAINNET,
      1101: Network.POLYGONZKEVM_MAINNET,
      59144: Network.LINEA_MAINNET,
      534352: Network.SCROLL_MAINNET,
      7777777: Network.ZORA_MAINNET,
      5000: Network.MANTLE_MAINNET,
      592: Network.ASTAR_MAINNET,
      42220: Network.CELO_MAINNET,
      100: Network.GNOSIS_MAINNET,
      81457: Network.BLAST_MAINNET,
    }

    const nativeTokenInfo: Record<number, { symbol: string; decimals: number }> = {
      1: { symbol: 'ETH', decimals: 18 },
      10: { symbol: 'ETH', decimals: 18 },
      42161: { symbol: 'ETH', decimals: 18 },
      8453: { symbol: 'ETH', decimals: 18 },
      56: { symbol: 'BNB', decimals: 18 },
      137: { symbol: 'MATIC', decimals: 18 },
      43114: { symbol: 'AVAX', decimals: 18 },
      250: { symbol: 'FTM', decimals: 18 },
      324: { symbol: 'ETH', decimals: 18 },
      1101: { symbol: 'ETH', decimals: 18 },
      59144: { symbol: 'ETH', decimals: 18 },
      534352: { symbol: 'ETH', decimals: 18 },
      7777777: { symbol: 'ETH', decimals: 18 },
      5000: { symbol: 'MNT', decimals: 18 },
      592: { symbol: 'ASTR', decimals: 18 },
      42220: { symbol: 'CELO', decimals: 18 },
      100: { symbol: 'xDAI', decimals: 18 },
      81457: { symbol: 'ETH', decimals: 18 },
    }

    const network = alchemyChains[Number(chainId)]

    type AlchemyTokenBalance = TokenBalancesResponse["tokenBalances"][number]

    if (network) {
      const alchemy = new Alchemy({ 
        apiKey: process.env.ALCHEMY_KEY!, 
        network: network 
      })
      
      // Get native token balance
      const nativeBalance = await alchemy.core.getBalance(address as string)
      const nativeToken = nativeTokenInfo[Number(chainId)]
      
      const tokens: Token[] = []
      
      // Add native token if balance > 0
      if (nativeBalance.toString() !== '0') {
        tokens.push({
          address: '0x0000000000000000000000000000000000000000',
          symbol: nativeToken.symbol,
          decimals: nativeToken.decimals,
          logo: null,
          balance: formatUnits(nativeBalance.toString(), nativeToken.decimals)
        })
      }
      
      // Get ERC-20 token balances
      const balances: TokenBalancesResponse = await alchemy.core.getTokenBalances(address as string)
      
      const detailed: Token[] = await Promise.all(
        balances.tokenBalances
          .filter((t: AlchemyTokenBalance) => t.tokenBalance && BigInt(t.tokenBalance) > 0n)
          .map(async (t: AlchemyTokenBalance): Promise<Token> => {
            const meta = await alchemy.core.getTokenMetadata(t.contractAddress)
            return {
              address: t.contractAddress,
              symbol: meta.symbol,
              decimals: meta.decimals,
              logo: meta.logo,
              balance: formatUnits(
                BigInt(t.tokenBalance!),
                meta.decimals ?? 18
              ),
            }
          })
      )
      
      tokens.push(...detailed)
      
      res.status(200).json({ tokens })
      return
    }

    res.status(200).json({ tokens: [] })
    return
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
    return
  }
}

  res.status(404).json({ error: 'Not found' })
}