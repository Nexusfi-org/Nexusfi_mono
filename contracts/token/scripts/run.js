const { connect, keyStores, KeyPair } = require("near-api-js");
const BN = require("bn.js");
const { sendRawTransaction, getNonce, getGasDetails } = require('./ethHelpers');
const { JsonRpcProvider } = require("@near-js/providers");

const USDC_CONTRACT_ID = "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af"; // Replace with your actual contract ID
const ADMIN_ACCOUNT_ID = "musictest1.testnet"; // Replace with your admin account ID
const ADMIN_PRIVATE_KEY = "ed25519:57UVq1SQsxXWmEJEK3FSksZsjf3n27hSmogU69gynSoXWskM9bUPZC2FyuGQY4JD28HTubi1fhesQaYDB1Avt23S"; // Replace with your admin private key
const NETWORK_ID = "testnet"; // Use "mainnet" for production
const BRIDGE_CONTRACT_ID = "simple-bridge.testnet"; // Replace with the actual bridge contract ID

const keyStore = new keyStores.InMemoryKeyStore();
const config = {
  networkId: NETWORK_ID,
  keyStore: keyStore,
  nodeUrl: `https://rpc.${NETWORK_ID}.near.org`,
  walletUrl: `https://wallet.${NETWORK_ID}.near.org`,
  helperUrl: `https://helper.${NETWORK_ID}.near.org`,
  explorerUrl: `https://explorer.${NETWORK_ID}.near.org`,
};

async function bridgeUSDC(senderAccount, recieverId, bridgeRequest, amount) {
  const result = await senderAccount.functionCall({
    contractId: USDC_CONTRACT_ID, //USDC contract
    methodName: "ft_transfer_call",
    args: { 
      amount: amount,
      receiver_id: recieverId,
      msg: JSON.stringify(bridgeRequest)
    },
    gas: new BN("300000000000000"), // 300 TGas
    attachedDeposit: new BN("1"),
  });
  return result;
}

async function fetchNearView(
  accountId,
  methodName,
  argsBase64,
){
  const provider = new JsonRpcProvider({
    url: "https://rpc.testnet.near.org",
  });
  const result = await provider.query({
    request_type: "call_function",
    account_id: accountId,
    args_base64: "",
    method_name: methodName,
    finality: "optimistic",
  });
  console.log("Result:", result);
  const resultBytes = result.result;
  const resultString = String.fromCharCode(...resultBytes);
  return JSON.parse(resultString);
}

async function main() {
  //Set up admin account
  const adminKeyPair = KeyPair.fromString(ADMIN_PRIVATE_KEY);
  await keyStore.setKey(NETWORK_ID, ADMIN_ACCOUNT_ID, adminKeyPair);
  
  const near = await connect(config);
  const adminAccount = await near.account(ADMIN_ACCOUNT_ID);

  // Add the key to the contract using admin account
  const amount = "100000"; 

  // claim reciever
  const ethReciever = "8530748420d2A67D59E1fb0d2f33b71B51Ff3965"; // Replace with the actual ETH address
  
  const usdcEthTreasury = "0xd6cEefFa721575c53181346b6cC49647167085c7"; // Need this for finding out nonce. This is controlled by Near smart contract

  const {maxPriorityFeePerGas, maxFeePerGas} = await getGasDetails();
  const eth_nonce = await getNonce(usdcEthTreasury);
  
  const networkDetails = {
    max_priority_fee_per_gas: Number(maxPriorityFeePerGas), 
    max_fee_per_gas: Number(maxFeePerGas),
    gas_limit: 60000,
    chain_id: 11155111, // Sepolia testnet
    eth_nonce: eth_nonce, // Replace with the actual nonce
  };
  console.log("Network details:", networkDetails);

  const bridgeRequest ={
    eth_address: ethReciever,
    network_details: networkDetails,
  }

  // Claim tokens using the contract account with the new access key
  const result = await bridgeUSDC(adminAccount, BRIDGE_CONTRACT_ID, bridgeRequest, amount);

  console.log('NEAR contract call result:', result);

  const signedTxBytes = await fetchNearView(BRIDGE_CONTRACT_ID, "get_latest_signed_tx");

  console.log('Received signedTxBytes:', signedTxBytes);

  // Send the transaction to Ethereum
  try {
      const txHash = await sendRawTransaction(signedTxBytes);
      console.log('Ethereum transaction hash:', txHash);
  } catch (error) {
      console.error('Failed to send Ethereum transaction:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });