import { ethers } from "ethers";
import crypto from "crypto";

const challengeStore = new Map<string, string>();

export function generateChallenge(): string {
  const challenge = crypto.randomBytes(32).toString("hex");
  return `Sign this: ${challenge}`;
}

export function storeChallenge(address: string, challenge: string): void {
  const timeout = 5 * 60 * 1000;
  challengeStore.set(address.toLowerCase(), challenge);
  setTimeout(() => {
    if (challengeStore.get(address.toLowerCase()) === challenge) {
      challengeStore.delete(address.toLowerCase());
      console.log(`Expired: ${address}`);
    }
  }, timeout);
}

export function getChallenge(address: string): string | undefined {
  return challengeStore.get(address.toLowerCase());
}

export function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  } catch (err) {
    console.error("Verify failed:", err);
    return false;
  }
}

export function clearChallenge(address: string): void {
  challengeStore.delete(address.toLowerCase());
}
