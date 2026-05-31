import { EthNetwork, Address } from "../shared.types";

type ReserveTokenInfo = { aToken: Address; variableDebtToken: Address };

export const RESERVE_TOKENS: Partial<
  Record<EthNetwork, Partial<Record<string, ReserveTokenInfo>>>
> = {
  base_sepolia: {
    usdc: {
      aToken: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC",
      variableDebtToken: "0xFB3e85601b7fEb3691bbb8779Ef0E1069E347204",
    },
    usdt: {
      aToken: "0xcE3CAae5Ed17A7AafCEEbc897DE843fA6CC0c018",
      variableDebtToken: "0xE3C742c88EE6A610157C16b60bBDD62351daeE39",
    },
    eth: {
      aToken: "0x73a5bB60b0B0fc35710DDc0ea9c407031E31Bdbb",
      variableDebtToken: "0x562abf6562d6A2b165aDa02b5946bc3E7b4dD653",
    },
  },
};
