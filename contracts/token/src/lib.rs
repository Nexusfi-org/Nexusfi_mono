use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near_bindgen, AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseError,
    PromiseOrValue,
};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use crate::signer::mpc;

mod models;
mod signer;

use models::EVMTransactionWrapper;
use omni_transaction::evm::evm_transaction::EVMTransaction;
use omni_transaction::evm::types::Signature as OmniSignature;
use omni_transaction::evm::utils::parse_eth_address;
use omni_transaction::transaction_builder::{TransactionBuilder, TxBuilder};
use omni_transaction::types::EVM;
use signer::{ SignResult, SignRequest };

// Constants
const MPC_CONTRACT_ACCOUNT_ID: &str = "v1.signer-prod.testnet";
const ETH_TREASURY_PATH: &str = "eth-treasury";
const AURORA_TREASURY_PATH: &str = "aurora-treasury";

pub static TOKEN_ADDRESSES: Lazy<HashMap<&str, &str>> = Lazy::new(|| {
    let mut m = HashMap::new();
    m.insert(
        "0xe09D8aDae1141181f4CddddeF97E4Cf68f5436E6",
        "aurora.fakes.testnet",
    );
    m.insert(
        "0x2e5221B0f855Be4ea5Cefffb8311EED0563B6e87",
        "weth.fakes.testnet",
    );
    m.insert(
        "0xf08a50178dfcde18524640ea6618a1f965821715",
        "usdc.fakes.testnet",
    );
    m
});

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct AssetInfo {
    pub name: String,
    pub contract_address: String,
    pub weight: u8,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct WithdrawRequest {
    pub eth_destination: String,
    pub aurora_destination: String,
    pub network_details: NetworkDetails,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct NetworkDetails {
    pub chain_id: u64,
    pub eth_nonce: u64,
    pub max_priority_fee_per_gas: u128,
    pub max_fee_per_gas: u128,
    pub gas_limit: u128,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct PriceFeedInfo {
    pub asset_address: String,
    pub price: U128,
    pub decimals: u8,
    pub last_updated: u64,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct OraclePriceData {
    pub timestamp: String,
    pub recency_duration_sec: u64,
    pub prices: Vec<AssetPrice>,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AssetPrice {
    pub asset_id: String,
    pub price: Option<PriceData>,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct PriceData {
    pub multiplier: String,
    pub decimals: u32,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub total_assets: U128,
    pub assets: Vec<AssetInfo>,
    pub owner_id: AccountId,
    pub user_balances: HashMap<AccountId, HashMap<String, U128>>,
    pub usdc_contract: AccountId,
    pub oracle_contract: AccountId,
    pub latest_signed_txs: Vec<Vec<u8>>,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(
        owner_id: AccountId,
        assets: Vec<AssetInfo>,
        usdc_contract: AccountId,
        oracle_contract: AccountId,
    ) -> Self {
        assert!(!env::state_exists(), "Contract is already initialized");
        let total_weight: u8 = assets.iter().map(|a| a.weight).sum();
        assert_eq!(total_weight, 100, "Total weight of assets must equal 100%");

        Self {
            total_assets: U128(0),
            assets,
            owner_id,
            user_balances: HashMap::new(),
            usdc_contract: "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af".parse::<AccountId>().unwrap(),
            oracle_contract: "priceoracle.testnet".parse::<AccountId>().unwrap(),
            latest_signed_txs: Vec::new(),
        }
    }

    pub fn get_assets(&self) -> Vec<AssetInfo> {
        self.assets.clone()
    }

    pub fn get_total_assets(&self) -> U128 {
        self.total_assets
    }

    pub fn get_user_balance(&self, account_id: &AccountId) -> Option<&HashMap<String, U128>> {
        self.user_balances.get(account_id)
    }

    // Price Feed Functions
    pub fn get_current_prices(&self) -> Promise {
        Promise::new(self.oracle_contract.clone())
            .function_call(
                "get_price_data".to_string(),
                Vec::new(),
                NearToken::from_near(0),
                Gas::from_tgas(100),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(Gas::from_tgas(50))
                    .get_prices_callback(),
            )
    }

    pub fn get_prices_callback(
        &self,
        #[callback_result] call_result: Result<OraclePriceData, PromiseError>,
    ) -> Vec<PriceFeedInfo> {
        let price_data = match call_result {
            Ok(data) => data,
            Err(_) => env::panic_str("Failed to fetch price data from oracle"),
        };

        let mut price_feeds = Vec::new();

        let timestamp = price_data.timestamp.parse::<u64>().unwrap_or(0);
        let current_time = env::block_timestamp();

        if current_time - timestamp > price_data.recency_duration_sec * 1_000_000_000 {
            env::panic_str("Price data is too old");
        }

        for price in price_data.prices {
            if let Some(price_info) = price.price {
                if let Some(&near_address) = TOKEN_ADDRESSES.get(price.asset_id.as_str()) {
                    price_feeds.push(PriceFeedInfo {
                        asset_address: near_address.to_string(),
                        price: U128(price_info.multiplier.parse().unwrap_or(0)),
                        decimals: price_info.decimals as u8,
                        last_updated: timestamp,
                    });
                }
            }
        }

        price_feeds
    }

    pub fn get_asset_price(&self, asset_address: String) -> Promise {
        self.get_current_prices().then(
            Self::ext(env::current_account_id())
                .with_static_gas(Gas::from_tgas(50))
                .get_single_price_callback(asset_address),
        )
    }

    pub fn get_single_price_callback(
        &self,
        asset_address: String,
        #[callback_result] price_feeds_result: Result<Vec<PriceFeedInfo>, PromiseError>,
    ) -> Option<PriceFeedInfo> {
        let price_feeds = match price_feeds_result {
            Ok(feeds) => feeds,
            Err(_) => env::panic_str("Failed to fetch price feeds"),
        };

        price_feeds
            .into_iter()
            .find(|feed| feed.asset_address == asset_address)
    }

    pub fn get_portfolio_value(&self, account_id: AccountId) -> Promise {
        let balances = self
            .get_user_balance(&account_id)
            .expect("No balance found for user");

        self.get_current_prices().then(
            Self::ext(env::current_account_id())
                .with_static_gas(Gas::from_tgas(50))
                .calculate_portfolio_value_callback(balances.clone()),
        )
    }

    pub fn calculate_portfolio_value_callback(
        &self,
        balances: HashMap<String, U128>,
        #[callback_result] price_feeds_result: Result<Vec<PriceFeedInfo>, PromiseError>,
    ) -> U128 {
        let price_feeds = match price_feeds_result {
            Ok(feeds) => feeds,
            Err(_) => env::panic_str("Failed to fetch price feeds"),
        };

        let mut total_value: u128 = 0;

        for (asset_address, balance) in balances {
            if let Some(price_feed) = price_feeds
                .iter()
                .find(|feed| feed.asset_address == asset_address)
            {
                let asset_value = (balance.0 as f64
                    * (price_feed.price.0 as f64 / 10u64.pow(price_feed.decimals as u32) as f64))
                    as u128;
                total_value += asset_value;
            }
        }

        U128(total_value)
    }

    // Withdrawal Functions
    #[payable]
    pub fn withdraw_underlying_assets(&mut self, request: WithdrawRequest) -> Promise {
        let sender_id = env::predecessor_account_id();

        // Clone balances to avoid borrowing issues
        let balances = self
            .user_balances
            .get(&sender_id)
            .expect("No balance found for user")
            .clone();

        // Collect the required data into a temporary vector
        let withdrawals: Vec<_> = self
            .assets
            .iter()
            .filter_map(|asset| {
                balances.get(&asset.contract_address).map(|balance| {
                    let destination = if asset.name == "ETH" {
                        request.eth_destination.clone()
                    } else {
                        request.aurora_destination.clone()
                    };
                    (asset.contract_address.clone(), destination, balance.0)
                })
            })
            .collect();

        // Create promises
        let promises: Vec<Promise> = withdrawals
            .into_iter()
            .map(|(contract_address, destination, amount)| {
                self.create_and_sign_withdrawal(
                    &contract_address, // Pass as &str
                    destination,
                    amount,
                    request.network_details.clone(),
                    if contract_address == ETH_TREASURY_PATH {
                        ETH_TREASURY_PATH
                    } else {
                        AURORA_TREASURY_PATH
                    },
                )
            })
            .collect();

        // Combine promises
        promises
            .into_iter()
            .reduce(|acc, promise| acc.and(promise))
            .unwrap_or_else(|| Promise::new(env::current_account_id()))
    }

    fn construct_erc20_transfer_tx(
        &self,
        token_address: String,
        recipient_address: String,
        amount: u128,
        network_details: NetworkDetails,
    ) -> EVMTransaction {
        let token_address = parse_eth_address(&token_address);
        let recipient_address = parse_eth_address(&recipient_address);

        let data = self.construct_erc20_transfer_data(recipient_address, amount);

        TransactionBuilder::new::<EVM>()
            .nonce(network_details.eth_nonce)
            .to(token_address)
            .value(0)
            .input(data)
            .max_priority_fee_per_gas(network_details.max_priority_fee_per_gas)
            .max_fee_per_gas(network_details.max_fee_per_gas)
            .gas_limit(network_details.gas_limit)
            .chain_id(network_details.chain_id)
            .build()
    }

    fn construct_erc20_transfer_data(&self, to: [u8; 20], amount: u128) -> Vec<u8> {
        let mut data = Vec::new();
        data.extend_from_slice(&[0xa9, 0x05, 0x9c, 0xbb]); // Function selector for "transfer(address,uint256)"
        data.extend_from_slice(&[0; 12]);
        data.extend_from_slice(&to);
        data.extend_from_slice(&[0; 16]);
        data.extend_from_slice(&amount.to_be_bytes());
        data
    }

    pub fn sign_callback(
        &mut self,
        evm_tx_wrapper: EVMTransactionWrapper,
        #[callback_result] result: Result<SignResult, PromiseError>,
    ) -> Vec<u8> {
        let mpc_signature = result.unwrap();
        let big_r = &mpc_signature.big_r.affine_point;
        let s = &mpc_signature.s.scalar;

        let r = &big_r[2..];
        let v = mpc_signature.recovery_id;
        let signature_omni = OmniSignature {
            v,
            r: hex::decode(r).unwrap(),
            s: hex::decode(s).unwrap(),
        };

        let evm_tx = evm_tx_wrapper.to_evm_transaction();
        let signed_tx = evm_tx.build_with_signature(&signature_omni);

        self.latest_signed_txs.push(signed_tx.clone());
        signed_tx
    }

    fn create_and_sign_withdrawal(
        &mut self,
        token_address: &str,
        recipient: String,
        amount: u128,
        network_details: NetworkDetails,
        treasury_path: &str,
    ) -> Promise {
        // Use the construct_erc20_transfer_tx method if you want to keep it
        let omni_tx = self.construct_erc20_transfer_tx(
            token_address.to_string(),
            recipient,
            amount,
            network_details.clone(),
        );

        // Rest of the implementation remains the same
        let encoded_tx = omni_tx.build_for_signing();
        let tx_hash = env::keccak256(&encoded_tx);

        let sign_request = SignRequest {
            payload: tx_hash.to_vec(),
            path: treasury_path.to_string(),
            key_version: 0,
        };

        mpc::ext(MPC_CONTRACT_ACCOUNT_ID.parse().unwrap())
            .with_static_gas(Gas::from_tgas(100))
            .sign(sign_request)
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(Gas::from_tgas(10))
                    .sign_callback(EVMTransactionWrapper::from_evm_transaction(&omni_tx)),
            )
    }

    // View functions
    pub fn get_latest_signed_txs(&self) -> Vec<Vec<u8>> {
        self.latest_signed_txs.clone()
    }

    pub fn get_oracle_contract(&self) -> AccountId {
        self.oracle_contract.clone()
    }

    pub fn process_deposit(&mut self, sender_id: AccountId, amount: U128) {
        let user_balance = self
            .user_balances
            .entry(sender_id.clone())
            .or_insert_with(HashMap::new);

        for asset in &self.assets {
            let weight_fraction = f64::from(asset.weight) / 100.0;
            let asset_amount = (amount.0 as f64 * weight_fraction) as u128;

            user_balance
                .entry(asset.contract_address.clone())
                .and_modify(|balance| *balance = U128(balance.0 + asset_amount))
                .or_insert(U128(asset_amount));
        }

        self.total_assets = U128(self.total_assets.0 + amount.0);

        env::log_str(&format!(
            "Processed deposit for user {} with amount {}",
            sender_id, amount.0
        ));
    }
}

#[near_bindgen]
impl FungibleTokenReceiver for Contract {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        assert_eq!(
            env::predecessor_account_id(),
            self.usdc_contract,
            "Only USDC token is accepted"
        );

        if msg.is_empty() {
            self.process_deposit(sender_id, amount);
            PromiseOrValue::Value(U128(0))
        } else {
            env::log_str(&format!("Unsupported message: {}", msg));
            PromiseOrValue::Value(amount)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    fn get_context(predecessor: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor);
        builder
    }

    #[test]
    fn test_new() {
        let context = get_context(accounts(1));
        testing_env!(context.build());

        let assets = vec![
            AssetInfo {
                name: "ETH".to_string(),
                contract_address: "0x2e5221B0f855Be4ea5Cefffb8311EED0563B6e87".to_string(),
                weight: 70,
            },
            AssetInfo {
                name: "AURORA".to_string(),
                contract_address: "0xe09D8aDae1141181f4CddddeF97E4Cf68f5436E6".to_string(),
                weight: 30,
            },
        ];

        let contract = Contract::new(
            accounts(1),
            assets.clone(),
            "usdc.testnet".parse().unwrap(),
            "priceoracle.testnet".parse().unwrap(),
        );

        assert_eq!(contract.get_number_of_assets(), 2);
        assert_eq!(contract.get_assets(), assets);
    }

    #[test]
    fn test_deposit_and_withdrawal() {
        let mut context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = Contract::new(
            accounts(1),
            vec![
                AssetInfo {
                    name: "ETH".to_string(),
                    contract_address: "0x2e5221B0f855Be4ea5Cefffb8311EED0563B6e87".to_string(),
                    weight: 70,
                },
                AssetInfo {
                    name: "AURORA".to_string(),
                    contract_address: "0xe09D8aDae1141181f4CddddeF97E4Cf68f5436E6".to_string(),
                    weight: 30,
                },
            ],
            "usdc.testnet".parse().unwrap(),
            "priceoracle.testnet".parse().unwrap(),
        );

        // Test deposit
        let amount = U128(1000);
        let result = contract.ft_on_transfer(accounts(2), amount, "".to_string());
        assert!(matches!(result, PromiseOrValue::Value(U128(0))));

        // Test withdrawal request
        let withdraw_request = WithdrawRequest {
            eth_destination: "0x1234...".to_string(),
            aurora_destination: "0x5678...".to_string(),
            network_details: NetworkDetails {
                chain_id: 1,
                eth_nonce: 0,
                max_priority_fee_per_gas: 1000000000,
                max_fee_per_gas: 2000000000,
                gas_limit: 21000,
            },
        };

        let _withdrawal = contract.withdraw_underlying_assets(withdraw_request);
        // Note: Can't fully test withdrawal in unit tests due to cross-contract calls
    }

    #[test]
    fn test_price_feeds() {
        let mut context = get_context(accounts(1));
        testing_env!(context.build());

        let contract = Contract::new(
            accounts(1),
            vec![AssetInfo {
                name: "ETH".to_string(),
                contract_address: "0x2e5221B0f855Be4ea5Cefffb8311EED0563B6e87".to_string(),
                weight: 70,
            }],
            "usdc.testnet".parse().unwrap(),
            "priceoracle.testnet".parse().unwrap(),
        );

        let _prices = contract.get_current_prices();
        // Note: Can't fully test price feeds in unit tests due to cross-contract calls
    }

    #[test]
    #[should_panic(expected = "Only USDC token is accepted")]
    fn test_invalid_token_deposit() {
        let mut context = get_context(accounts(2)); // Different account than USDC contract
        testing_env!(context.build());

        let mut contract = Contract::new(
            accounts(1),
            vec![],
            "usdc.testnet".parse().unwrap(),
            "priceoracle.testnet".parse().unwrap(),
        );

        contract.ft_on_transfer(accounts(3), U128(1000), "".to_string());
    }

    #[test]
    fn test_portfolio_valuation() {
        let mut context = get_context(accounts(1));
        testing_env!(context.build());

        let contract = Contract::new(
            accounts(1),
            vec![AssetInfo {
                name: "ETH".to_string(),
                contract_address: "0x2e5221B0f855Be4ea5Cefffb8311EED0563B6e87".to_string(),
                weight: 70,
            }],
            "usdc.testnet".parse().unwrap(),
            "priceoracle.testnet".parse().unwrap(),
        );

        let _portfolio_value = contract.get_portfolio_value(accounts(1));
        // Note: Can't fully test portfolio valuation in unit tests due to cross-contract calls
    }
}
