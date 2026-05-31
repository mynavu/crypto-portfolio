import { erc20Abi } from "viem";
import { compoundAbi } from "../resources/abi";
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

export function createCompoundAdapter(
  writeContractAsync: WriteContractAsync,
  publicClient: PublicClient,
): LendingAdapter {
  return {
    async supply({ tokenAddress, amount, networkKey }: SupplyParams) {
      const poolAddress = PROTOCOL_CONFIG.compound.poolAddresses[networkKey];
      if (!poolAddress) throw new Error(`No Compound pool on ${networkKey}`);
      await approve(writeContractAsync, publicClient, tokenAddress, poolAddress, amount);
      await writeContractAsync({
        address: poolAddress,
        abi: compoundAbi,
        functionName: "supply",
        args: [tokenAddress, amount],
      });
    },

    // Compound: borrowing = withdrawing the base asset
    async borrow({ tokenAddress, amount, networkKey }: BorrowParams) {
      const poolAddress = PROTOCOL_CONFIG.compound.poolAddresses[networkKey];
      if (!poolAddress) throw new Error(`No Compound pool on ${networkKey}`);
      await writeContractAsync({
        address: poolAddress,
        abi: compoundAbi,
        functionName: "withdraw",
        args: [tokenAddress, amount],
      });
    },

    // Compound: repaying = supplying the base asset
    async repay({ tokenAddress, amount, networkKey }: RepayParams) {
      const poolAddress = PROTOCOL_CONFIG.compound.poolAddresses[networkKey];
      if (!poolAddress) throw new Error(`No Compound pool on ${networkKey}`);
      await approve(writeContractAsync, publicClient, tokenAddress, poolAddress, amount);
      await writeContractAsync({
        address: poolAddress,
        abi: compoundAbi,
        functionName: "supply",
        args: [tokenAddress, amount],
      });
    },

    // Compound: withdrawing collateral
    async withdraw({ tokenAddress, amount, networkKey }: WithdrawParams) {
      const poolAddress = PROTOCOL_CONFIG.compound.poolAddresses[networkKey];
      if (!poolAddress) throw new Error(`No Compound pool on ${networkKey}`);
      await writeContractAsync({
        address: poolAddress,
        abi: compoundAbi,
        functionName: "withdraw",
        args: [tokenAddress, amount],
      });
    },
  };
}
