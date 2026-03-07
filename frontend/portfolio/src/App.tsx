import { useState, useEffect } from "react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

type AaveApyFlat = Record<string, number>;
type CompoundApyFlat = Record<string, number>;

type RateEntry = {
  protocol: string; // e.g. "AAVE"
  network: string; // e.g. "Ethereum", "Arbitrum"
  supplyAPY: number | null;
  borrowAPY: number | null;
  link: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const assets = ["USDC", "USDT", "ETH", "BTC", "SOL"] as const;
type Asset = (typeof assets)[number];

const AAVE_NETWORKS: { key: string; label: string }[] = [
  { key: "ethereum", label: "Ethereum" },
  { key: "arbitrum", label: "Arbitrum" },
  { key: "optimism", label: "Optimism" },
  { key: "base", label: "Base" },
  { key: "polygon", label: "Polygon" },
  { key: "avalanche", label: "Avalanche" },
];

const COMPOUND_NETWORKS: { key: string; label: string }[] = [
  { key: "ethereum", label: "Ethereum" },
  { key: "arbitrum", label: "Arbitrum" },
  { key: "optimism", label: "Optimism" },
];

const COMPOUND_TOKEN_MAP: Partial<Record<Asset, string>> = {
  USDC: "usdc",
  USDT: "usdt",
  ETH: "eth",
  BTC: "btc",
};

const AAVE_TOKEN_MAP: Partial<Record<Asset, string>> = {
  USDC: "usdc",
  USDT: "usdt",
  ETH: "eth",
  BTC: "btc",
  // SOL not on AAVE
};

const AAVE_LINKS: Partial<Record<Asset, Partial<Record<string, string>>>> = {
  USDC: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3",
    arbitrum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xff970a61a04b1ca14834a43f5de4533ebddb5cc8&marketName=proto_arbitrum_v3",
    optimism:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x7f5c764cbc14f9669b88837ca1490cca17c31607&marketName=proto_optimism_v3",
    base: "https://app.aave.com/reserve-overview/?underlyingAsset=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&marketName=proto_base_v3",
    polygon:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&marketName=proto_polygon_v3",
    avalanche:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e&marketName=proto_avalanche_v3",
  },
  USDT: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xdac17f958d2ee523a2206206994597c13d831ec7&marketName=proto_mainnet_v3",
  },
  ETH: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&marketName=proto_mainnet_v3",
  },
  BTC: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x2260fac5e5542a773aa44fbcfedf7c193bc2c599&marketName=proto_mainnet_v3",
  },
};

const COMPOUND_LINKS: Partial<Record<Asset, Partial<Record<string, string>>>> =
  {
    ETH: { ethereum: "https://app.compound.finance/markets/weth-mainnet" },
    BTC: { ethereum: "https://app.compound.finance/markets/wbtc-mainnet" },
    USDC: { ethereum: "https://app.compound.finance/markets/usdc-mainnet" },
    USDT: { ethereum: "https://app.compound.finance/markets/usdt-mainnet" },
  };

const KAMINO_LINKS: Partial<Record<Asset, string>> = {
  USDC: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59",
  USDT: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S",
  ETH: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/febGYTnFX4GbSGoFHFeJXUHgNaK53fB23uDins9Jp1Ej",
  SOL: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q",
};

const SPARK_LINKS: Partial<Record<Asset, string>> = {
  USDC: "https://app.spark.fi/markets/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "https://app.spark.fi/markets/1/0xdAC17F958D2ee523a2206206994597C13D831ec7",
  ETH: "https://app.spark.fi/markets/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  BTC: "https://app.spark.fi/markets/1/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
};

const PROTOCOL_COLORS: Record<string, string> = {
  AAVE: "#b6509e",
  Compound: "#00d395",
  Kamino: "#a3e635",
  Spark: "#f59e0b",
};

const NETWORK_COLORS: Record<string, string> = {
  Ethereum: "#627eea",
  Arbitrum: "#28a0f0",
  Optimism: "#ff0420",
  Base: "#0052ff",
  Polygon: "#8247e5",
  Avalanche: "#e84142",
  Solana: "#9945ff",
};

// ─── Data Builders ────────────────────────────────────────────────────────────

