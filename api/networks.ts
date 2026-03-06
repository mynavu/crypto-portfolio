import { JsonRpcProvider } from "ethers";

// Ethereum
export const ethereum_net = new JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Arbitrum
export const arbitrum_net = new JsonRpcProvider(
  `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Optimism
export const optimism_net = new JsonRpcProvider(
  `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Polygon
export const polygon_net = new JsonRpcProvider(
  `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Base
export const base_net = new JsonRpcProvider(
  `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Avalanche
export const avalanche_net = new JsonRpcProvider(
  `https://api.avax.network/ext/bc/C/rpc`,
);

// Gnosis
export const gnosis_net = new JsonRpcProvider(`https://rpc.gnosischain.com`);

// Scroll
export const scroll_net = new JsonRpcProvider(`https://rpc.scroll.io`);

// Linea
export const linea_net = new JsonRpcProvider(`https://rpc.linea.build`);

// Mantle
export const mantle_net = new JsonRpcProvider(`https://rpc.mantle.xyz`);

// Ronin
export const ronin_net = new JsonRpcProvider(`https://api.roninchain.com/rpc`);

// Unichain
export const unichain_net = new JsonRpcProvider(`https://rpc.unichain.org`);
