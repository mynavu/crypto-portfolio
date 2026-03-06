import { createSolanaRpc, address } from "@solana/kit";
import { KaminoMarket } from "@kamino-finance/klend-sdk";

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
const marketPubkey = address("DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek");

const slotDuration = 400; // ms
const slot = await rpc.getSlot().send();

const market = await KaminoMarket.load(rpc, marketPubkey, slotDuration);

for (const reserve of market.getReserves()) {
  console.log(`Reserve ${reserve.symbol}:`);
  console.log(`  Deposit TVL: ${reserve.getDepositTvl().toFixed(2)}`);
  console.log(`  Borrow TVL: ${reserve.getBorrowTvl().toFixed(2)}`);
  console.log(`  Borrow APY: ${reserve.totalBorrowAPY(slot)}%`);
  console.log(`  Supply APY: ${reserve.totalSupplyAPY(slot)}%`);
  console.log(`  Utilization: ${reserve.calculateUtilizationRatio()}%`);
}