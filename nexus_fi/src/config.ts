const contractPerNetwork = {
  mainnet: "hello.near-examples.near",
  testnet: "indexer-3.testnet",
};

const tokenContractPerNetwork = {
  testnet: "index-5.testnet",
};

const usdtContract = {
  testnet: "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af",
};

// Chains for EVM Wallets
const evmWalletChains = {
  mainnet: {
    chainId: 397,
    name: "Near Mainnet",
    explorer: "https://eth-explorer.near.org",
    rpc: "https://eth-rpc.mainnet.near.org",
  },
  testnet: {
    chainId: 398,
    name: "Near Testnet",
    explorer: "https://eth-explorer-testnet.near.org",
    rpc: "https://eth-rpc.testnet.near.org",
  },
};

export const NetworkId = "testnet";
export const IndexFundContract = contractPerNetwork[NetworkId];
export const IndexFundTokenContract = tokenContractPerNetwork[NetworkId];
export const UsdtContract = usdtContract[NetworkId];
export const EVMWalletChain = evmWalletChains[NetworkId];