function buildAaveEntries(data: AaveApyFlat, asset: Asset): RateEntry[] {
  const tokenKey = AAVE_TOKEN_MAP[asset];
  if (!tokenKey) return [];

  return AAVE_NETWORKS.flatMap(({ key, label }) => {
    const supplyAPY = data[`${key}_${tokenKey}_supplyAPY`];
    const borrowAPY = data[`${key}_${tokenKey}_borrowAPY`];
    if (supplyAPY == null && borrowAPY == null) return [];
    return [
      {
        protocol: "AAVE",
        network: label,
        supplyAPY: typeof supplyAPY === "number" ? supplyAPY : null,
        borrowAPY: typeof borrowAPY === "number" ? borrowAPY : null,
        link: AAVE_LINKS[asset]?.[key] ?? "",
      },
    ];
  });
}

function buildCompoundEntries(
  data: CompoundApyFlat,
  asset: Asset,
): RateEntry[] {
  const tokenKey = COMPOUND_TOKEN_MAP[asset];
  if (!tokenKey) return [];

  return COMPOUND_NETWORKS.flatMap(({ key, label }) => {
    const supplyAPY = data[`${key}_${tokenKey}_supplyAPY`];
    const borrowAPY = data[`${key}_${tokenKey}_borrowAPY`];
    if (supplyAPY == null && borrowAPY == null) return [];
    return [
      {
        protocol: "COMPOUND",
        network: label,
        supplyAPY: typeof supplyAPY === "number" ? supplyAPY : null,
        borrowAPY: typeof borrowAPY === "number" ? borrowAPY : null,
        link: COMPOUND_LINKS[asset]?.[key] ?? "",
      },
    ];
  });
}

// Single-network protocol builder — duplicate + extend for multi-network Compound/Kamino later
function buildSingleNetworkEntries(
  apyData: Record<string, number> | null,
  protocol: string,
  network: string,
  asset: Asset,
  links: Partial<Record<Asset, string>>,
  tokenKeyMap: Partial<Record<Asset, { supply: string; borrow: string }>>,
): RateEntry[] {
  if (!apyData) return [];
  const keys = tokenKeyMap[asset];
  if (!keys) return [];
  const supplyAPY = apyData[keys.supply];
  const borrowAPY = apyData[keys.borrow];
  if (supplyAPY == null && borrowAPY == null) return [];
  return [
    {
      protocol,
      network,
      supplyAPY: typeof supplyAPY === "number" ? supplyAPY : null,
      borrowAPY: typeof borrowAPY === "number" ? borrowAPY : null,
      link: links[asset] ?? "",
    },
  ];
}

