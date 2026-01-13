import { Alchemy, Network } from 'alchemy-sdk'

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_KEY,
  network: Network.ETH_MAINNET,
})

// const balances = await alchemy.core.getTokenBalances(address)




function Portfolio() {
  return <div>Portfolio Component</div>;
}
export default Portfolio;