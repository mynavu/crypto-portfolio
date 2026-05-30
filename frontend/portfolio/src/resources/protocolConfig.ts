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
      arbitrum: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      optimism: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      polygon: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      avalanche: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      base: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
      scroll: "0x11fCfe756c05AD438e312a7fd934381537D3cFfe",
      linea: "0xc47b8C00b0f69a36fa203Ffeac0334874574a8Ac",
      celo: "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402",
      plasma: "0x925a2A7214Ed92428B5b1B090F80b25700095e12",
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
