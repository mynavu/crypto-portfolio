import { Address, EthNetwork, EthProtocol } from "../shared.types";
import { Abi, aavePoolAbi, compoundAbi } from "./abi";

interface config {
  poolAddresses: Partial<Record<EthNetwork, Address>>;
  abi: Abi[];
  type: string;
}

export const PROTOCOL_CONFIG: Record<EthProtocol, config> = {
  aave: {
    poolAddresses: {
      ethereum: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      sepolia: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    },
    abi: aavePoolAbi,
    type: "pool",
  },

  spark: {
    poolAddresses: {
      ethereum: "0xC13e21B648A5Ee794902342038FF3aDAB66BE987",
    },
    abi: aavePoolAbi, // SAME ABI
    type: "pool",
  },

  compound: {
    poolAddresses: {
      ethereum: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
    },
    abi: compoundAbi,
    type: "comet",
  },
} as const;
