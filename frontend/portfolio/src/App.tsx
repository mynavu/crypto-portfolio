import { useState, useEffect } from "react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

type AaveApyFlat = Record<string, number>;
type CompoundApyFlat = Record<string, number>;

type RateEntry = {
  protocol: string;
  network: string;
  supplyAPY: number | null;
  borrowAPY: number | null;
  link: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const assets = ["USDC", "USDT", "ETH", "BTC", "SOL"] as const;
type Asset = (typeof assets)[number];

const AAVE_NETWORKS = [
  { key: "ethereum", label: "Ethereum" },
  { key: "arbitrum", label: "Arbitrum" },
  { key: "optimism", label: "Optimism" },
  { key: "base", label: "Base" },
  { key: "polygon", label: "Polygon" },
  { key: "avalanche", label: "Avalanche" },
  { key: "linea", label: "Linea" },
  { key: "scroll", label: "Scroll" },
  { key: "celo", label: "Celo" },
  { key: "plasma", label: "Plasma" },
];

const COMPOUND_NETWORKS = [
  { key: "ethereum", label: "Ethereum" },
  { key: "arbitrum", label: "Arbitrum" },
  { key: "optimism", label: "Optimism" },
  { key: "base", label: "Base" },
  { key: "linea", label: "Linea" },
  { key: "polygon", label: "Polygon" },
  { key: "scroll", label: "Scroll" },
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
    linea:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x176211869ca2b568f2a7d4ee941e073a821ee1ff&marketName=proto_linea_v3",
    scroll:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4&marketName=proto_scroll_v3",
    celo: "https://app.aave.com/reserve-overview/?underlyingAsset=0xceba9300f2b948710d2653dd7b07f33a8b32118c&marketName=proto_celo_v3",
  },
  USDT: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xdac17f958d2ee523a2206206994597c13d831ec7&marketName=proto_mainnet_v3",
    arbitrum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9&marketName=proto_arbitrum_v3",
    optimism:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x94b008aa00579c1307b0ef2c499ad98a8ce58e58&marketName=proto_optimism_v3",
    polygon:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xc2132d05d31c914a87c6611c10748aeb04b58e8f&marketName=proto_polygon_v3",
    avalanche:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7&marketName=proto_avalanche_v3",
    linea:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xa219439258ca9da29e9cc4ce5596924745e12b93&marketName=proto_linea_v3",
    celo: "https://app.aave.com/reserve-overview/?underlyingAsset=0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e&marketName=proto_celo_v3",
    plasma:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb&marketName=proto_plasma_v3",
  },
  ETH: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&marketName=proto_mainnet_v3",
    arbitrum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x82af49447d8a07e3bd95bd0d56f35241523fbab1&marketName=proto_arbitrum_v3",
    optimism:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x4200000000000000000000000000000000000006&marketName=proto_optimism_v3",
    base: "https://app.aave.com/reserve-overview/?underlyingAsset=0x4200000000000000000000000000000000000006&marketName=proto_base_v3",
    polygon:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x7ceb23fd6bc0add59e62ac25578270cff1b9f619&marketName=proto_polygon_v3",
    avalanche:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab&marketName=proto_avalanche_v3",
    linea:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6&marketName=proto_linea_v3", // WETH on Linea
    scroll:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x5300000000000000000000000000000000000004&marketName=proto_scroll_v3",
    celo: "https://app.aave.com/reserve-overview/?underlyingAsset=0xd221812de1bd094f35587ee8e174b07b6167d9af&marketName=proto_celo_v3",
    plasma:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xa3d68b74bf0528fdd07263c60d6488749044914b&marketName=proto_plasma_v3", // WETH
  },
  BTC: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x2260fac5e5542a773aa44fbcfedf7c193bc2c599&marketName=proto_mainnet_v3",
    arbitrum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f&marketName=proto_arbitrum_v3",
    optimism:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x68f180fcce6836688e9084f035309e29bf0a2095&marketName=proto_optimism_v3",
    base: "",
    polygon:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6&marketName=proto_polygon_v3",
    avalanche:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x50b7545627a5162f82a992c33b87adc75187b218&marketName=proto_avalanche_v3", // WBTC.e
    linea:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4&marketName=proto_linea_v3",
  },
};

