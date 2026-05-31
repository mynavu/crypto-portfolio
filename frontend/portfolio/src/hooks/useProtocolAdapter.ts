import { useMemo } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { createAaveAdapter, createSparkAdapter } from "../adapters/aave";
import { createCompoundAdapter } from "../adapters/compound";
import { EthProtocol } from "../shared.types";
import { LendingAdapter } from "../adapters/types";

export function useProtocolAdapter(protocol: EthProtocol | null): LendingAdapter | null {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMemo(() => {
    if (!protocol) return null;
    if (protocol === "aave") return createAaveAdapter(writeContractAsync, publicClient);
    if (protocol === "spark") return createSparkAdapter(writeContractAsync, publicClient);
    if (protocol === "compound") return createCompoundAdapter(writeContractAsync, publicClient);
    return null;
  }, [protocol, writeContractAsync, publicClient]);
}
