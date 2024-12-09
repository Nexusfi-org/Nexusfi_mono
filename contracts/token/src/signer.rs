use near_sdk::{ext_contract, serde::{Deserialize, Serialize}};

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SignRequest {
    pub payload: Vec<u8>,
    pub path: String,
    pub key_version: u32,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SignResult {
    pub big_r: AffinePoint,
    pub s: Scalar,
    pub recovery_id: u64,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AffinePoint {
    pub affine_point: String,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Scalar {
    pub scalar: String,
}

#[ext_contract(mpc)]
pub trait MPC {
    fn sign(&self, request: SignRequest) -> near_sdk::PromiseOrValue<SignResult>;
}