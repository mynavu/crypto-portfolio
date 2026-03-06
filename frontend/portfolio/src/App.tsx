import { useState, useEffect } from 'react'
import axios from 'axios'

type ApyObject = {
  supplyAPY: any;
  borrowAPY: any;
  usdtSupplyAPY: any;
  usdtBorrowAPY: any;
  usdcSupplyAPY: any;
  usdcBorrowAPY: any;
  ethSupplyAPY: any;
  ethBorrowAPY: any;
  solSupplyAPY: any;
  solBorrowAPY: any;
  btcSupplyAPY: any;
  btcBorrowAPY: any;
}

const protocols = ['AAVE', 'Compound', 'Kamino', 'Spark'] as const;
type Protocol = typeof protocols[number];

const assets = ['USDC', 'USDT', 'ETH', 'BTC', 'SOL'] as const;
type Asset = typeof assets[number];

type LinkKey = `${Protocol}_${Asset}`;
const links: Record<LinkKey, string> = {
  AAVE_USDC: "https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3",
  AAVE_USDT: "https://app.aave.com/reserve-overview/?underlyingAsset=0xdac17f958d2ee523a2206206994597c13d831ec7&marketName=proto_mainnet_v3",
  AAVE_ETH: "https://app.aave.com/reserve-overview/?underlyingAsset=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&marketName=proto_mainnet_v3",
  AAVE_BTC: "https://app.aave.com/reserve-overview/?underlyingAsset=0x2260fac5e5542a773aa44fbcfedf7c193bc2c599&marketName=proto_mainnet_v3",
  AAVE_SOL: "",
  Compound_USDC: "https://app.compound.finance/markets/usdc-mainnet",
  Compound_USDT: "https://app.compound.finance/markets/usdt-mainnet",
  Compound_ETH: "https://app.compound.finance/markets/weth-mainnet",
  Compound_BTC: "https://app.compound.finance/markets/wbtc-mainnet",
  Compound_SOL: "",
  Kamino_USDC: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59", 
  Kamino_USDT: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S",
  Kamino_ETH: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/febGYTnFX4GbSGoFHFeJXUHgNaK53fB23uDins9Jp1Ej",
  Kamino_BTC: "",
  Kamino_SOL: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q",
  Spark_USDC: "https://app.spark.fi/markets/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  Spark_USDT: "https://app.spark.fi/markets/1/0xdAC17F958D2ee523a2206206994597C13D831ec7",
  Spark_ETH: "https://app.spark.fi/markets/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  Spark_BTC: "https://app.spark.fi/markets/1/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  Spark_SOL: ""
}

function Rate({ value, label }: { value: any; label: string }) {
  const formatted = value == null || isNaN(Number(value))
    ? null
    : (Number(value) * 100).toFixed(2) + '%';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0' }}>
      <span style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: '#888',
        width: '44px',
        flexShrink: 0,
      }}>{label}</span>
      {formatted === null ? (
        <span style={{ color: '#444', fontSize: '13px', marginLeft: '8px' }}>—</span>
      ) : (
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: label === 'Supply' ? '#4ade80' : '#f87171',
          letterSpacing: '0.02em',
          marginLeft: '8px',
        }}>{formatted}</span>
      )}
    </div>
  );
}

function LoadingCell() {
  return (
    <td className="rate-cell">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '2px 0' }}>
        <div className="shimmer" style={{ height: '14px', width: '80px', borderRadius: '4px' }} />
        <div style={{ height: '1px', background: '#222', margin: '2px 0' }} />
        <div className="shimmer" style={{ height: '14px', width: '70px', borderRadius: '4px' }} />
      </div>
    </td>
  );
}

function getRates(
  protocol: Protocol,
  asset: Asset,
  aaveAPY: ApyObject | null,
  compoundAPY: ApyObject | null,
  kaminoAPY: any,
  sparkAPY: any
): { supply: any; borrow: any } {
  const nil = { supply: null, borrow: null };

  if (protocol === 'AAVE' && aaveAPY) {
    const map: Record<Asset, { supply: any; borrow: any }> = {
      USDC: { supply: aaveAPY.usdcSupplyAPY, borrow: aaveAPY.usdcBorrowAPY },
      USDT: { supply: aaveAPY.usdtSupplyAPY, borrow: aaveAPY.usdtBorrowAPY },
      ETH:  { supply: aaveAPY.ethSupplyAPY,  borrow: aaveAPY.ethBorrowAPY  },
      BTC:  { supply: aaveAPY.btcSupplyAPY,  borrow: aaveAPY.btcBorrowAPY  },
      SOL:  { supply: aaveAPY.solSupplyAPY,  borrow: aaveAPY.solBorrowAPY  },
    };
    return map[asset] ?? nil;
  }

  if (protocol === 'Compound' && compoundAPY) {
    const map: Record<Asset, { supply: any; borrow: any }> = {
      USDC: { supply: compoundAPY.usdcSupplyAPY, borrow: compoundAPY.usdcBorrowAPY },
      USDT: { supply: compoundAPY.usdtSupplyAPY, borrow: compoundAPY.usdtBorrowAPY },
      ETH:  { supply: compoundAPY.ethSupplyAPY,  borrow: compoundAPY.ethBorrowAPY  },
      BTC:  { supply: compoundAPY.btcSupplyAPY,  borrow: compoundAPY.btcBorrowAPY  },
      SOL:  nil,
    };
    return map[asset] ?? nil;
  }

  if (protocol === 'Kamino' && kaminoAPY) {
    const map: Record<Asset, { supply: any; borrow: any }> = {
      USDC: { supply: kaminoAPY.usdcSupplyAPY, borrow: kaminoAPY.usdcBorrowAPY },
      USDT: { supply: kaminoAPY.usdtSupplyAPY, borrow: kaminoAPY.usdtBorrowAPY },
      ETH:  { supply: kaminoAPY.ethSupplyAPY,  borrow: kaminoAPY.ethBorrowAPY  },
      BTC:  { supply: kaminoAPY.btcSupplyAPY,  borrow: kaminoAPY.btcBorrowAPY  },
      SOL:  { supply: kaminoAPY.solSupplyAPY,  borrow: kaminoAPY.solBorrowAPY  },
    };
    return map[asset] ?? nil;
  }

  if (protocol === 'Spark' && sparkAPY) {
    const map: Record<Asset, { supply: any; borrow: any }> = {
      USDC: { supply: sparkAPY.usdcSupplyAPY, borrow: sparkAPY.usdcBorrowAPY },
      USDT: { supply: sparkAPY.usdtSupplyAPY, borrow: sparkAPY.usdtBorrowAPY },
      ETH:  { supply: sparkAPY.ethSupplyAPY,  borrow: sparkAPY.ethBorrowAPY  },
      BTC:  { supply: sparkAPY.btcSupplyAPY,  borrow: sparkAPY.btcBorrowAPY  },
      SOL:  nil,
    };
    return map[asset] ?? nil;
  }

  return nil;
}

