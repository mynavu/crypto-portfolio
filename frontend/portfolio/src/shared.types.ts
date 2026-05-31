type Asset = "USDC" | "USDT" | "ETH" | "BTC" | "SOL";
type Token = "usdc" | "usdt" | "btc" | "eth" | "sol";
type EthNetwork =
  | "ethereum"
  | "arbitrum"
  | "optimism"
  | "base"
  | "base_sepolia"
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

export type UserAccountData = {
  totalCollateralUsd: number;
  totalDebtUsd: number;
  availableBorrowsUsd: number;
  currentLiquidationThreshold: number;
  ltv: number;
  healthFactor: number | null; // null = infinite (no debt)
};

export type SuppliedAsset = {
  token: string;
  tokenAddress: Address;
  aTokenAddress: Address;
  balance: bigint;
  decimals: number;
};

export type BorrowedAsset = {
  token: string;
  tokenAddress: Address;
  debtTokenAddress: Address;
  debt: bigint;
  decimals: number;
};

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
