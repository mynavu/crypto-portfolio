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

// In api/index.ts, replace the portfolio endpoint handling:

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