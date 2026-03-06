import { VercelRequest, VercelResponse } from '@vercel/node'
import 'dotenv/config'
import { formatUnits, JsonRpcProvider, Contract, getAddress } from 'ethers'

// ======================
// ETHEREUM PROVIDER
// ======================

const provider = new JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
);

// ======================
// COMPOUND (COMET)
// ======================
// https://app.compound.finance/markets
const cUSDC = '0xc3d688B66703497DAA19211EEdff47f25384cdc3';
const cETH  = '0xA17581A9E3356d9A858b789D68B4d866e593aE94';
const cUSDT = '0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840';
const cWBTC = '0xe85Dc543813B8c2CFEaAc371517b925a166a9293';

const CometABI = [
  "function totalSupply() view returns (uint256)",
  "function totalBorrow() view returns (uint256)",
  "function getUtilization() view returns (uint256)",
  "function getSupplyRate(uint256 utilization) view returns (uint256)",
  "function getBorrowRate(uint256 utilization) view returns (uint256)"
];

const usdcComet = new Contract(cUSDC, CometABI, provider);
const usdtComet = new Contract(cUSDT, CometABI, provider);
const ethComet = new Contract(cETH, CometABI, provider);
const wbtcComet = new Contract(cWBTC, CometABI, provider);

const cometList = {usdc: usdcComet, usdt: usdtComet, eth: ethComet, wbtc: wbtcComet};

// ======================
// API HANDLER
// ======================

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

const results = await Promise.all(
  Object.entries(cometList).map(async ([name, comet]) => {
    const [totalSupply, totalBorrow] = await Promise.all([
      comet.totalSupply(),
      comet.totalBorrow(),
    ]);
    const utilization = totalSupply === 0n ? 0n : (totalBorrow * 10n ** 18n) / totalSupply;
    const [supplyRatePerSecond, borrowRatePerSecond] = await Promise.all([
      comet.getSupplyRate(utilization),
      comet.getBorrowRate(utilization),
    ]);
    const secondsPerYear = 365 * 24 * 60 * 60;
    const supplyAPY = (1 + Number(supplyRatePerSecond) / 1e18) ** secondsPerYear - 1;
    const borrowAPY = (1 + Number(borrowRatePerSecond) / 1e18) ** secondsPerYear - 1;
    const key = name === 'wbtc' ? 'btc' : name;
    return { key, supplyAPY, borrowAPY };
  })
);
const allAPYS = Object.fromEntries(
  results.flatMap(({ key, supplyAPY, borrowAPY }) => [
    [key + 'SupplyAPY', supplyAPY],
    [key + 'BorrowAPY', borrowAPY],
  ])
);



/*
    if (!supplyAPY || !borrowAPY) {
      res.status(400).json({ error: 'Compound supply and borrow APR not found' })
      return
    }
*/

    res.status(200).json(allAPYS)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
