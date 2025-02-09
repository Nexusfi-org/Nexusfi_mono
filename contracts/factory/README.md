# Factory Contract Example

A factory is a smart contract that stores a compiled contract on itself, and
automatizes deploying it into sub-accounts.

This particular example presents a factory of donation contracts, and enables
to:

1. Create a sub-account of the factory and deploy the stored contract on it
   (create_factory_subaccount_and_deploy).
2. Change the stored contract using the update_stored_contract method.

```rust
#[payable]
    pub fn create_factory_subaccount_and_deploy(
        &mut self,
        name: String,
        beneficiary: AccountId,
        public_key: Option<PublicKey>,
    ) -> Promise {
        // Assert the sub-account is valid
        let current_account = env::current_account_id().to_string();
        let subaccount: AccountId = format!("{name}.{current_account}").parse().unwrap();
        assert!(
            env::is_valid_account_id(subaccount.as_bytes()),
            "Invalid subaccount"
        );

        // Assert enough tokens are attached to create the account and deploy the contract
        let attached = env::attached_deposit();

        let code = self.code.clone().unwrap();
        let contract_bytes = code.len() as u128;
        let minimum_needed = NEAR_PER_STORAGE.saturating_mul(contract_bytes);
        assert!(
            attached >= minimum_needed,
            "Attach at least {minimum_needed} yⓃ"
        );

        let init_args = near_sdk::serde_json::to_vec(&DonationInitArgs { beneficiary }).unwrap();

        let mut promise = Promise::new(subaccount.clone())
            .create_account()
            .transfer(attached)
            .deploy_contract(code)
            .function_call(
                "init".to_owned(),
                init_args,
                NO_DEPOSIT,
                TGAS.saturating_mul(5),
            );

        // Add full access key is the user passes one
        if let Some(pk) = public_key {
            promise = promise.add_full_access_key(pk);
        }

        // Add callback
        promise.then(
            Self::ext(env::current_account_id()).create_factory_subaccount_and_deploy_callback(
                subaccount,
                env::predecessor_account_id(),
                attached,
            ),
        )
    }
```

1. Create a testnet account

   ```bash
   near create-account <your-account-id.testnet> --useFaucet
   ```

2. Deploy the contract

   ```bash
   cargo near deploy
   ```

3. This is the contract call made to create an index fund from scratch from the contract

   ```bash
   near call factory-contract-1.testnet create_factory_subaccount_and_deploy '{"name": "index1", "allocation_targets": [ { "address": "account1.near", "ratio": 50 }, { "address": "account2.near", "ratio": 50 }]}' --accountId factory-contract-1.testnet --deposit 1.24 --gas 300000000000000
   ```

4. To view the index fund

   ```bash
   near view index1.factory-contract-1.testnet get_info
   ```
