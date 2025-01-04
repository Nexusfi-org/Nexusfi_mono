// Find all our documentation at https://docs.near.org
use near_sdk::json_types::{U128};
use near_sdk::{env, near, require, AccountId, Gas, NearToken, PanicOnDefault};

pub mod ext;
pub use crate::ext::*;


pub type TokenId = String;

#[near(contract_state, serializers = [json, borsh])]
#[derive(PanicOnDefault)]
pub struct Contract {
    usdc_balance: U128,
    owner: AccountId,
    ft_contract: AccountId,
}

#[near]
impl Contract {
    #[init]
    #[private] // only callable by the contract's account
    pub fn init(
        owner: AccountId,
        ft_contract: AccountId,
    ) -> Self {
        Self {
            usdc_balance: near_sdk::json_types::U128(0),
            owner,
            ft_contract,
        }
    }

    // Users bid by transferring FT tokens
    pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> U128 {
        let ft = env::predecessor_account_id();
        // require!(ft == self.ft_contract, "The token is not supported");
        env::log_str(&format!("Received {} ", ft));


        env::log_str(&format!("Received {} USDC from {}", amount.0, sender_id));
        env::log_str(&format!("Previous balance: {}", self.usdc_balance.0));
    
        self.usdc_balance = U128(self.usdc_balance.0 + amount.0);
        U128(0)
    }

    pub fn claim(&mut self) {
        // Transfer FTs to the owner
        ft_contract::ext(self.ft_contract.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(Gas::from_tgas(30))
            .ft_transfer(self.owner.clone(), self.usdc_balance);
    }

    pub fn get_usdc_balance(&self) -> U128 {
        self.usdc_balance.clone()
    }

    pub fn get_contract_info(&self) -> (AccountId, AccountId, U128) {
        (
            self.owner.clone(),
            self.ft_contract.clone(),
            self.usdc_balance.clone()
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn init_contract() {
        let ft_contract: AccountId = "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af".parse().unwrap();
        let owner: AccountId = "rockingg.testnet".parse().unwrap();
        let contract = Contract::init(
            owner.clone(),
            ft_contract.clone(),
        );
    }
}