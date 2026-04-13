type Asset = "USDC" | "USDT" | "ETH" | "BTC" | "SOL";
type Token = "usdc" | "usdt" | "btc" | "eth" | "sol";
type EthNetwork =
  | "ethereum"
  | "arbitrum"
  | "optimism"
  | "base"
  | "polygon"
  | "avalanche"
  | "linea"
  | "scroll"
  | "celo"
  | "plasma"
  | "sepolia";
type Network =
  | "ethereum"
  | "arbitrum"
  | "optimism"
  | "base"
  | "polygon"
  | "avalanche"
  | "linea"
  | "scroll"
  | "celo"
  | "plasma"
  | "solana";
type UpperCaseNetwork =
  | "Ethereum"
  | "Arbitrum"
  | "Optimism"
  | "Base"
  | "Polygon"
  | "Avalanche"
  | "Linea"
  | "Scroll"
  | "Celo"
  | "Plasma"
  | "Solana";

type EthProtocol = "aave" | "spark" | "compound";
type Address = `0x${string}`;
type Protocol = "AAVE" | "COMPOUND" | "Kamino" | "Spark";

export type {
  Asset,
  Token,
  Network,
  UpperCaseNetwork,
  Address,
  Protocol,
  EthNetwork,
  EthProtocol,
};