function App() {
  const [aaveAPY, setAaveAPY] = useState<ApyObject | null>(null)
  const [compoundAPY, setCompoundAPY] = useState<ApyObject | null>(null)
  const [kaminoAPY, setKaminoAPY] = useState<any>(null)
  const [sparkAPY, setSparkAPY] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getYield = async (): Promise<void> => {
      const [aave, compound, kamino1, spark] = await Promise.all([
        axios.get('/api/platforms/aave'),
        axios.get('/api/platforms/compound'),
        axios.get('/api/platforms/kamino1'),
        axios.get('/api/platforms/spark'),
      ]);

      setAaveAPY(aave.data);
      setCompoundAPY(compound.data);
      setKaminoAPY(kamino1.data);
      setSparkAPY(spark.data);
      setLoading(false);

    };

    getYield();
  }, []);

  return (
    <div className="front flex flex-col items-center gap-8 py-16">
      <h1 className='font-bold text-4xl'>Yield Info Page</h1>

      <style>{`
        .rates-table { border-collapse: collapse; border: 1px solid #222; background: #0f0f0f; border-radius: 12px; overflow: hidden; box-shadow: 0 0 60px rgba(0,0,0,0.8), 0 0 0 1px #1a1a1a; }
        .rates-table th, .rates-table td { border: 1px solid #1e1e1e; padding: 0; }
        .header-protocol { min-width: 150px; padding: 18px 24px !important; background: #0a0a0a; text-align: center; }
        .header-asset { width: 120px; background: #0a0a0a; }
        .corner-cell { background: #080808 !important; }
        .asset-cell { padding: 20px 20px !important; background: #0a0a0a; white-space: nowrap; }
        .rate-cell { padding: 16px 20px !important; background: #0f0f0f; transition: background 0.15s; vertical-align: middle; }
        .rate-cell:hover { background: #151515; }
        .protocol-header { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .protocol-name { font-size: 15px; font-weight: 700; color: #e0e0e0; letter-spacing: 0.04em; }
        .protocol-logo { width: 28px; height: 28px; object-fit: contain; border-radius: 50%; background: #1a1a1a; padding: 3px; }
        .asset-row { display: flex; align-items: center; gap: 10px; }
        .asset-logo { width: 26px; height: 26px; object-fit: contain; }
        .asset-name { font-size: 15px; font-weight: 700; color: #d0d0d0; letter-spacing: 0.06em; }
        .divider-line { width: 100%; height: 1px; background: #222; margin: 4px 0; }

        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite linear;
        }
      `}</style>

      <table className="rates-table">
        <thead>
          <tr>
            <th className="header-asset corner-cell" />
            {protocols.map((p) => (
              <th key={p} className="header-protocol">
                <div className="protocol-header">
                  <img
                    src={`/assets/protocols/${p.toLowerCase()}_logo.png`}
                    alt={`${p} logo`}
                    className="protocol-logo"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="protocol-name">{p}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset}>
              <td className="asset-cell">
                <div className="asset-row">
                  <img
                    src={`/assets/tokens/${asset.toLowerCase()}_logo.png`}
                    alt={`${asset} logo`}
                    className="asset-logo"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="asset-name">{asset}</span>
                </div>
              </td>
              {loading
                ? protocols.map((p) => <LoadingCell key={p} />)
                : protocols.map((protocol) => {
                    const { supply, borrow } = getRates(protocol, asset, aaveAPY, compoundAPY, kaminoAPY, sparkAPY);
                    const link: LinkKey = `${protocol}_${asset}`;
                    const url = links[link];
                    return (
                      <td key={protocol} className="rate-cell">
                        <a href={url} target='_black' className={url !== "" ? 'cursor-pointer' : 'cursor-not-allowed'}
                        onClick={e => { if (url === "")  e.preventDefault()}}
                        >
                          <Rate value={supply} label="Supply" />
                          <div className="divider-line" />
                          <Rate value={borrow} label="Borrow" />
                        </a>
                      </td>
                    );
                  })
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App