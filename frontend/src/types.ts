export interface Index {
  symbols: Symbol[];
}

export interface Symbol {
  symbol: string;
  icon: string;
  percentange: number;
}

export enum Symbols {
  BTC = "PYTH:BTCUSD",
  ETH = "PYTH:ETHUSD",
  AURORA = "PYTH:AURORAUSD",
  USDT = "PYTH:USDTUSD",
  ARB = "PYTH:ARBUSD",
  OP = "PYTH:OPUSD",
}

export interface AssetInfo {
  name: string;
  contract_address: string;
  weight: number;
}

export interface FundMetadata {
  name: string;
  symbol: string;
  description?: string;
  assets: AssetInfo[];
}

export interface Fund {
  metadata: FundMetadata;
  token_address: string;
  total_supply: string;
  creation_timestamp: number;
}