const COMPOUND_LINKS: Partial<Record<Asset, Partial<Record<string, string>>>> =
  {
    ETH: {
      ethereum: "https://app.compound.finance/markets/weth-mainnet",
      arbitrum: "https://app.compound.finance/markets/weth-arb",
      optimism: "https://app.compound.finance/markets/weth-op",
      base: "https://app.compound.finance/markets/weth-basemainnet",
      linea: "https://app.compound.finance/markets/weth-linea",
    },
    BTC: {
      ethereum: "https://app.compound.finance/markets/wbtc-mainnet",
    },
    USDC: {
      ethereum: "https://app.compound.finance/markets/usdc-mainnet",
      arbitrum: "https://app.compound.finance/markets/usdc-arb",
      optimism: "https://app.compound.finance/markets/usdc-op",
      base: "https://app.compound.finance/markets/usdc-basemainnet",
      linea: "https://app.compound.finance/markets/usdc-linea",
      polygon: "https://app.compound.finance/markets/usdc.e-polygon",
      scroll: "https://app.compound.finance/markets/usdc-scroll",
    },
    USDT: {
      ethereum: "https://app.compound.finance/markets/usdt-mainnet",
      arbitrum: "https://app.compound.finance/markets/usd%E2%82%AE0-arb",
      optimism: "https://app.compound.finance/markets/usdt-op",
      polygon:
        "https://polygonscan.com//address/0xaeB318360f27748Acb200CE616E389A6C9409a07",
    },
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

const PROTOCOL_STYLES: Record<string, { color: string; bg: string }> = {
  AAVE: { color: "#d885ff", bg: "rgba(103, 34, 135,0.12)" },
  COMPOUND: { color: "#54ff87", bg: "rgba(54, 145, 81, 0.10)" },
  Kamino: { color: "#82daff", bg: "rgba(67, 147, 181, 0.10)" },
  Spark: { color: "#fff178", bg: "rgba(184, 167, 26, 0.10)" },
};

const NETWORK_COLORS: Record<string, string> = {
  Ethereum: "#627eea",
  Arbitrum: "#28a0f0",
  Optimism: "#ff3838",
  Base: "#3874ff",
  Polygon: "#8247e5",
  Avalanche: "#ff8585",
  Solana: "#9945ff",
  Celo: "#ffff26",
  Scroll: "#ffe4ad",
  Linea: "#85daff",
  Plasma: "#84d18e",
};

const ASSET_COLORS: Record<string, string> = {
  USDC: "#2775ca",
  USDT: "#26a17b",
  ETH: "#627eea",
  BTC: "#f7931a",
  SOL: "#9945ff",
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

const VISIBLE_COUNT = 3;

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
  const style = PROTOCOL_STYLES[entry.protocol] ?? {
    color: "#888",
    bg: "transparent",
  };
  const networkColor = NETWORK_COLORS[entry.network] ?? "#666";
  const isTop = rank === 0;

  const inner = (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all duration-100 ${isTop ? "ring-1 ring-white/5 bg-white/[0.025]" : "hover:bg-white/[0.015]"}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Rank */}
        <span
          className={`text-[10px] font-black font-mono w-4 shrink-0 ${rank === 0 ? "text-yellow-400" : rank === 1 ? "text-zinc-500" : "text-zinc-700"}`}
        >
          #{rank + 1}
        </span>

        {/* Protocol badge */}
        <span
          className="text-[9px] font-black font-mono tracking-wider px-1.5 py-0.5 rounded"
          style={{ color: style.color, background: style.bg }}
        >
          {entry.protocol}
        </span>

        {/* Network */}
        <span className="text-[10px] truncate" style={{ color: networkColor }}>
          {entry.network}
        </span>
      </div>

      {/* APY value */}
      <span
        className={`text-sm font-black font-mono shrink-0 ${type === "supply" ? "text-emerald-400" : "text-rose-400"}`}
      >
        {formatted}
      </span>
    </div>
  );

  if (!entry.link) return <div>{inner}</div>;
  return (
    <a
      href={entry.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline"
    >
      {inner}
    </a>
  );
}

function RateList({
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

  const visible = expanded ? valid : valid.slice(0, VISIBLE_COUNT);
  const extra = valid.length - VISIBLE_COUNT;

  if (!valid.length) {
    return (
      <div className="flex flex-col gap-1">
        <p
          className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${type === "supply" ? "text-emerald-400" : "text-rose-400"}`}
        >
          {type === "supply" ? "▲ Supply" : "▼ Borrow"}
        </p>
        <span className="text-zinc-700 text-xs px-3 py-2">—</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <p
        className={`text-[10px] font-bold tracking-widest uppercase mb-2 px-3 ${type === "supply" ? "text-emerald-400" : "text-rose-400"}`}
      >
        {type === "supply" ? "▲ Supply" : "▼ Borrow"}
      </p>
      {visible.map((entry, i) => (
        <RateRow
          key={`${entry.protocol}-${entry.network}`}
          entry={entry}
          type={type}
          rank={i}
        />
      ))}
      {extra > 0 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-left text-[10px] font-semibold tracking-widest uppercase px-3 py-1.5 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {expanded ? "↑ less" : `+ ${extra} more`}
        </button>
      )}
    </div>
  );
}

function ShimmerRow() {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <div className="flex items-center gap-2 flex-1">
        <div className="h-3 w-5 rounded bg-zinc-800 animate-pulse" />
        <div className="h-4 w-14 rounded bg-zinc-800 animate-pulse" />
        <div className="h-3 w-16 rounded bg-zinc-800 animate-pulse" />
      </div>
      <div className="h-4 w-12 rounded bg-zinc-800 animate-pulse" />
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex gap-4 p-4">
      {[0, 1].map((col) => (
        <div key={col} className="flex-1 flex flex-col gap-1">
          <div className="h-3 w-12 rounded bg-zinc-800 animate-pulse mb-3" />
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
        </div>
      ))}
    </div>
  );
}

function AssetCard({
  asset,
  entries,
  loading,
}: {
  asset: Asset;
  entries: RateEntry[];
  loading: boolean;
}) {
  const accentColor = ASSET_COLORS[asset] ?? "#888";

  return (
    <div className="bg-[#0a0a0a] border border-[#181818] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#141414] bg-[#070707]">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: accentColor,
            boxShadow: `0 0 8px ${accentColor}66`,
          }}
        />
        <img
          src={`/assets/tokens/${asset.toLowerCase()}_logo.png`}
          alt={asset}
          className="w-5 h-5 rounded-full object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-sm font-black tracking-widest text-zinc-200 font-mono">
          {asset}
        </span>

        {!loading && (
          <div className="ml-auto flex gap-3 text-[10px] text-zinc-600 font-mono">
            <span>
              <span className="text-emerald-400">▲</span>{" "}
              {entries.filter((e) => e.supplyAPY != null).length} markets
            </span>
            <span>
              <span className="text-rose-400">▼</span>{" "}
              {entries.filter((e) => e.borrowAPY != null).length} markets
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <LoadingCard />
      ) : (
        <div className="flex gap-0 divide-x divide-[#141414]">
          <div className="flex-1 p-4">
            <RateList entries={entries} type="supply" />
          </div>
          <div className="flex-1 p-4">
            <RateList entries={entries} type="borrow" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 py-16 px-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-12">
        <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-600 mb-3">
          DeFi Rates
        </p>
        <h1 className="text-4xl font-black tracking-tight text-zinc-100">
          Yield Overview
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Live supply &amp; borrow rates across AAVE, Compound, Kamino, and
          Spark.
        </p>
      </div>

      {/* Cards — vertical stack */}
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {assets.map((asset) => (
          <AssetCard
            key={asset}
            asset={asset}
            loading={loading}
            entries={buildAllEntries(
              asset,
              aaveFlat,
              compoundAPY,
              kaminoAPY,
              sparkAPY,
            )}
          />
        ))}
      </div>

      {/* Footer */}
      <p className="max-w-2xl mx-auto mt-10 text-[10px] font-mono tracking-widest uppercase text-zinc-700 text-center">
        Supply ranked highest → lowest · Borrow ranked lowest → highest · #1 =
        best rate
      </p>
    </div>
  );
}
