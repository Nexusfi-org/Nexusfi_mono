import { base_decode } from "near-api-js/lib/utils/serialize";
import { ec as EC } from "elliptic";
import { keccak256 } from "viem";
import hash from "hash.js";
import bs58check from "bs58check";
import { sha3_256 } from "js-sha3";

// Type definitions
type NetworkType = "bitcoin" | "testnet";

interface Point {
  getX(): {
    toString(format: string): string;
  };
  getY(): {
    toString(format: string): string;
  };
  add(point: Point): Point;
}

interface ECInstance {
  curve: {
    point(x: string, y: string): Point;
  };
  g: {
    mul(scalar: string): Point;
  };
}

const rootPublicKey =
  "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3";

export function najPublicKeyStrToUncompressedHexPoint(): string {
  const res =
    "04" +
    Buffer.from(base_decode(rootPublicKey.split(":")[1])).toString("hex");
  return res;
}

export async function deriveChildPublicKey(
  parentUncompressedPublicKeyHex: string,
  signerId: string,
  path: string = ""
): Promise<string> {
  const ec: ECInstance = new EC("secp256k1");
  const scalarHex: string = sha3_256(
    `near-mpc-recovery v0.1.0 epsilon derivation:${signerId},${path}`
  );

  const x: string = parentUncompressedPublicKeyHex.substring(2, 66);
  const y: string = parentUncompressedPublicKeyHex.substring(66);

  // Create a point object from X and Y coordinates
  const oldPublicKeyPoint: Point = ec.curve.point(x, y);

  // Multiply the scalar by the generator point G
  const scalarTimesG: Point = ec.g.mul(scalarHex);

  // Add the result to the old public key point
  const newPublicKeyPoint: Point = oldPublicKeyPoint.add(scalarTimesG);
  const newX: string = newPublicKeyPoint
    .getX()
    .toString("hex")
    .padStart(64, "0");
  const newY: string = newPublicKeyPoint
    .getY()
    .toString("hex")
    .padStart(64, "0");
  return "04" + newX + newY;
}

export function uncompressedHexPointToEvmAddress(
  uncompressedHexPoint: string
): string {
  const addressHash: string = keccak256(`0x${uncompressedHexPoint.slice(2)}`);

  // Ethereum address is last 20 bytes of hash (40 characters), prefixed with 0x
  return "0x" + addressHash.substring(addressHash.length - 40);
}

export async function uncompressedHexPointToBtcAddress(
  publicKeyHex: string,
  network: NetworkType
): Promise<string> {
  // Step 1: SHA-256 hashing of the public key
  const publicKeyBytes: Uint8Array = Uint8Array.from(
    Buffer.from(publicKeyHex, "hex")
  );

  const sha256HashOutput: ArrayBuffer = await crypto.subtle.digest(
    "SHA-256",
    publicKeyBytes
  );

  // Step 2: RIPEMD-160 hashing on the result of SHA-256
  const ripemd160: number[] = hash
    .ripemd160()
    .update(Buffer.from(sha256HashOutput))
    .digest();

  // Step 3: Adding network byte (0x00 for Bitcoin Mainnet)
  const network_byte: number = network === "bitcoin" ? 0x00 : 0x6f;
  const networkByte: Buffer = Buffer.from([network_byte]);
  const networkByteAndRipemd160: Buffer = Buffer.concat([
    networkByte,
    Buffer.from(ripemd160),
  ]);

  // Step 4: Base58Check encoding
  const address: string = bs58check.encode(networkByteAndRipemd160);

  return address;
}

// Type guard to validate network type
export function isValidNetwork(network: string): network is NetworkType {
  return network === "bitcoin" || network === "testnet";
}
