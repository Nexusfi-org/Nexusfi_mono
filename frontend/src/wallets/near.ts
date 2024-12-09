import { createContext } from "react";
import { providers, utils } from "near-api-js";
import "@near-wallet-selector/modal-ui/styles.css";
import { setupModal } from "@near-wallet-selector/modal-ui";
import {
  setupWalletSelector,
  NetworkId,
  WalletSelector,
} from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupBitteWallet } from "@near-wallet-selector/bitte-wallet";
import { wagmiConfig, web3Modal } from "@/wallets/web3modal";
import { setupEthereumWallets } from "@near-wallet-selector/ethereum-wallets";

const THIRTY_TGAS = "30000000000000";
const NO_DEPOSIT = "0";

interface WalletOptions {
  networkId?: NetworkId;
  createAccessKeyFor?: string;
}

type AccountChangeHook = (signedAccountId: string) => void;

interface CallMethodOptions {
  contractId: string;
  method: string;
  args?: Record<string, unknown>;
  gas?: string;
  deposit?: string;
}

interface ViewMethodOptions {
  contractId: string;
  method: string;
  args?: Record<string, unknown>;
}

interface SignAndSendTransactionsOptions {
  transactions: Array<{
    receiverId: string;
    actions: Array<{
      type: string;
      params: Record<string, unknown>;
    }>;
  }>;
}

export class Wallet {
  private createAccessKeyFor: string | undefined;
  private networkId: NetworkId;
  private selector!: Promise<WalletSelector>;

  constructor({
    networkId = "testnet",
    createAccessKeyFor,
  }: WalletOptions = {}) {
    this.createAccessKeyFor = createAccessKeyFor;
    this.networkId = networkId;
  }

  startUp = async (accountChangeHook: AccountChangeHook): Promise<string> => {
    this.selector = setupWalletSelector({
      network: this.networkId,
      modules: [
        setupMyNearWallet(),
        setupHereWallet(),
        setupLedger(),
        setupMeteorWallet(),
        setupSender(),
        setupBitteWallet(),
        setupEthereumWallets({
          //@ts-ignore
          wagmiConfig: wagmiConfig,
          //@ts-ignore
          web3Modal: web3Modal,
          alwaysOnboardDuringSignIn: true,
        }),
      ],
    });

    const walletSelector = await this.selector;
    const isSignedIn = walletSelector.isSignedIn();
    const accountId = isSignedIn
      ? walletSelector.store.getState().accounts[0].accountId
      : "";

    walletSelector.store.observable.subscribe(async (state) => {
      const signedAccount = state?.accounts.find(
        (account) => account.active
      )?.accountId;
      accountChangeHook(signedAccount || "");
    });

    return accountId;
  };

  signIn = async (): Promise<void> => {
    if (!this.createAccessKeyFor) {
      throw new Error("createAccessKeyFor is required for signing in");
    }
    const modal = setupModal(await this.selector, {
      contractId: this.createAccessKeyFor,
    });
    modal.show();
  };

  signOut = async (): Promise<void> => {
    const selectedWallet = await (await this.selector).wallet();
    selectedWallet.signOut();
  };

  viewMethod = async ({
    contractId,
    method,
    args = {},
  }: ViewMethodOptions): Promise<unknown> => {
    const url = `https://rpc.${this.networkId}.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    const res = (await provider.query({
      request_type: "call_function",
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    })) as unknown as { result: Uint8Array };
    return JSON.parse(Buffer.from(res.result).toString());
  };

  callMethod = async ({
    contractId,
    method,
    args = {},
    gas = THIRTY_TGAS,
    deposit = NO_DEPOSIT,
  }: CallMethodOptions): Promise<unknown> => {
    const selectedWallet = await (await this.selector).wallet();
    const outcome = (await selectedWallet.signAndSendTransaction({
      receiverId: contractId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: method,
            args,
            gas,
            deposit,
          },
        },
      ],
    })) as providers.FinalExecutionOutcome;

    return providers.getTransactionLastResult(outcome);
  };

  getTransactionResult = async (txhash: string): Promise<unknown> => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    const transaction = await provider.txStatus(txhash, "unnused");
    return providers.getTransactionLastResult(transaction);
  };

  getBalance = async (accountId: string): Promise<number> => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    const account = await provider.query({
      request_type: "view_account",
      account_id: accountId,
      finality: "final",
    });
    //@ts-ignore
    return account.amount
      ? //@ts-ignore
        Number(utils.format.formatNearAmount(account.amount))
      : 0;
  };

  signAndSendTransactions = async ({
    transactions,
  }: SignAndSendTransactionsOptions): Promise<unknown> => {
    const selectedWallet = await (await this.selector).wallet();
    //@ts-ignore
    return selectedWallet.signAndSendTransactions({ transactions });
  };

  getAccessKeys = async (accountId: string): Promise<Array<unknown>> => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    const keys = await provider.query({
      request_type: "view_access_key_list",
      account_id: accountId,
      finality: "final",
    });
    //@ts-ignore
    return keys.keys;
  };
}

interface NearContext {
  wallet: Wallet | undefined;
  signedAccountId: string;
}

export const NearContext = createContext<NearContext>({
  wallet: undefined,
  signedAccountId: "",
});
