import { Web3 } from "web3";
import { bufferToHex } from "@ethereumjs/util";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  uncompressedHexPointToEvmAddress,
} from "./kdf";
import { Common } from "@ethereumjs/common";
import { Contract, JsonRpcProvider } from "ethers";
import { parseNearAmount } from "near-api-js/lib/utils/format";

interface WalletInterface {
  callMethod: (params: {
    contractId: string;
    method: string;
    args: any;
    gas: string;
    deposit: string;
  }) => Promise<{
    big_r: {
      affine_point: string;
    };
    s: {
      scalar: string;
    };
    recovery_id: number;
  }>;
}

interface GasPrices {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

interface TransactionPayloadResult {
  transaction: FeeMarketEIP1559Transaction;
  payload: Uint8Array;
}

interface DerivedAddress {
  publicKey: Buffer;
  address: string;
}

interface SignatureComponents {
  big_r: {
    affine_point: string;
  };
  s: {
    scalar: string;
  };
  recovery_id: number;
}

export class Ethereum {
  private web3: Web3;
  private provider: JsonRpcProvider;
  private chain_id: number;

  constructor(chain_rpc: string, chain_id: number) {
    this.web3 = new Web3(chain_rpc);
    this.provider = new JsonRpcProvider(chain_rpc);
    this.chain_id = chain_id;
    this.queryGasPrice();
  }

  async deriveAddress(
    accountId: string,
    derivation_path: string
  ): Promise<DerivedAddress> {
    const publicKey = await deriveChildPublicKey(
      najPublicKeyStrToUncompressedHexPoint(),
      accountId,
      derivation_path
    );
    const address = await uncompressedHexPointToEvmAddress(publicKey);
    return { publicKey: Buffer.from(publicKey, "hex"), address };
  }

  async queryGasPrice(): Promise<GasPrices> {
    const maxFeePerGas = await this.web3.eth.getGasPrice();
    const maxPriorityFeePerGas = await this.web3.eth.getMaxPriorityFeePerGas();
    return { maxFeePerGas, maxPriorityFeePerGas };
  }

  async getBalance(accountId: string): Promise<string> {
    const balance = await this.web3.eth.getBalance(accountId);
    return this.web3.utils.fromWei(balance, "ether");
  }

  async getContractViewFunction(
    receiver: string,
    abi: any[],
    methodName: string,
    args: any[] = []
  ): Promise<any> {
    const contract = new Contract(receiver, abi, this.provider);
    return await contract[methodName](...args);
  }

  createTransactionData(
    receiver: string,
    abi: any[],
    methodName: string,
    args: any[] = []
  ): string {
    const contract = new Contract(receiver, abi);
    return contract.interface.encodeFunctionData(methodName, args);
  }

  async createPayload(
    sender: string,
    receiver: string,
    amount: string,
    data?: string
  ): Promise<TransactionPayloadResult> {
    const common = new Common({ chain: this.chain_id });

    // Get the nonce & gas price
    const nonce = await this.web3.eth.getTransactionCount(sender);
    const { maxFeePerGas, maxPriorityFeePerGas } = await this.queryGasPrice();

    // Construct transaction
    const transactionData = {
      nonce,
      gasLimit: 50_000n,
      maxFeePerGas,
      maxPriorityFeePerGas,
      to: receiver,
      data: data,
      value: BigInt(this.web3.utils.toWei(amount, "ether")),
      chain: this.chain_id,
    };

    // Create a transaction
    const transaction = FeeMarketEIP1559Transaction.fromTxData(
      transactionData,
      { common }
    );
    const payload = transaction.getMessageToSign();

    // Store in sessionStorage for later
    sessionStorage.setItem("transaction", transaction.serialize().toString());

    return { transaction, payload };
  }

  async requestSignatureToMPC(
    wallet: WalletInterface,
    contractId: string,
    path: string,
    ethPayload: Uint8Array
  ): Promise<SignatureComponents> {
    // Ask the MPC to sign the payload
    sessionStorage.setItem("derivation", path);

    const payload = Array.from(ethPayload);
    return await wallet.callMethod({
      contractId,
      method: "sign",
      args: {
        request: {
          payload,
          path,
          key_version: 0,
        },
      },
      gas: "250000000000000",
      //@ts-ignore
      deposit: parseNearAmount("0.25"),
    });
  }

  async reconstructSignature(
    big_r: { affine_point: string },
    S: { scalar: string },
    recovery_id: number,
    transaction: FeeMarketEIP1559Transaction
  ): Promise<FeeMarketEIP1559Transaction> {
    // reconstruct the signature
    const r = Buffer.from(big_r.affine_point.substring(2), "hex");
    const s = Buffer.from(S.scalar, "hex");
    const v = recovery_id;
    //@ts-ignore
    const signature = transaction.sign({ v, r, s });
    //@ts-ignore
    if (signature.getValidationErrors().length > 0) {
      throw new Error("Transaction validation errors");
    }
    if (!signature.verifySignature()) {
      throw new Error("Signature is not valid");
    }
    return signature;
  }

  async reconstructSignatureFromLocalSession(
    big_r: { affine_point: string },
    s: { scalar: string },
    recovery_id: number,
    sender: string
  ): Promise<FeeMarketEIP1559Transaction> {
    const serialized = Uint8Array.from(
      JSON.parse(`[${sessionStorage.getItem("transaction")}]`)
    );
    const transaction = FeeMarketEIP1559Transaction.fromSerializedTx(
      Buffer.from(serialized)
    );
    console.log("transaction", transaction);
    return this.reconstructSignature(big_r, s, recovery_id, transaction);
  }

  async relayTransaction(
    signedTransaction: FeeMarketEIP1559Transaction
  ): Promise<string> {
    const serializedTx = bufferToHex(signedTransaction.serialize());
    const relayed = await this.web3.eth.sendSignedTransaction(serializedTx);
    return relayed.transactionHash.toString();
  }
}