function buildAllEntries(
  asset: Asset,
  aaveFlat: AaveApyFlat | null,
  compoundFlat: CompoundApyFlat | null,
  kaminoAPY: Record<string, number> | null,
  sparkAPY: Record<string, number> | null,
): RateEntry[] {
  const kaminoKeyMap: Partial<
    Record<Asset, { supply: string; borrow: string }>
  > = {
    USDC: { supply: "usdcSupplyAPY", borrow: "usdcBorrowAPY" },
    USDT: { supply: "usdtSupplyAPY", borrow: "usdtBorrowAPY" },
    ETH: { supply: "ethSupplyAPY", borrow: "ethBorrowAPY" },
    SOL: { supply: "solSupplyAPY", borrow: "solBorrowAPY" },
  };
  const sparkKeyMap: Partial<
    Record<Asset, { supply: string; borrow: string }>
  > = {
    USDC: { supply: "usdcSupplyAPY", borrow: "usdcBorrowAPY" },
    USDT: { supply: "usdtSupplyAPY", borrow: "usdtBorrowAPY" },
    ETH: { supply: "ethSupplyAPY", borrow: "ethBorrowAPY" },
    BTC: { supply: "btcSupplyAPY", borrow: "btcBorrowAPY" },
  };

  return [
    ...(aaveFlat ? buildAaveEntries(aaveFlat, asset) : []),
    ...(compoundFlat ? buildCompoundEntries(compoundFlat, asset) : []),
    ...buildSingleNetworkEntries(
      kaminoAPY,
      "Kamino",
      "Solana",
      asset,
      KAMINO_LINKS,
      kaminoKeyMap,
    ),
    ...buildSingleNetworkEntries(
      sparkAPY,
      "Spark",
      "Ethereum",
      asset,
      SPARK_LINKS,
      sparkKeyMap,
    ),
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RateRow({
  entry,
  type,
  rank,
}: {
  entry: RateEntry;
  type: "supply" | "borrow";
  rank: number;
}) {
  const apy = type === "supply" ? entry.supplyAPY : entry.borrowAPY;
  if (apy == null) return null;
  const formatted = (apy * 100).toFixed(2) + "%";
  const apyColor = type === "supply" ? "#4ade80" : "#f87171";
  const protocolColor = PROTOCOL_COLORS[entry.protocol] ?? "#888";
  const networkColor = NETWORK_COLORS[entry.network] ?? "#666";
  const isClickable = entry.link !== "";
  const isTop = rank === 0;

  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "6px",
        padding: "5px 7px",
        borderRadius: "6px",
        background: isTop ? "rgba(255,255,255,0.025)" : "transparent",
        border: `1px solid ${isTop ? "rgba(255,255,255,0.055)" : "transparent"}`,
        transition: "background 0.12s",
        cursor: isClickable ? "pointer" : "default",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          minWidth: 0,
        }}
      >
        {/* Rank indicator */}
        <span
          style={{
            fontSize: "8px",
            fontWeight: 800,
            color: rank === 0 ? "#ffd700" : rank === 1 ? "#999" : "#555",
            width: "10px",
            flexShrink: 0,
            fontFamily: "monospace",
          }}
        >
          #{rank + 1}
        </span>

        {/* Protocol dot + name */}
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: protocolColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            color: protocolColor,
            letterSpacing: "0.07em",
            fontFamily: "monospace",
          }}
        >
          {entry.protocol}
        </span>

        {/* Network */}
        <span
          style={{
            fontSize: "9px",
            color: networkColor,
            opacity: 0.8,
            letterSpacing: "0.04em",
          }}
        >
          {entry.network}
        </span>
      </div>

      {/* APY */}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: apyColor,
          letterSpacing: "0.02em",
          flexShrink: 0,
        }}
      >
        {formatted}
      </span>
    </div>
  );

  if (!isClickable) return inner;
  return (
    <a
      href={entry.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}
    >
      {inner}
    </a>
  );
}

const VISIBLE_COUNT = 3;

function RateColumn({
  entries,
  type,
}: {
  entries: RateEntry[];
  type: "supply" | "borrow";
}) {
  const [expanded, setExpanded] = useState(false);

  const valid = [...entries]
    .filter((e) => (type === "supply" ? e.supplyAPY : e.borrowAPY) != null)
    .sort((a, b) => {
      const av = type === "supply" ? a.supplyAPY! : a.borrowAPY!;
      const bv = type === "supply" ? b.supplyAPY! : b.borrowAPY!;
      return type === "supply" ? bv - av : av - bv;
    });

  const color = type === "supply" ? "#4ade80" : "#f87171";

  if (!valid.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <div
          style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color,
            opacity: 0.5,
            padding: "0 7px",
            marginBottom: "2px",
          }}
        >
          {type === "supply" ? "▲ Supply" : "▼ Borrow"}
        </div>
        <span
          style={{ color: "#2a2a2a", fontSize: "12px", padding: "5px 7px" }}
        >
          —
        </span>
      </div>
    );
  }

  const visible = expanded ? valid : valid.slice(0, VISIBLE_COUNT);
  const extra = valid.length - VISIBLE_COUNT;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      {/* Header */}
      <div
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color,
          opacity: 0.55,
          padding: "0 7px",
          marginBottom: "2px",
        }}
      >
        {type === "supply" ? "▲ Supply" : "▼ Borrow"}
      </div>

      {visible.map((entry, i) => (
        <RateRow
          key={`${entry.protocol}-${entry.network}-${type}`}
          entry={entry}
          type={type}
          rank={i}
        />
      ))}

      {extra > 0 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "3px 7px",
            fontSize: "9px",
            fontWeight: 600,
            color: "#444",
            letterSpacing: "0.08em",
            textAlign: "left",
            textTransform: "uppercase",
            transition: "color 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#777")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
        >
          {expanded ? "↑ less" : `+ ${extra} more`}
        </button>
      )}
    </div>
  );
}

function AssetCell({ entries }: { entries: RateEntry[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0",
        padding: "14px 10px",
        minWidth: "320px",
      }}
    >
      <div style={{ flex: 1 }}>
        <RateColumn entries={entries} type="supply" />
      </div>
      <div
        style={{
          width: "1px",
          background: "#1a1a1a",
          margin: "0 6px",
          alignSelf: "stretch",
        }}
      />
      <div style={{ flex: 1 }}>
        <RateColumn entries={entries} type="borrow" />
      </div>
    </div>
  );
}

