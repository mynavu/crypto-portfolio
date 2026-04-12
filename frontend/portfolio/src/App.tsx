import {
  AppKitProvider,
  useAppKitAccount,
  useAppKitNetwork,
  AppKitButton,
} from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import {
  WagmiProvider,
  useSwitchChain,
  useReadContract,
  useWriteContract,
} from "wagmi";
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
} from "viem/chains";
import { useState, useEffect } from "react";
import axios from "axios";
import { TOKEN_ADDRESSES } from "./resources/tokenAddresses";
import { erc20Abi, formatUnits } from "viem";
import { ETH_POOL_ADDRESSES } from "./resources/poolAddresses";
import {
  Asset,
  Token,
  Address,
  Protocol,
  UpperCaseNetwork,
  EthProtocol,
  EthNetwork,
} from "./shared.types";
import { PROTOCOL_CONFIG } from "./resources/protocolConfig";

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

// ─── Constants ────────────────────────────────────────────────────────────────

const assets = ["USDC", "USDT", "ETH", "BTC", "SOL"] as const;

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
  setIsOpen,
  token,
  setDepositTarget,
}: {
  entry: RateEntry;
  type: "supply" | "borrow";
  rank: number;
  setIsOpen: (value: boolean) => void;
  token: Token;
  setDepositTarget: (params: {
    token: Token;
    network: UpperCaseNetwork;
    protocol: Protocol;
  }) => void;
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
    <div>
      <a
        href={entry.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {inner}
      </a>
      <button
        onClick={() => {
          setIsOpen(true);
          setDepositTarget({
            token,
            network: entry.network,
            protocol: entry.protocol,
          });
        }}
      >
        Deposit
      </button>
    </div>
  );
}

