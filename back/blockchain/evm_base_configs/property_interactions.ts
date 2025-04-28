import { ethers } from "ethers";
import prisma from "../../prisma/prisma_client";
import { Property } from "@prisma/client";
import PropertyABI from "../../blockchain/evm_base_configs/abis/property_contract.json";
import ERC20ABI from "../../blockchain/evm_base_configs/abis/custom_erc20.json";
import { SEPOLIA_RPC_URL, PAYMENT_TOKEN_ADDRESS, BACKEND_WALLET_PRIVATE_KEY } from "./evm_config";

if (!SEPOLIA_RPC_URL || !PAYMENT_TOKEN_ADDRESS) {
    throw new Error("Env vars missing");
}

const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
let adminSigner: ethers.Wallet | undefined;

if (BACKEND_WALLET_PRIVATE_KEY) {
    adminSigner = new ethers.Wallet(BACKEND_WALLET_PRIVATE_KEY, provider);
    console.log(`Admin ${adminSigner.address}`);
} else {
    console.warn("No admin key");
}

function getPropertyContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
    return new ethers.Contract(address, PropertyABI, signerOrProvider);
}


export async function purchaseTokens(
    propertyOnchainAddress: string,
    amount: bigint,
    buyerSigner: ethers.Signer
): Promise<ethers.ContractTransactionResponse | null> {
    console.log(`Purchase ${amount}`);
    if (!PAYMENT_TOKEN_ADDRESS) {
        console.error("No payment token");
        return null;
    }
    try {
        const propertyContract = getPropertyContract(propertyOnchainAddress, buyerSigner);
        const paymentTokenContract = new ethers.Contract(PAYMENT_TOKEN_ADDRESS, ERC20ABI, buyerSigner);
        const pricePerToken = await propertyContract.pricePerToken();
        const cost = pricePerToken * amount;
        console.log(`Cost ${ethers.formatEther(cost)}`);
        const approveTx = await paymentTokenContract.approve(propertyOnchainAddress, cost);
        console.log(`Approved ${approveTx.hash}`);
        await approveTx.wait();
        const buyTx = await propertyContract.buyTokens(amount);
        console.log(`Bought ${buyTx.hash}`);
        return buyTx;
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
        return null;
    }
}

export async function depositYield(
    propertyOnchainAddress: string,
    amount: bigint
): Promise<ethers.ContractTransactionResponse | null> {
    if (!adminSigner) {
        console.error("No admin");
        return null;
    }
    if (!PAYMENT_TOKEN_ADDRESS) {
        console.error("No payment token provided");
        return null;
    }
    console.log(`Deposit ${ethers.formatEther(amount)}`);
    try {
        const propertyContract = getPropertyContract(propertyOnchainAddress, adminSigner);
        const paymentTokenContract = new ethers.Contract(PAYMENT_TOKEN_ADDRESS, ERC20ABI, adminSigner);
        const approveTx = await paymentTokenContract.approve(propertyOnchainAddress, amount);
        console.log(`Approved ${approveTx.hash}`);
        await approveTx.wait();
        const depositTx = await propertyContract.depositYield(amount);
        console.log(`Deposited ${depositTx.hash}`);
        return depositTx;
    } catch (e: any) {
        console.error(`err ${e.message}`);
        return null;
    }
}

export async function claimYield(
    propertyOnchainAddress: string,
    holderSigner: ethers.Signer
): Promise<ethers.ContractTransactionResponse | null> {
    console.log("Claim");
    try {
        const propertyContract = getPropertyContract(propertyOnchainAddress, holderSigner);
        const claimTx = await propertyContract.claimYield();
        console.log(`Claimed ${claimTx.hash}`);
        return claimTx;
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
        return null;
    }
}
