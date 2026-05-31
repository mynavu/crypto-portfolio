import { Address, EthNetwork } from "../shared.types";

export interface SupplyParams {
  tokenAddress: Address;
  amount: bigint;
  userAddress: Address;
  networkKey: EthNetwork;
}

export interface BorrowParams {
  tokenAddress: Address;
  amount: bigint;
  userAddress: Address;
  networkKey: EthNetwork;
}

export interface RepayParams {
  tokenAddress: Address;
  amount: bigint;
  userAddress: Address;
  networkKey: EthNetwork;
}

export interface WithdrawParams {
  tokenAddress: Address;
  amount: bigint;
  userAddress: Address;
  networkKey: EthNetwork;
}

export interface LendingAdapter {
  supply(params: SupplyParams): Promise<void>;
  borrow(params: BorrowParams): Promise<void>;
  repay(params: RepayParams): Promise<void>;
  withdraw(params: WithdrawParams): Promise<void>;
}
