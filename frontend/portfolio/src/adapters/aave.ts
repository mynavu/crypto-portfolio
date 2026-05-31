import { erc20Abi } from "viem";
import { aavePoolAbi } from "../resources/abi";
import { PROTOCOL_CONFIG } from "../resources/protocolConfig";
import { Address } from "../shared.types";
import {
  LendingAdapter,
  SupplyParams,
  BorrowParams,
  RepayParams,
  WithdrawParams,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WriteContractAsync = (args: any) => Promise<`0x${string}`>;
type PublicClient =
  | { waitForTransactionReceipt(args: { hash: `0x${string}` }): Promise<unknown> }
  | undefined;

async function approve(
  writeContractAsync: WriteContractAsync,
  publicClient: PublicClient,
  tokenAddress: Address,
  spender: Address,
  amount: bigint,
): Promise<void> {
  const hash = await writeContractAsync({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
  });
  await publicClient?.waitForTransactionReceipt({ hash });
}

function createAaveStyleAdapter(
  writeContractAsync: WriteContractAsync,
  publicClient: PublicClient,
  protocol: "aave" | "spark",
): LendingAdapter {
  return {
    async supply({ tokenAddress, amount, userAddress, networkKey }: SupplyParams) {
      const poolAddress = PROTOCOL_CONFIG[protocol].poolAddresses[networkKey];
      if (!poolAddress) throw new Error(`No pool for ${protocol} on ${networkKey}`);
      await approve(writeContractAsync, publicClient, tokenAddress, poolAddress, amount);
      await writeContractAsync({
        address: poolAddress,
        abi: aavePoolAbi,
        functionName: "supply",
        args: [tokenAddress, amount, userAddress, 0],
      });
    },

    async borrow({ tokenAddress, amount, userAddress, networkKey }: BorrowParams) {
      const poolAddress = PROTOCOL_CONFIG[protocol].poolAddresses[networkKey];
      if (!poolAddress) throw new Error(`No pool for ${protocol} on ${networkKey}`);
      await writeContractAsync({
        address: poolAddress,
        abi: aavePoolAbi,
        functionName: "borrow",
        args: [tokenAddress, amount, 2, 0, userAddress],
      });
    },

    async repay({ tokenAddress, amount, userAddress, networkKey }: RepayParams) {
      const poolAddress = PROTOCOL_CONFIG[protocol].poolAddresses[networkKey];
      if (!poolAddress) throw new Error(`No pool for ${protocol} on ${networkKey}`);
      await approve(writeContractAsync, publicClient, tokenAddress, poolAddress, amount);
      await writeContractAsync({
        address: poolAddress,
        abi: aavePoolAbi,
        functionName: "repay",
        args: [tokenAddress, amount, 2, userAddress],
      });
    },

    async withdraw({ tokenAddress, amount, userAddress, networkKey }: WithdrawParams) {
      const poolAddress = PROTOCOL_CONFIG[protocol].poolAddresses[networkKey];
      if (!poolAddress) throw new Error(`No pool for ${protocol} on ${networkKey}`);
      await writeContractAsync({
        address: poolAddress,
        abi: aavePoolAbi,
        functionName: "withdraw",
        args: [tokenAddress, amount, userAddress],
      });
    },
  };
}

export function createAaveAdapter(
  writeContractAsync: WriteContractAsync,
  publicClient: PublicClient,
): LendingAdapter {
  return createAaveStyleAdapter(writeContractAsync, publicClient, "aave");
}

export function createSparkAdapter(
  writeContractAsync: WriteContractAsync,
  publicClient: PublicClient,
): LendingAdapter {
  return createAaveStyleAdapter(writeContractAsync, publicClient, "spark");
}
