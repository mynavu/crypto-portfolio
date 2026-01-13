import cors from 'cors'
import express from 'express'

import { Request, Response } from 'express'


import 'dotenv/config'


import { Alchemy, Network } from 'alchemy-sdk'
import { JsonRpcProvider, Contract, formatUnits } from 'ethers'

const app = express()
const port = 8000

app.use(cors())
app.use(express.json())


/* ---------------- BSC (RPC) ---------------- */

const BSC_RPC = 'https://bsc-dataseed.binance.org'

const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955'

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]

/* ---------------- Routes ---------------- */

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



app.get('/', (_: Request, res: Response): void => {
  res.send('Backend running')
})

app.get('/portfolio', async (req: Request, res: Response<PortfolioApiResponse>): Promise<Response<PortfolioApiResponse>> => {
  try {
    const { address, chainId } = req.query

    if (!address || !chainId) {
      return res.status(400).json({ error: 'address and chainId required' })
    }

    const alchemyChains: Record<number, Network> = {
    1: Network.ETH_MAINNET,                 // Ethereum
    10: Network.OPT_MAINNET,                // Optimism
    137: Network.MATIC_MAINNET,             // Polygon PoS
    42161: Network.ARB_MAINNET,             // Arbitrum One
    8453: Network.BASE_MAINNET,             // Base
    324: Network.ZKSYNC_MAINNET,            // zkSync Era
    1101: Network.POLYGONZKEVM_MAINNET,    // Polygon zkEVM
    59144: Network.LINEA_MAINNET,            // Linea
    534352: Network.SCROLL_MAINNET,          // Scroll
    }

    const network = alchemyChains[Number(chainId)]

    /* ---------- ALCHEMY SUPPORTED CHAINS ---------- */


    type tokenBalance = {
        contractAddress: string
        tokenBalance: string | null
    }

    type alchemyResponse = {
        tokenBalances: tokenBalance[]
    }

    if (network) {
        const alchemy = new Alchemy({ apiKey: process.env.ALCHEMY_KEY!, network: network });
        const balances = await alchemy.core.getTokenBalances(address as string)

        const detailed: Token[] = await Promise.all(
        balances.tokenBalances
          .filter((t: tokenBalance) => t.tokenBalance && BigInt(t.tokenBalance) > 0n)
          .map(async (t: tokenBalance): Promise<Token> => {
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

      return res.json({ tokens: detailed })
    }

    /* ---------- BNB CHAIN ---------- */
    if (Number(chainId) === 56) {
      const provider = new JsonRpcProvider(BSC_RPC)

      const usdt = new Contract(USDT_BSC, ERC20_ABI, provider)

      const [rawBalance, decimals, symbol] = await Promise.all([
        usdt.balanceOf(address),
        usdt.decimals(),
        usdt.symbol(),
      ])

    const balance = formatUnits(rawBalance, decimals)

    const hasBalance = rawBalance > 0n

    const tokens = hasBalance
    ? [
        {
            address: USDT_BSC,
            symbol,
            decimals: Number(decimals), // ensure number
            logo:
            'https://assets.coingecko.com/coins/images/325/large/Tether.png',
            balance: balance.toString(), // string
        },
        ]
    : []


      return res.json({ tokens })
    }

    return res.json({ tokens: [] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
