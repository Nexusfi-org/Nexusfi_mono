# How to run

1. `cargo near build` - Build the contract itself.
2. `near create-account testing-usdc-6.testnet --useFaucet` - Use any other accountId to create a new testnet account which can be used to deploy the contract.
3. To deploy the contract `cargo near deploy build-non-reproducible-wasm <contract-id> with-init-call init json-args '{ "owner": "<your-account>", "ft_contract": "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af"}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-keychain send` to deploy the contract.
4. To make a FT transfer `near call 3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af ft_transfer_call '{"receiver_id": "<contractId>", "amount": "1000", "msg": ""}' --depositYocto 1 --accountId <your-account> --gas 100000000000000`
5. Check balance using `near view <contractId> get_usdc_balance`
