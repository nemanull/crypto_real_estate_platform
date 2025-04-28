import PropertyFactoryAbi from "./abis/property_factory.json";
import PropertyAbi from "./abis/property_contract.json";
import Erc20Abi from "./abis/custom_erc20.json";
import dotenv from "dotenv";

dotenv.config();

export const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
export const PROPERTY_FACTORY_ADDRESS = process.env.PROPERTY_FACTORY_CONTRACT_ADDRESS;
export const PAYMENT_TOKEN_ADDRESS = process.env.PAYMENT_TOKEN_CONTRACT_ADDRESS;

if (!PROPERTY_FACTORY_ADDRESS) {
    throw new Error("Missing the env variable: PROPERTY_FACTORY_CONTRACT_ADDRESS");
}
if (!PAYMENT_TOKEN_ADDRESS) {
    throw new Error("Missing the env variable: PAYMENT_TOKEN_CONTRACT_ADDRESS");
}

export const PROPERTY_FACTORY_ABI = PropertyFactoryAbi;
export const PROPERTY_ABI = PropertyAbi;
export const ERC20_ABI = Erc20Abi;
export const BACKEND_WALLET_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY;
export const SEPOLIA_CHAIN_ID = 11155111;
