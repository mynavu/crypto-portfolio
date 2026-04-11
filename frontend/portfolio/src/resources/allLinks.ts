const assets = ["USDC", "USDT", "ETH", "BTC", "SOL"] as const;
type Asset = (typeof assets)[number];

export const AAVE_LINKS: Partial<
  Record<Asset, Partial<Record<string, string>>>
> = {
  USDC: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3",
    arbitrum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xff970a61a04b1ca14834a43f5de4533ebddb5cc8&marketName=proto_arbitrum_v3",
    optimism:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x7f5c764cbc14f9669b88837ca1490cca17c31607&marketName=proto_optimism_v3",
    base: "https://app.aave.com/reserve-overview/?underlyingAsset=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&marketName=proto_base_v3",
    polygon:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&marketName=proto_polygon_v3",
    avalanche:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e&marketName=proto_avalanche_v3",
    linea:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x176211869ca2b568f2a7d4ee941e073a821ee1ff&marketName=proto_linea_v3",
    scroll:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4&marketName=proto_scroll_v3",
    celo: "https://app.aave.com/reserve-overview/?underlyingAsset=0xceba9300f2b948710d2653dd7b07f33a8b32118c&marketName=proto_celo_v3",
  },

  USDT: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xdac17f958d2ee523a2206206994597c13d831ec7&marketName=proto_mainnet_v3",
    arbitrum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9&marketName=proto_arbitrum_v3",
    optimism:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x94b008aa00579c1307b0ef2c499ad98a8ce58e58&marketName=proto_optimism_v3",
    polygon:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xc2132d05d31c914a87c6611c10748aeb04b58e8f&marketName=proto_polygon_v3",
    avalanche:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7&marketName=proto_avalanche_v3",
    linea:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xa219439258ca9da29e9cc4ce5596924745e12b93&marketName=proto_linea_v3",
    celo: "https://app.aave.com/reserve-overview/?underlyingAsset=0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e&marketName=proto_celo_v3",
    plasma:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb&marketName=proto_plasma_v3",
  },

  ETH: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&marketName=proto_mainnet_v3",
    arbitrum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x82af49447d8a07e3bd95bd0d56f35241523fbab1&marketName=proto_arbitrum_v3",
    optimism:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x4200000000000000000000000000000000000006&marketName=proto_optimism_v3",
    base: "https://app.aave.com/reserve-overview/?underlyingAsset=0x4200000000000000000000000000000000000006&marketName=proto_base_v3",
    polygon:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x7ceb23fd6bc0add59e62ac25578270cff1b9f619&marketName=proto_polygon_v3",
    avalanche:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab&marketName=proto_avalanche_v3",
    linea:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6&marketName=proto_linea_v3", // WETH on Linea
    scroll:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x5300000000000000000000000000000000000004&marketName=proto_scroll_v3",
    celo: "https://app.aave.com/reserve-overview/?underlyingAsset=0xd221812de1bd094f35587ee8e174b07b6167d9af&marketName=proto_celo_v3",
    plasma:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0xa3d68b74bf0528fdd07263c60d6488749044914b&marketName=proto_plasma_v3", // WETH
  },

  BTC: {
    ethereum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x2260fac5e5542a773aa44fbcfedf7c193bc2c599&marketName=proto_mainnet_v3",
    arbitrum:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f&marketName=proto_arbitrum_v3",
    optimism:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x68f180fcce6836688e9084f035309e29bf0a2095&marketName=proto_optimism_v3",
    base: "",
    polygon:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6&marketName=proto_polygon_v3",
    avalanche:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x50b7545627a5162f82a992c33b87adc75187b218&marketName=proto_avalanche_v3", // WBTC.e
    linea:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4&marketName=proto_linea_v3",
  },
};

export const COMPOUND_LINKS: Partial<
  Record<Asset, Partial<Record<string, string>>>
> = {
  ETH: {
    ethereum: "https://app.compound.finance/markets/weth-mainnet",
    arbitrum: "https://app.compound.finance/markets/weth-arb",
    optimism: "https://app.compound.finance/markets/weth-op",
    base: "https://app.compound.finance/markets/weth-basemainnet",
    linea: "https://app.compound.finance/markets/weth-linea",
  },
  BTC: {
    ethereum: "https://app.compound.finance/markets/wbtc-mainnet",
  },
  USDC: {
    ethereum: "https://app.compound.finance/markets/usdc-mainnet",
    arbitrum: "https://app.compound.finance/markets/usdc-arb",
    optimism: "https://app.compound.finance/markets/usdc-op",
    base: "https://app.compound.finance/markets/usdc-basemainnet",
    linea: "https://app.compound.finance/markets/usdc-linea",
    polygon: "https://app.compound.finance/markets/usdc.e-polygon",
    scroll: "https://app.compound.finance/markets/usdc-scroll",
  },
  USDT: {
    ethereum: "https://app.compound.finance/markets/usdt-mainnet",
    arbitrum: "https://app.compound.finance/markets/usd%E2%82%AE0-arb",
    optimism: "https://app.compound.finance/markets/usdt-op",
    polygon:
      "https://polygonscan.com//address/0xaeB318360f27748Acb200CE616E389A6C9409a07",
  },
};

export const KAMINO_LINKS: Partial<Record<Asset, string>> = {
  USDC: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59",
  USDT: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S",
  ETH: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/febGYTnFX4GbSGoFHFeJXUHgNaK53fB23uDins9Jp1Ej",
  SOL: "https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q",
};

export const SPARK_LINKS: Partial<Record<Asset, string>> = {
  USDC: "https://app.spark.fi/markets/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "https://app.spark.fi/markets/1/0xdAC17F958D2ee523a2206206994597C13D831ec7",
  ETH: "https://app.spark.fi/markets/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  BTC: "https://app.spark.fi/markets/1/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
};
