use near_sdk::near;
use near_sdk::store::Vector;

#[near(contract_state)]
pub struct Contract {
    name: String,
    allocation_targets: Vector<AllocationTarget>,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug)]
pub struct AllocationTarget {
    pub address: String,
    pub ratio: u32,
}

impl Default for Contract {
    fn default() -> Self {
        Self {
            name: "Default Index".to_string(),
            allocation_targets: Vector::new(b"f"),
        }
    }
}

#[near]
impl Contract {
    #[init]
    #[private]
    pub fn init(name: String, allocation_targets: Vec<AllocationTarget>) -> Self {
        let mut allocation_targets_vector = near_sdk::store::Vector::new(b"f");
        for at in allocation_targets {
            allocation_targets_vector.push(at);
        }
        Self {
            name,
            allocation_targets: allocation_targets_vector,
        }
    }

    pub fn get_info(&self) -> (String, Vec<&AllocationTarget>) {
        (self.name.clone(), self.allocation_targets.iter().collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::log;

    #[test]
    fn get_default_info() {
        let contract = Contract::default();

        let info = contract.get_info();
        log!("Contract info: {:?}", info);
    }

    #[test]
    fn test_init() {
        let allocation_targets = vec![
            AllocationTarget {
                address: "addr1".to_string(),
                ratio: 50,
            },
            AllocationTarget {
                address: "addr2".to_string(),
                ratio: 50,
            },
        ];

        let contract = Contract::init("Test Contract".to_string(), allocation_targets);
        let (name, allocation_targets_vec) = contract.get_info();

        assert_eq!(name, "Test Contract");
        assert_eq!(allocation_targets_vec.len(), 2);
        assert_eq!(allocation_targets_vec[0].address, "addr1");
        assert_eq!(allocation_targets_vec[0].ratio, 50);
    }
}
