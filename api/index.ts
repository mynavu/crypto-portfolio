import { VercelRequest, VercelResponse } from '@vercel/node'
import 'dotenv/config'
import { Alchemy, Network, TokenBalancesResponse } from 'alchemy-sdk'
import { formatUnits } from 'ethers'

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

  // Handle portfolio endpoint
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
      }

      const network = alchemyChains[Number(chainId)]

      type AlchemyTokenBalance = TokenBalancesResponse["tokenBalances"][number]

      if (network) {
        const alchemy = new Alchemy({ 
          apiKey: process.env.ALCHEMY_KEY!, 
          network: network 
        })
        
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
        
        res.status(200).json({ tokens: detailed })
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