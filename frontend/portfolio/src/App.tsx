import {
  AppKitProvider,
  useAppKitAccount,
  useAppKitNetwork,
  AppKitButton,
} from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { WagmiProvider, useSwitchChain } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AAVE_LINKS,
  COMPOUND_LINKS,
  KAMINO_LINKS,
  SPARK_LINKS,
} from "./resources/allLinks";
import { AAVE_NETWORKS, COMPOUND_NETWORKS } from "./resources/allNetworks";
import {
  PROTOCOL_COLORS,
  NETWORK_COLORS,
  ASSET_COLORS,
} from "./resources/allColors";
import {
  mainnet,
  arbitrum,
  optimism,
  base,
  polygon,
  avalanche,
  linea,
  scroll,
  celo,
  plasma,
  sepolia,
  baseSepolia,
} from "viem/chains";
import { useState, useEffect } from "react";
import axios from "axios";
import { TOKEN_ADDRESSES } from "./resources/tokenAddresses";
import { PROTOCOL_CONFIG } from "./resources/protocolConfig";
import {
  Asset,
  Token,
  Protocol,
  UpperCaseNetwork,
  EthProtocol,
  EthNetwork,
  SuppliedAsset,
  BorrowedAsset,
} from "./shared.types";
import { useProtocolAdapter } from "./hooks/useProtocolAdapter";
import { useUserPosition } from "./hooks/useUserPosition";
import { PortfolioSummary } from "./components/PortfolioSummary";
import { SupplyModal } from "./components/SupplyModal";
import { BorrowModal } from "./components/BorrowModal";
import { WithdrawModal } from "./components/WithdrawModal";
import { RepayModal } from "./components/RepayModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type AaveApyFlat = Record<string, number>;
type CompoundApyFlat = Record<string, number>;

type RateEntry = {
  protocol: Protocol;
  network: UpperCaseNetwork;
  supplyAPY: number | null;
  borrowAPY: number | null;
  link: string;
};

type ModalState =
  | { kind: "supply"; token: Token; tokenAddress: `0x${string}`; protocol: EthProtocol; networkKey: EthNetwork; supplyApy: number | null }
  | { kind: "borrow"; token: Token; tokenAddress: `0x${string}`; protocol: EthProtocol; networkKey: EthNetwork; borrowApy: number | null }
  | { kind: "withdraw"; asset: SuppliedAsset; protocol: EthProtocol; networkKey: EthNetwork }
  | { kind: "repay"; asset: BorrowedAsset; protocol: EthProtocol; networkKey: EthNetwork };

// ─── Constants ────────────────────────────────────────────────────────────────

const assets = ["USDC", "USDT", "ETH", "BTC", "SOL"] as const;

const TOKEN_MAP: Partial<Record<Asset, Token>> = {
  USDC: "usdc",
  USDT: "usdt",
  ETH: "eth",
  BTC: "btc",
  SOL: "sol",
};

const COMPOUND_TOKEN_MAP: Partial<Record<Asset, string>> = {
  USDC: "usdc",
  USDT: "usdt",
  ETH: "eth",
  BTC: "btc",
};

const AAVE_TOKEN_MAP: Partial<Record<Asset, Token>> = {
  USDC: "usdc",
  USDT: "usdt",
  ETH: "eth",
  BTC: "btc",
};

const NETWORK_MAP: Record<number, keyof typeof TOKEN_ADDRESSES> = {
  1: "ethereum",
  42161: "arbitrum",
  10: "optimism",
  8453: "base",
  137: "polygon",
  43114: "avalanche",
  59144: "linea",
  534352: "scroll",
  42220: "celo",
  9745: "plasma",
  11155111: "sepolia",
  84532: "base_sepolia",
};

const UPPER_NETWORK_TO_ETH: Partial<Record<UpperCaseNetwork, EthNetwork>> = {
  Ethereum: "ethereum",
  Arbitrum: "arbitrum",
  Optimism: "optimism",
  Base: "base",
  Polygon: "polygon",
  Avalanche: "avalanche",
  Linea: "linea",
  Scroll: "scroll",
  Celo: "celo",
  Plasma: "plasma",
};

const ETH_NETWORK_CHAIN_IDS: Partial<Record<EthNetwork, number>> = {
  ethereum: 1,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  base_sepolia: 84532,
  polygon: 137,
  avalanche: 43114,
  linea: 59144,
  scroll: 534352,
  celo: 42220,
  plasma: 9745,
  sepolia: 11155111,
};

