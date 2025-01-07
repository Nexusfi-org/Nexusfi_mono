use serde_json::json;
use near_workspaces;
use indexes::AllocationTarget;


#[tokio::test]
async fn test_contract_is_operational() -> Result<(), Box<dyn std::error::Error>> {
    let contract_wasm = near_workspaces::compile_project("./").await?;
    test_basics_on(&contract_wasm).await?;
    Ok(())
}

async fn test_basics_on(contract_wasm: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
    let sandbox = near_workspaces::sandbox().await?;
    let contract = sandbox.dev_deploy(contract_wasm).await?;
    let user_account = sandbox.dev_create_account().await?;

    let allocation_targets = vec![
        json!({
            "address": "fund1.near",
            "ratio": 60
        }),
        json!({
            "address": "fund2.near",
            "ratio": 40
        })
    ];

    let outcome = user_account
        .call(contract.id(), "init")
        .args_json(json!({
            "name": "Test Index",
            "allocation_targets": allocation_targets
        }))
        .transact()
        .await?;
    assert!(outcome.is_success());

    let info = contract.view("get_info").args_json(json!({})).await?;
    let (name, allocation_targets_vector): (String, Vec<AllocationTarget>) = info.json()?;
    
    assert_eq!(name, "Test Index");
    assert_eq!(allocation_targets_vector.len(), 2);

    Ok(())
}