function LoadingAssetCell() {
  return (
    <div
      style={{
        display: "flex",
        gap: "0",
        padding: "14px 10px",
        minWidth: "320px",
      }}
    >
      {[0, 1].map((col) => (
        <div
          key={col}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <div
            className="shimmer"
            style={{
              height: "9px",
              width: "45px",
              borderRadius: "3px",
              marginBottom: "5px",
            }}
          />
          {[1, 0.7, 0.4].map((op, i) => (
            <div
              key={i}
              className="shimmer"
              style={{ height: "28px", borderRadius: "5px", opacity: op }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [aaveFlat, setAaveFlat] = useState<AaveApyFlat | null>(null);
  const [compoundAPY, setCompoundAPY] = useState<Record<string, number> | null>(
    null,
  );
  const [kaminoAPY, setKaminoAPY] = useState<Record<string, number> | null>(
    null,
  );
  const [sparkAPY, setSparkAPY] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getYield = async () => {
      try {
        const [aave, compound, kamino1, spark] = await Promise.all([
          axios.get("/api/platforms/aave"),
          axios.get("/api/platforms/compound"),
          axios.get("/api/platforms/kamino1"),
          axios.get("/api/platforms/spark"),
        ]);
        setAaveFlat(aave.data);
        setCompoundAPY(compound.data);
        setKaminoAPY(kamino1.data);
        setSparkAPY(spark.data);
      } catch (err) {
        console.error("Failed to fetch yields:", err);
      } finally {
        setLoading(false);
      }
    };
    getYield();
  }, []);

  return (
    <div className="front flex flex-col items-center gap-8 py-16">
      <h1 className="font-bold text-4xl">Yield Info Page</h1>

      <style>{`
        .yield-table {
          border-collapse: collapse;
          border: 1px solid #181818;
          background: #0a0a0a;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 0 80px rgba(0,0,0,0.9), 0 0 0 1px #161616;
        }
        .yield-table th, .yield-table td {
          border: 1px solid #141414;
          padding: 0;
        }
        .corner-th {
          background: #070707;
          padding: 16px 20px !important;
        }
        .asset-th {
          background: #070707;
          padding: 14px 16px !important;
          text-align: left;
        }
        .asset-th-inner {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .asset-th-logo {
          width: 22px;
          height: 22px;
          object-fit: contain;
          border-radius: 50%;
        }
        .asset-th-name {
          font-size: 13px;
          font-weight: 700;
          color: #c8c8c8;
          letter-spacing: 0.05em;
        }
        .label-td {
          background: #070707;
          padding: 0 20px !important;
          vertical-align: middle;
          white-space: nowrap;
        }
        .data-td {
          background: #0a0a0a;
          vertical-align: top;
          transition: background 0.12s;
        }
        .data-td:hover { background: #0d0d0d; }

        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #111 25%, #1c1c1c 50%, #111 75%);
          background-size: 1200px 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>

      <table className="yield-table">
        <thead>
          <tr>
            <th className="corner-th">
              <span
                style={{
                  fontSize: "10px",
                  color: "#383838",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Token
              </span>
            </th>
            {assets.map((asset) => (
              <th key={asset} className="asset-th">
                <div className="asset-th-inner">
                  <img
                    src={`/assets/tokens/${asset.toLowerCase()}_logo.png`}
                    alt={asset}
                    className="asset-th-logo"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                  <span className="asset-th-name">{asset}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="label-td">
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#4ade80",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  ▲ Supply
                </span>
                <div
                  style={{
                    width: "100%",
                    height: "1px",
                    background: "#1a1a1a",
                  }}
                />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#f87171",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  ▼ Borrow
                </span>
              </div>
            </td>

            {assets.map((asset) => (
              <td key={asset} className="data-td">
                {loading ? (
                  <LoadingAssetCell />
                ) : (
                  <AssetCell
                    entries={buildAllEntries(
                      asset,
                      aaveFlat,
                      compoundAPY,
                      kaminoAPY,
                      sparkAPY,
                    )}
                  />
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <p
        style={{
          fontSize: "10px",
          color: "#2e2e2e",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Supply ranked highest → lowest · Borrow ranked lowest → highest · #1 =
        best rate
      </p>
    </div>
  );
}

export default App;
