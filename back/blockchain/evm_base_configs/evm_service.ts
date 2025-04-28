import { ethers, Contract, JsonRpcProvider, Wallet, Log, Interface, BigNumberish, isAddress } from "ethers";
import {
    SEPOLIA_RPC_URL,
    PROPERTY_FACTORY_ADDRESS,
    PROPERTY_FACTORY_ABI,
    PROPERTY_ABI,
    ERC20_ABI,
    BACKEND_WALLET_PRIVATE_KEY
} from "./evm_config";
import { updateProperty } from "../../prisma/manage/property_manage";

const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);

let backendSigner: Wallet | null = null;
if (BACKEND_WALLET_PRIVATE_KEY) {
    try {
        backendSigner = new Wallet(BACKEND_WALLET_PRIVATE_KEY, provider);
        console.log("signer configured");
    } catch (error) {
        console.error("signer init fail", error);
    }
} else {
    console.warn("no signer");
}

export function getPropertyFactoryContract(useSigner = false): Contract {
    if (!PROPERTY_FACTORY_ADDRESS) {
        throw new Error("missing factory address");
    }
    const conn = useSigner ? backendSigner : provider;
    if (useSigner && !conn) {
        throw new Error("no signer");
    }
    return new Contract(PROPERTY_FACTORY_ADDRESS, PROPERTY_FACTORY_ABI, conn);
}

export function getPropertyContract(propertyAddress: string, useSigner = false): Contract {
    if (!isAddress(propertyAddress)) {
        throw new Error("invalid address");
    }
    const conn = useSigner ? backendSigner : provider;
    if (useSigner && !conn) {
        throw new Error("no signer");
    }
    return new Contract(propertyAddress, PROPERTY_ABI, conn);
}

export function getErc20Contract(tokenAddress: string, useSigner = false): Contract {
    if (!isAddress(tokenAddress)) {
        throw new Error("invalid address");
    }
    const conn = useSigner ? backendSigner : provider;
    if (useSigner && !conn) {
        throw new Error("no signer");
    }
    return new Contract(tokenAddress, ERC20_ABI, conn);
}

export async function getAllPropertyAddressesFromFactory(): Promise<string[]> {
    try {
        const factory = getPropertyFactoryContract(false);
        const count = await factory.count();
        const promises: Promise<string>[] = [];
        for (let i = 0; i < count; i++) {
            promises.push(factory.allProperties(i));
        }
        const results = await Promise.all(promises);
        return results.filter(isAddress);
    } catch (error: any) {
        console.error("fetch fail", error);
        throw new Error("failed to get addresses");
    }
}

export async function getPropertyDetails(propertyAddress: string): Promise<{
    uri: string;
    paymentToken: string;
    metadataHash: string;
    metadataURI: string;
    totalTokens: bigint;
    pricePerToken: bigint;
    annualReturnBP: bigint;
    tokensSold: bigint;
    totalYieldDeposited: bigint;
    owner: string;
}> {
    if (!isAddress(propertyAddress)) {
        throw new Error("invalid address");
    }
    try {
        const c = getPropertyContract(propertyAddress, false);
        const [
            uri,
            paymentToken,
            metadataHash,
            metadataURI,
            totalTokens,
            pricePerToken,
            annualReturnBP,
            tokensSold,
            totalYieldDeposited,
            owner
        ] = await Promise.all([
            c.uri(0),
            c.paymentToken(),
            c.metadataHash(),
            c.metadataURI(),
            c.totalTokens(),
            c.pricePerToken(),
            c.annualReturnBP(),
            c.tokensSold(),
            c.totalYieldDeposited(),
            c.owner()
        ]);
        return {
            uri,
            paymentToken,
            metadataHash,
            metadataURI,
            totalTokens,
            pricePerToken,
            annualReturnBP,
            tokensSold,
            totalYieldDeposited,
            owner
        };
    } catch (error: any) {
        console.error("details fail", error);
        throw new Error("failed to get details");
    }
}

export async function createPropertyOnChain(
    dbPropertyId: number,
    uri: string,
    paymentTokenAddress: string,
    metadataHash: string,
    metadataURI: string,
    totalTokens: BigNumberish,
    pricePerToken: BigNumberish,
    annualReturnBP: number
): Promise<string> {
    if (!backendSigner) {
        throw new Error("no signer");
    }
    if (!PROPERTY_FACTORY_ADDRESS) {
        throw new Error("missing factory");
    }
    if (!isAddress(paymentTokenAddress)) {
        throw new Error("invalid token");
    }
    if (!ethers.isBytesLike(metadataHash) || ethers.getBytes(metadataHash).length !== 32) {
        throw new Error("invalid hash");
    }
    if (annualReturnBP < 0 || annualReturnBP > 65535) {
        throw new Error("invalid return");
    }
    try {
        const factory = getPropertyFactoryContract(true);
        const factoryAddress = await factory.getAddress();
        console.log("create tx");
        const tx = await factory.createProperty(
            uri,
            paymentTokenAddress,
            metadataHash,
            metadataURI,
            totalTokens,
            pricePerToken,
            annualReturnBP
        );
        console.log(tx.hash);
        const receipt = await tx.wait(1);
        if (!receipt || receipt.status === 0) {
            throw new Error("tx fail");
        }
        console.log("tx ok");
        const iface = new Interface(PROPERTY_FACTORY_ABI);
        const topic = iface.getEvent("PropertyDeployed(address,uint256)")?.topicHash;
        if (!topic) {
            throw new Error("topic fail");
        }
        const log = receipt.logs.find(
            (l: Log) =>
                l.address.toLowerCase() === factoryAddress.toLowerCase() &&
                l.topics[0] === topic
        );
        if (!log) {
            throw new Error("event not found");
        }
        const decoded = iface.parseLog({ topics: log.topics as string[], data: log.data });
        if (!decoded || decoded.name !== "PropertyDeployed") {
            throw new Error("decode fail");
        }
        const deployedAddress = decoded.args.propertyAddress;
        if (!deployedAddress || !isAddress(deployedAddress)) {
            throw new Error("invalid deployed");
        }
        try {
            if (dbPropertyId <= 0) {
                throw new Error("invalid id");
            }
            await updateProperty(dbPropertyId, { onchainAddress: deployedAddress });
            console.log("db updated");
        } catch {
        }
        return deployedAddress;
    } catch (error: any) {
        console.error("create fail", error);
        throw new Error("createPropertyOnChain failed");
    }
}
