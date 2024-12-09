import { Ethereum } from "./ethereum";

// Initialize Ethereum service with Sepolia testnet
const SEPOLIA_RPC = "https://rpc2.sepolia.org";
const SEPOLIA_CHAIN_ID = 11155111;
const ethService = new Ethereum(SEPOLIA_RPC, SEPOLIA_CHAIN_ID);

interface DerivedAddresses {
  near: string;
  evm: string;
  derivationPath: string;
}

/**
 * Derives an EVM address from a NEAR account ID
 * @param nearAddress The NEAR account ID
 * @param customDerivationPath Optional custom derivation path (defaults to "ethereum-1")
 * @returns Promise containing both NEAR and derived EVM addresses
 */
export async function getNearToEvmAddress(
  nearAddress: string,
  customDerivationPath?: string
): Promise<DerivedAddresses> {
  try {
    // Use default derivation path if none provided
    const derivationPath = customDerivationPath || "ethereum-1";

    // Derive the EVM address
    const { address: evmAddress } = await ethService.deriveAddress(
      nearAddress,
      derivationPath
    );

    return {
      near: nearAddress,
      evm: evmAddress,
      derivationPath,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to derive EVM address: ${error.message}`);
    } else {
      throw new Error("Failed to derive EVM address: Unknown error");
    }
  }
}

// Usage example
/* 
import { getNearToEvmAddress } from './address-helper';

// Example usage with async/await
async function getAddress() {
  try {
    const addresses = await getNearToEvmAddress('example.near');
    console.log('NEAR Address:', addresses.near);
    console.log('EVM Address:', addresses.evm);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example with custom derivation path
async function getAddressWithCustomPath() {
  try {
    const addresses = await getNearToEvmAddress('example.near', 'ethereum-2');
    console.log('NEAR Address:', addresses.near);
    console.log('EVM Address:', addresses.evm);
    console.log('Derivation Path:', addresses.derivationPath);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
*/
