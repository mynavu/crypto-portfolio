import { Asset, Protocol } from "../shared.types";

export const PROTOCOL_COLORS: Record<Protocol, { color: string; bg: string }> =
  {
    AAVE: { color: "#d885ff", bg: "rgba(103, 34, 135,0.12)" },
    COMPOUND: { color: "#54ff87", bg: "rgba(54, 145, 81, 0.10)" },
    Kamino: { color: "#82daff", bg: "rgba(67, 147, 181, 0.10)" },
    Spark: { color: "#fff178", bg: "rgba(184, 167, 26, 0.10)" },
  };

export const NETWORK_COLORS: Record<string, string> = {
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
  "Base Sepolia": "#6b94ff",
};

export const ASSET_COLORS: Record<Asset, string> = {
  USDC: "#2775ca",
  USDT: "#26a17b",
  ETH: "#627eea",
  BTC: "#f7931a",
  SOL: "#9945ff",
};
