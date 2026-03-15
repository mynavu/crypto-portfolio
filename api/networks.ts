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
export const gnosis_net = new JsonRpcProvider(
  `https://gnosis-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Scroll
export const scroll_net = new JsonRpcProvider(
  `https://scroll-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Linea
export const linea_net = new JsonRpcProvider(
  `https://linea-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Celo
export const celo_net = new JsonRpcProvider(
  `https://celo-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Plasma
export const plasma_net = new JsonRpcProvider(
  `https://plasma-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

// Mantle
export const mantle_net = new JsonRpcProvider(`https://rpc.mantle.xyz`);

// Ronin
export const ronin_net = new JsonRpcProvider(`https://api.roninchain.com/rpc`);

// Unichain
export const unichain_net = new JsonRpcProvider(`https://rpc.unichain.org`);
