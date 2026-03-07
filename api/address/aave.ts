import { getAddress } from "ethers";

export const aave = {
  arbitrum: {
    USDC: getAddress("0xaf88d065e77c8cc2239327c5edb3a432268e5831"),
    USDT: getAddress("0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"),
    BTC: getAddress("0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f"),
    ETH: getAddress("0x82af49447d8a07e3bd95bd0d56f35241523fbab1"),
  },
  avalanche: {
    USDC: getAddress("0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e"),
    USDT: getAddress("0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7"),
    BTC: getAddress("0x152b9d0fdc40c096757f570a51e494bd4b943e50"),
    ETH: getAddress("0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab"),
  },
  base: {
    USDC: getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"),
    ETH: getAddress("0x4200000000000000000000000000000000000006"),
  },
  ethereum: {
    USDC: getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    USDT: getAddress("0xdac17f958d2ee523a2206206994597c13d831ec7"),
    BTC: getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
    ETH: getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  },
  optimism: {
    USDC: getAddress("0x0b2c639c533813f4aa9d7837caf62653d097ff85"),
    USDT: getAddress("0x94b008aa00579c1307b0ef2c499ad98a8ce58e58"),
    BTC: getAddress("0x68f180fcce6836688e9084f035309e29bf0a2095"),
    ETH: getAddress("0x4200000000000000000000000000000000000006"),
  },
  polygon: {
    USDC: getAddress("0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"),
    USDT: getAddress("0xc2132d05d31c914a87c6611c10748aeb04b58e8f"),
    BTC: getAddress("0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6"),
    ETH: getAddress("0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"),
  },
};
