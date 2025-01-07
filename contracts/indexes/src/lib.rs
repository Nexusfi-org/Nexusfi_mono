use near_sdk::store::Vector;
use near_sdk::{near};

#[near(contract_state)]
pub struct Contract {
    name: String,
    funds: Vector<Fund>,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug)]
pub struct Fund {
    pub address: String,
    pub ratio: u32,
}

impl Default for Contract {
    fn default() -> Self {
        Self {
            name: "Default Index".to_string(),
            funds: Vector::new(b"f"),
        }
    }
}

#[near]
impl Contract {
    #[init]
    #[private]
    pub fn init(name: String, funds: Vec<Fund>) -> Self {
        let mut funds_vector = near_sdk::store::Vector::new(b"f");
        for fund in funds {
            funds_vector.push(fund);
        }
        Self { name, funds: funds_vector }
    }


    pub fn get_info(&self) -> (String,  Vec<&Fund>) {
        (
            self.name.clone(),
            self.funds.iter().collect(),
        )
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
   let funds = vec![
       Fund {
           address: "addr1".to_string(),
           ratio: 50
       },
       Fund {
           address: "addr2".to_string(), 
           ratio: 50
       }
   ];
   
   let contract = Contract::init("Test Contract".to_string(), funds);
   let (name, funds_vec) = contract.get_info();
   
   assert_eq!(name, "Test Contract");
   assert_eq!(funds_vec.len(), 2);
   assert_eq!(funds_vec[0].address, "addr1");
   assert_eq!(funds_vec[0].ratio, 50);
}
}