// Map from Protocol display name to EthProtocol key
const PROTOCOL_TO_ETH: Partial<Record<Protocol, EthProtocol>> = {
  AAVE: "aave",
  Spark: "spark",
  COMPOUND: "compound",
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
  protocol: Protocol,
  network: UpperCaseNetwork,
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
  onSupply,
  onBorrow,
}: {
  entry: RateEntry;
  type: "supply" | "borrow";
  rank: number;
  onSupply: () => void;
  onBorrow: () => void;
}) {
  const apy = type === "supply" ? entry.supplyAPY : entry.borrowAPY;
  if (apy == null) return null;

  const formatted = (apy * 100).toFixed(2) + "%";
  const style = PROTOCOL_COLORS[entry.protocol] ?? {
    color: "#888",
    bg: "transparent",
  };
  const networkColor = NETWORK_COLORS[entry.network] ?? "#666";
  const isTop = rank === 0;
  const isKamino = entry.protocol === "Kamino";

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

      <div className="flex items-center gap-2 shrink-0">
        {/* APY value */}
        <span
          className={`text-sm font-black font-mono ${type === "supply" ? "text-emerald-400" : "text-rose-400"}`}
        >
          {formatted}
        </span>

        {/* Action button — hidden for Kamino (Solana only) */}
        {!isKamino && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (type === "supply") onSupply();
              else onBorrow();
            }}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
              type === "supply"
                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            }`}
          >
            {type === "supply" ? "Supply" : "Borrow"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {entry.link ? (
        <a
          href={entry.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block no-underline"
        >
          {inner}
        </a>
      ) : (
        <div>{inner}</div>
      )}
    </div>
  );
}

function RateList({
  entries,
  type,
  onSupply,
  onBorrow,
}: {
  entries: RateEntry[];
  type: "supply" | "borrow";
  onSupply: (entry: RateEntry) => void;
  onBorrow: (entry: RateEntry) => void;
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
          onSupply={() => onSupply(entry)}
          onBorrow={() => onBorrow(entry)}
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
  onSupply,
  onBorrow,
}: {
  asset: Asset;
  entries: RateEntry[];
  loading: boolean;
  onSupply: (token: Token, protocol: EthProtocol, entry: RateEntry) => void;
  onBorrow: (token: Token, protocol: EthProtocol, entry: RateEntry) => void;
}) {
  const accentColor = ASSET_COLORS[asset] ?? "#888";
  const token = TOKEN_MAP[asset];
  if (!token) {
    return <p>Error</p>;
  }

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
            <RateList
              entries={entries}
              type="supply"
              onSupply={(entry) => {
                const ethProtocol = PROTOCOL_TO_ETH[entry.protocol];
                if (ethProtocol) onSupply(token, ethProtocol, entry);
              }}
              onBorrow={(entry) => {
                const ethProtocol = PROTOCOL_TO_ETH[entry.protocol];
                if (ethProtocol) onBorrow(token, ethProtocol, entry);
              }}
            />
          </div>
          <div className="flex-1 p-4">
            <RateList
              entries={entries}
              type="borrow"
              onSupply={(entry) => {
                const ethProtocol = PROTOCOL_TO_ETH[entry.protocol];
                if (ethProtocol) onSupply(token, ethProtocol, entry);
              }}
              onBorrow={(entry) => {
                const ethProtocol = PROTOCOL_TO_ETH[entry.protocol];
                if (ethProtocol) onBorrow(token, ethProtocol, entry);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const queryClient = new QueryClient();

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const wagmiAdapter = new WagmiAdapter({
    networks: [
      mainnet,
      arbitrum,
      optimism,
      base,
      polygon,
      avalanche,
      linea,
      scroll,
      celo,
      plasma,
      sepolia,
      baseSepolia,
    ],
    projectId: import.meta.env.VITE_REOWN_ID!,
  });
  const solanaAdapter = new SolanaAdapter({
    // config here
  });

  return (
    <AppKitProvider
      projectId={import.meta.env.VITE_REOWN_ID!}
      adapters={[wagmiAdapter, solanaAdapter]}
      networks={[
        mainnet,
        arbitrum,
        optimism,
        base,
        polygon,
        avalanche,
        linea,
        scroll,
        celo,
        plasma,
        sepolia,
        baseSepolia,
      ]}
    >
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AppInner />
        </QueryClientProvider>
      </WagmiProvider>
    </AppKitProvider>
  );
}

function AppInner() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [aaveFlat, setAaveFlat] = useState<AaveApyFlat | null>(null);
  const [compoundAPY, setCompoundAPY] = useState<Record<string, number> | null>(null);
  const [kaminoAPY, setKaminoAPY] = useState<Record<string, number> | null>(null);
  const [sparkAPY, setSparkAPY] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);

  const numericChainId = chainId
    ? typeof chainId === "string" ? Number(chainId) : chainId
    : undefined;
  const networkKey: EthNetwork | null = numericChainId
    ? (NETWORK_MAP[numericChainId] as EthNetwork) ?? null
    : null;

  const aavePoolAddress = networkKey
    ? (PROTOCOL_CONFIG.aave.poolAddresses[networkKey] ?? undefined)
    : undefined;

  const { accountData, supplied, borrowed, isLoading: positionLoading, refetch: refetchPosition } = useUserPosition(
    aavePoolAddress,
    address,
    networkKey,
  );

  const adapter = useProtocolAdapter(modal?.protocol ?? null);
  const { switchChainAsync } = useSwitchChain();

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

  async function switchToNetwork(targetKey: EthNetwork): Promise<boolean> {
    const targetChainId = ETH_NETWORK_CHAIN_IDS[targetKey];
    if (!targetChainId) return false;
    if (numericChainId === targetChainId) return true;
    try {
      await switchChainAsync({ chainId: targetChainId });
      return true;
    } catch {
      return false;
    }
  }

  async function handleSupply(token: Token, protocol: EthProtocol, entry: RateEntry) {
    const targetKey = UPPER_NETWORK_TO_ETH[entry.network];
    if (!targetKey) return;
    const tokenAddress = TOKEN_ADDRESSES[targetKey]?.[token];
    if (!tokenAddress) return;
    if (!(await switchToNetwork(targetKey))) return;
    setModal({ kind: "supply", token, tokenAddress, protocol, networkKey: targetKey, supplyApy: entry.supplyAPY });
  }

  async function handleBorrow(token: Token, protocol: EthProtocol, entry: RateEntry) {
    const targetKey = UPPER_NETWORK_TO_ETH[entry.network];
    if (!targetKey) return;
    const tokenAddress = TOKEN_ADDRESSES[targetKey]?.[token];
    if (!tokenAddress) return;
    if (!(await switchToNetwork(targetKey))) return;
    setModal({ kind: "borrow", token, tokenAddress, protocol, networkKey: targetKey, borrowApy: entry.borrowAPY });
  }

  function handleWithdraw(asset: SuppliedAsset) {
    if (!networkKey) return;
    setModal({ kind: "withdraw", asset, protocol: "aave", networkKey });
  }

  function handleRepay(asset: BorrowedAsset) {
    if (!networkKey) return;
    setModal({ kind: "repay", asset, protocol: "aave", networkKey });
  }

  return (
    <>
      <AppKitButton />

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

        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {/* Portfolio summary (with expandable supplied/borrowed sections) */}
          {isConnected && (
            <PortfolioSummary
              accountData={accountData}
              isLoading={positionLoading}
              supplied={supplied}
              borrowed={borrowed}
              onWithdraw={handleWithdraw}
              onRepay={handleRepay}
            />
          )}

          {/* Rate cards */}
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
              onSupply={handleSupply}
              onBorrow={handleBorrow}
            />
          ))}
        </div>

        {/* Footer */}
        <p className="max-w-2xl mx-auto mt-10 text-[10px] font-mono tracking-widest uppercase text-zinc-700 text-center">
          Supply ranked highest → lowest · Borrow ranked lowest → highest · #1 =
          best rate
        </p>
      </div>

      {/* Modals */}
      {modal?.kind === "supply" && adapter && address && (
        <SupplyModal
          token={modal.token}
          tokenAddress={modal.tokenAddress}
          networkKey={modal.networkKey}
          adapter={adapter}
          userAddress={address as `0x${string}`}
          supplyApy={modal.supplyApy}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); refetchPosition(); }}
        />
      )}
      {modal?.kind === "borrow" && adapter && address && (
        <BorrowModal
          token={modal.token}
          tokenAddress={modal.tokenAddress}
          networkKey={modal.networkKey}
          adapter={adapter}
          userAddress={address as `0x${string}`}
          borrowApy={modal.borrowApy}
          accountData={accountData}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); refetchPosition(); }}
        />
      )}
      {modal?.kind === "withdraw" && adapter && address && (
        <WithdrawModal
          token={modal.asset.token}
          tokenAddress={modal.asset.tokenAddress}
          networkKey={modal.networkKey}
          adapter={adapter}
          userAddress={address as `0x${string}`}
          suppliedBalance={modal.asset.balance}
          decimals={modal.asset.decimals}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); refetchPosition(); }}
        />
      )}
      {modal?.kind === "repay" && adapter && address && (
        <RepayModal
          token={modal.asset.token}
          tokenAddress={modal.asset.tokenAddress}
          networkKey={modal.networkKey}
          adapter={adapter}
          userAddress={address as `0x${string}`}
          debt={modal.asset.debt}
          decimals={modal.asset.decimals}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); refetchPosition(); }}
        />
      )}
    </>
  );
}