function RateList({
  entries,
  type,
  setIsOpen,
  token,
  setDepositTarget,
}: {
  entries: RateEntry[];
  type: "supply" | "borrow";
  setIsOpen: (value: boolean) => void;
  token: Token;
  setDepositTarget: (params: {
    token: Token;
    network: UpperCaseNetwork;
    protocol: Protocol;
  }) => void;
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
          setIsOpen={setIsOpen}
          token={token}
          setDepositTarget={setDepositTarget}
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
  setIsOpen,
  setDepositTarget,
}: {
  asset: Asset;
  entries: RateEntry[];
  loading: boolean;
  setIsOpen: (value: boolean) => void;
  setDepositTarget: (params: {
    token: Token;
    network: UpperCaseNetwork;
    protocol: Protocol;
  }) => void;
}) {
  const accentColor = ASSET_COLORS[asset] ?? "#888";

  const token = AAVE_TOKEN_MAP[asset];
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
              setIsOpen={setIsOpen}
              token={token}
              setDepositTarget={setDepositTarget}
            />
          </div>
          <div className="flex-1 p-4">
            <RateList
              entries={entries}
              type="borrow"
              setIsOpen={setIsOpen}
              token={token}
              setDepositTarget={setDepositTarget}
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
  const [amount, setAmount] = useState("");
  const { chainId } = useAppKitNetwork();
  const { writeContractAsync } = useWriteContract();
  const [aaveFlat, setAaveFlat] = useState<AaveApyFlat | null>(null);
  const [compoundAPY, setCompoundAPY] = useState<Record<string, number> | null>(
    null,
  );
  const [kaminoAPY, setKaminoAPY] = useState<Record<string, number> | null>(
    null,
  );
  const [sparkAPY, setSparkAPY] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [depositTarget, setDepositTarget] = useState<{
    token: Token;
    network: UpperCaseNetwork;
    protocol: Protocol;
  } | null>(null);
  const { switchChain } = useSwitchChain();

  async function approve(
    tokenAddress: Address,
    poolAddress: Address,
    amount: bigint,
  ) {
    await writeContractAsync({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [poolAddress, amount],
    });
  }

  async function deposit({
    protocol,
    networkKey,
    tokenAddress,
    amount,
    userAddress,
  }: {
    protocol: EthProtocol;
    networkKey: EthNetwork;
    tokenAddress: Address;
    amount: bigint;
    userAddress: Address;
  }) {
    const config = PROTOCOL_CONFIG[protocol];
    const contractAddress = config.poolAddresses[networkKey];

    if (!contractAddress) throw new Error("Unsupported network");

    if (protocol === "compound") {
      // Compound
      await writeContractAsync({
        address: contractAddress,
        abi: config.abi,
        functionName: "supply",
        args: [tokenAddress, amount],
      });
    } else {
      // Aave + Spark
      await writeContractAsync({
        address: contractAddress,
        abi: config.abi,
        functionName: "supply",
        args: [tokenAddress, amount, userAddress, 0],
      });
    }
  }

  async function handleDeposit(
    requiredChain: any,
    tokenAddress: Address,
    networkKey: EthNetwork,
  ) {
    if (!address || !tokenAddress || !networkKey || depositTarget === null)
      return;
    if (chainId !== requiredChain) {
      await switchChain({ chainId: requiredChain });
    }

    const poolAddress: Address =
      ETH_POOL_ADDRESSES[networkKey as keyof typeof ETH_POOL_ADDRESSES];

    if (!poolAddress) {
      console.error("Unsupported network for Aave");
      return;
    }

    const parsedAmount = parseInt(amount, 6);
    const parsedAmountBigInt = BigInt(parsedAmount);

    try {
      await approve(tokenAddress, poolAddress, parsedAmountBigInt);

      await deposit({
        protocol: depositTarget.protocol as EthProtocol,
        networkKey,
        tokenAddress,
        amount: parsedAmountBigInt,
        userAddress: address as Address,
      });

      console.log("Deposit successful");
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  }

  type depositModalProps = {
    token: Token;
    setIsOpen: (value: boolean) => void;
  };

  function DepositModal({ token, setIsOpen }: depositModalProps) {
    if (!chainId) return null;

    const numericChainId =
      typeof chainId === "string" ? Number(chainId) : chainId;

    const networkKey = NETWORK_MAP[numericChainId];
    if (!networkKey) return <p>Unsupported network</p>;

    const tokenAddress = TOKEN_ADDRESSES[networkKey][token];
    if (!tokenAddress) return <p>Unsupported token</p>;

    const { data: balance } = useReadContract({
      abi: erc20Abi,
      address: tokenAddress ? (tokenAddress as Address) : undefined,
      functionName: "balanceOf",
      args: address ? [address as Address] : undefined,
      query: {
        enabled: !!address && !!tokenAddress,
      },
    });

    return (
      <dialog open={isOpen}>
        <p>Coin: {depositTarget?.token}</p>
        <p>Network: {depositTarget?.network}</p>
        <p>Protocol: {depositTarget?.protocol}</p>
        <p>Balance: {balance ? formatUnits(balance, 6) : "0"}</p>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
        />
        <button
          onClick={() => {
            handleDeposit(numericChainId, tokenAddress, networkKey);
            setIsOpen(false); // closes the modal
          }}
        >
          Confirm Deposit
        </button>
      </dialog>
    );
  }

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
    <>
      <AppKitButton />
      {isConnected && <p>Wallet Connected</p>}
      {isOpen && depositTarget !== null && (
        <DepositModal token={depositTarget.token} setIsOpen={setIsOpen} />
      )}
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
              setIsOpen={setIsOpen}
              setDepositTarget={setDepositTarget}
            />
          ))}
        </div>

        {/* Footer */}
        <p className="max-w-2xl mx-auto mt-10 text-[10px] font-mono tracking-widest uppercase text-zinc-700 text-center">
          Supply ranked highest → lowest · Borrow ranked lowest → highest · #1 =
          best rate
        </p>
      </div>
    </>
  );
}
