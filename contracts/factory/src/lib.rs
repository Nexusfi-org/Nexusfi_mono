use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::store::IterableMap;
use near_sdk::{
    env, log, near_bindgen, AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseError,
    PublicKey,
};
use schemars::JsonSchema;
use std::collections::HashMap;
use once_cell::sync::Lazy;

const TGAS: Gas = Gas::from_tgas(1);
const NO_DEPOSIT: NearToken = NearToken::from_near(0);
const DEFAULT_TOKEN_WASM: &[u8] = include_bytes!("./token/token.wasm");

pub static TOKEN_ADDRESSES: Lazy<HashMap<&str, &str>> = Lazy::new(|| {
    let mut m = HashMap::new();
    m.insert("0xe09D8aDae1141181f4CddddeF97E4Cf68f5436E6", "aurora.fakes.testnet");
    m.insert("0x2e5221B0f855Be4ea5Cefffb8311EED0563B6e87", "weth.fakes.testnet");
    m.insert("0xf08a50178dfcde18524640ea6618a1f965821715", "usdc.fakes.testnet");
    m
});

#[derive(Serialize, Deserialize, JsonSchema, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct U128Json {
    value: u128,
}

impl From<U128> for U128Json {
    fn from(u128_value: U128) -> Self {
        Self {
            value: u128_value.0,
        }
    }
}

impl From<U128Json> for U128 {
    fn from(wrapper: U128Json) -> Self {
        U128(wrapper.value)
    }
}

impl BorshSerialize for U128Json {
    fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        BorshSerialize::serialize(&self.value, writer)
    }
}

impl BorshDeserialize for U128Json {
    fn deserialize_reader<R: std::io::Read>(reader: &mut R) -> std::io::Result<Self> {
        let value = BorshDeserialize::deserialize_reader(reader)?;
        Ok(Self { value })
    }
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, JsonSchema, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct FundMetadata {
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub assets: Vec<AssetInfo>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, JsonSchema, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct AssetInfo {
    pub name: String,
    pub contract_address: String,
    pub weight: u8,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, JsonSchema, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct Fund {
    pub metadata: FundMetadata,
    pub token_address: String,
    pub total_supply: U128Json,
    pub creation_timestamp: u64,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct IndexFundFactory {
    pub funds: IterableMap<String, Fund>,
}

#[near_bindgen]
impl IndexFundFactory {
    #[init]
    pub fn new() -> Self {
        Self {
            funds: IterableMap::new(b"f"),
        }
    }

    #[payable]
    pub fn create_fund(
        &mut self,
        prefix: String,
        metadata: FundMetadata,
        public_key: Option<PublicKey>,
    ) -> Promise {
        let total_weight: u8 = metadata.assets.iter().map(|a| a.weight).sum();
        assert_eq!(total_weight, 100, "Total weight must be 100%");

        let subaccount_id = format!("{}.{}", prefix, env::current_account_id());
        let subaccount = subaccount_id.parse::<AccountId>().unwrap();

        let args = (
            env::predecessor_account_id(),
            metadata.assets.clone(),
            "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af".parse::<AccountId>().unwrap(),
        );
    
        log!("Creating fund with args: {:?}", args);
    
        let init_args = near_sdk::serde_json::to_vec(&args)
            .expect("Failed to serialize init args");

        let deposit = env::attached_deposit();

        let mut promise = Promise::new(subaccount.clone())
            .create_account()
            .transfer(deposit)
            .deploy_contract(DEFAULT_TOKEN_WASM.to_vec())
            .function_call(
                "new".to_string(),
                init_args,
                NO_DEPOSIT,
                Gas::from_tgas(50),
            );

        if let Some(pk) = public_key {
            promise = promise.add_full_access_key(pk);
        }

        promise.then(
            Self::ext(env::current_account_id())
                .with_static_gas(Gas::from_tgas(10))
                .on_fund_created_callback(
                    prefix,
                    metadata,
                    subaccount.to_string(),
                )
        )
    }

    #[private]
    pub fn on_fund_created_callback(
        &mut self,
        prefix: String,
        metadata: FundMetadata,
        token_address: String,
        #[callback_result] result: Result<(), PromiseError>,
    ) -> bool {
        if result.is_ok() {
            let fund = Fund {
                metadata,
                token_address: token_address.clone(),
                total_supply: U128Json::from(U128(0)),
                creation_timestamp: env::block_timestamp(),
            };

            self.funds.insert(prefix.clone(), fund);
            log!("Successfully created fund at {}", token_address);
            true
        } else {
            log!("Failed to create fund. Refunding attached deposit.");
            Promise::new(env::predecessor_account_id()).transfer(env::attached_deposit());
            false
        }
    }

    pub fn get_fund(&self, prefix: String) -> Option<Fund> {
        self.funds.get(&prefix).cloned()
    }

    pub fn get_funds(&self, from_index: u64, limit: u64) -> Vec<(String, Fund)> {
        let keys: Vec<_> = self.funds.keys().collect();
        let start: usize = from_index
            .try_into()
            .unwrap_or_else(|_| env::panic_str("Invalid from_index"));
        let end = std::cmp::min((from_index + limit) as usize, keys.len());

        keys[start..end]
            .iter()
            .map(|key| ((*key).clone(), self.funds.get(*key).unwrap().clone()))
            .collect()
    }
}