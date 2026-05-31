import { useReadContract, useReadContracts } from "wagmi";
import { erc20Abi } from "viem";
import { aavePoolReadAbi } from "../resources/abi";
import { RESERVE_TOKENS } from "../resources/reserveTokens";
import { TOKEN_ADDRESSES } from "../resources/tokenAddresses";
import {
  Address,
  EthNetwork,
  UserAccountData,
  SuppliedAsset,
  BorrowedAsset,
} from "../shared.types";

const TOKEN_DECIMALS: Record<string, number> = {
  usdc: 6,
  usdt: 6,
  eth: 18,
  weth: 18,
  btc: 8,
  wbtc: 8,
  sol: 6,
};

export function useUserPosition(
  poolAddress: Address | undefined,
  userAddress: string | undefined,
  networkKey: EthNetwork | null,
) {
  // Phase 1: getUserAccountData
  const { data: accountRaw, isLoading: accountLoading } = useReadContract({
    abi: aavePoolReadAbi,
    address: poolAddress,
    functionName: "getUserAccountData",
    args: userAddress ? [userAddress as Address] : undefined,
    query: {
      enabled: !!poolAddress && !!userAddress,
    },
  });

  // Phase 2: per-asset balances
  const reserveMap = networkKey ? (RESERVE_TOKENS[networkKey] ?? {}) : {};
  const reserveEntries = Object.entries(reserveMap) as [
    string,
    { aToken: Address; variableDebtToken: Address },
  ][];

  const balanceContracts = reserveEntries.flatMap(([, info]) => [
    {
      address: info.aToken,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [userAddress as Address],
    },
    {
      address: info.variableDebtToken,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [userAddress as Address],
    },
  ]);

  const { data: balancesRaw, isLoading: balancesLoading } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: !!userAddress && reserveEntries.length > 0,
    },
  });

  // Parse accountData
  let accountData: UserAccountData | null = null;
  if (accountRaw) {
    const [
      totalCollateralBase,
      totalDebtBase,
      availableBorrowsBase,
      currentLiquidationThreshold,
      ltv,
      healthFactorRaw,
    ] = accountRaw as [bigint, bigint, bigint, bigint, bigint, bigint];

    const hfNum = Number(healthFactorRaw);
    accountData = {
      totalCollateralUsd: Number(totalCollateralBase) / 1e8,
      totalDebtUsd: Number(totalDebtBase) / 1e8,
      availableBorrowsUsd: Number(availableBorrowsBase) / 1e8,
      currentLiquidationThreshold: Number(currentLiquidationThreshold) / 100,
      ltv: Number(ltv) / 100,
      healthFactor: hfNum > 1e30 ? null : hfNum / 1e18,
    };
  }

  // Parse supplied and borrowed
  const supplied: SuppliedAsset[] = [];
  const borrowed: BorrowedAsset[] = [];

  if (balancesRaw && networkKey) {
    const networkTokens = TOKEN_ADDRESSES[networkKey] ?? {};
    reserveEntries.forEach(([tokenKey, info], i) => {
      const aTokenBalResult = balancesRaw[i * 2];
      const debtBalResult = balancesRaw[i * 2 + 1];

      const aTokenBal =
        aTokenBalResult?.status === "success"
          ? (aTokenBalResult.result as bigint)
          : 0n;
      const debtBal =
        debtBalResult?.status === "success"
          ? (debtBalResult.result as bigint)
          : 0n;

      const decimals = TOKEN_DECIMALS[tokenKey] ?? 18;
      const tokenAddress = (networkTokens[tokenKey as keyof typeof networkTokens] ??
        "0x0000000000000000000000000000000000000000") as Address;

      if (aTokenBal > 0n) {
        supplied.push({
          token: tokenKey,
          tokenAddress,
          aTokenAddress: info.aToken,
          balance: aTokenBal,
          decimals,
        });
      }

      if (debtBal > 0n) {
        borrowed.push({
          token: tokenKey,
          tokenAddress,
          debtTokenAddress: info.variableDebtToken,
          debt: debtBal,
          decimals,
        });
      }
    });
  }

  return {
    accountData,
    supplied,
    borrowed,
    isLoading: accountLoading || balancesLoading,
  };
}
