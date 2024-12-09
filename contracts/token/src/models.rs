use omni_transaction::evm::evm_transaction::EVMTransaction;
use near_sdk::serde::{Deserialize, Serialize};

pub type Address = [u8; 20];
pub type AccessList = Vec<(Address, Vec<[u8; 32]>)>;

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct EVMTransactionWrapper {
    pub chain_id: u64,
    pub nonce: u64,
    pub to: Option<Address>,
    pub value: u128,
    pub input: Vec<u8>,
    pub gas_limit: u128,
    pub max_fee_per_gas: u128,
    pub max_priority_fee_per_gas: u128,
    pub access_list: AccessList,
}

impl EVMTransactionWrapper {
    pub fn to_evm_transaction(&self) -> EVMTransaction {
        EVMTransaction {
            chain_id: self.chain_id,
            nonce: self.nonce,
            to: self.to,
            value: self.value,
            input: self.input.clone(),
            gas_limit: self.gas_limit,
            max_fee_per_gas: self.max_fee_per_gas,
            max_priority_fee_per_gas: self.max_priority_fee_per_gas,
            access_list: self.access_list.clone(),
        }
    }

    pub fn from_evm_transaction(evm_tx: &EVMTransaction) -> Self {
        Self {
            chain_id: evm_tx.chain_id,
            nonce: evm_tx.nonce,
            to: evm_tx.to,
            value: evm_tx.value,
            input: evm_tx.input.clone(),
            gas_limit: evm_tx.gas_limit,
            max_fee_per_gas: evm_tx.max_fee_per_gas,
            max_priority_fee_per_gas: evm_tx.max_priority_fee_per_gas,
            access_list: evm_tx.access_list.clone(),
        }
    }
}