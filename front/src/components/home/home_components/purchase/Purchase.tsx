import React, { useState, useEffect } from "react";
import styles from "./Purchase.module.css";
import { ethers, Eip1193Provider, getAddress, ZeroAddress } from "ethers"; // Import necessary types
import PropertyABI from "./abis/property_contract.json";
import ERC20ABI from "./abis/custom_erc20.json";

interface PurchaseProps {
    propertyId: number;
    onchainAddress: string | null;
    pricePerTokenWei: string; 
    tokensLeft: number;
    paymentTokenAddress: string;
    onClose: () => void;
    onPurchaseSuccess: (propertyId: number, amount: string, txHash: string) => void;
}

const Purchase: React.FC<PurchaseProps> = ({
    propertyId,
    onchainAddress,
    pricePerTokenWei,
    tokensLeft,
    paymentTokenAddress,
    onClose,
    onPurchaseSuccess
}) => {
    const [amount, setAmount] = useState<string>("1");
    const [cost, setCost] = useState<string>("0");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [tokenDecimals, setTokenDecimals] = useState<number | null>(null); 
    const [tokenSymbol, setTokenSymbol] = useState<string>("Tokens"); 

    useEffect(() => {
        const fetchTokenInfo = async () => {
            if (paymentTokenAddress && paymentTokenAddress !== ZeroAddress && typeof window.ethereum !== "undefined") {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
                    const tokenContract = new ethers.Contract(paymentTokenAddress, ERC20ABI, provider);
                    const decimals = await tokenContract.decimals();
                    const symbol = await tokenContract.symbol();
                    setTokenDecimals(Number(decimals)); 
                    setTokenSymbol(symbol);
                } catch (e) {
                    console.error("Failed to fetch token info:", e);
                    setError("Failed to fetch payment token details. Please ensure the address is correct and you are on the right network.");
                    setTokenDecimals(null); 
                    setTokenSymbol("Tokens");
                }
            } else {
                setTokenDecimals(null); 
                setTokenSymbol("Tokens");
            }
        };

        fetchTokenInfo();
    }, [paymentTokenAddress]);


    useEffect(() => {
        if (!pricePerTokenWei || !amount || parseInt(amount, 10) <= 0 || tokenDecimals === null) {
            setCost("0");
            return;
        }
        try {
            const amountBN = ethers.parseUnits(amount, 0); 
            const priceBN = BigInt(pricePerTokenWei); 
            const totalCostBN = amountBN * priceBN;
            setCost(ethers.formatUnits(totalCostBN, tokenDecimals));
        } catch (e) {
            console.error("Error calculating cost:", e);
            setCost("Error");
            setError("Error calculating cost. Check input values and token details.");
        }
    }, [amount, pricePerTokenWei, tokenDecimals]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^(0|[1-9]\d*)$/.test(value) || value === "") {
            const numValue = parseInt(value || "0", 10);
            if (numValue <= tokensLeft) {
                setAmount(value);
                setError(null);
            } else {
                setError(`Only ${tokensLeft} tokens available.`);
                setAmount(tokensLeft.toString());
            }
        }
    };

    const handlePurchase = async () => {
        console.log(`Initiating purchase for property ID: ${propertyId}`);
        if (typeof window.ethereum === "undefined" || typeof window.ethereum.request !== "function") {
            setError("MetaMask (or compatible wallet) not detected or is not EIP-1193 compliant. Please install it.");
            return;
        }
        if (!onchainAddress) {
            setError("Property contract address is missing.");
            return;
        }
        let checksummedOnchainAddress: string;
        try {
            checksummedOnchainAddress = getAddress(onchainAddress);
        } catch (e) {
            console.error("Invalid property address format:", onchainAddress, e);
            setError("Invalid property contract address format.");
            return;
        }
        let checksummedPaymentTokenAddress: string;
        try {
            checksummedPaymentTokenAddress = getAddress(paymentTokenAddress);
        } catch (e) {
            console.error("Invalid payment token address format:", paymentTokenAddress, e);
            setError("Invalid payment token address format.");
            return;
        }
        const numAmount = parseInt(amount || "0", 10);
        if (numAmount <= 0) {
            setError("Please enter a valid amount greater than zero.");
            return;
        }
        if (numAmount > tokensLeft) {
            setError(`Amount exceeds available tokens (${tokensLeft}).`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setStatusMessage("Connecting to wallet...");

        try {
            if (tokenDecimals === null) {
                setError("Payment token details not loaded yet. Please wait.");
                setIsLoading(false); 
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const buyerAddress = await signer.getAddress();
            setStatusMessage(`Connected as ${buyerAddress.substring(0, 6)}...`);

            const propertyContract = new ethers.Contract(checksummedOnchainAddress, PropertyABI, signer);
            const paymentTokenContract = new ethers.Contract(checksummedPaymentTokenAddress, ERC20ABI, signer);

            const amountBN = ethers.parseUnits(amount, 0);
            const pricePerTokenFromContract = await propertyContract.pricePerToken();
            const totalCostWeiBN = amountBN * pricePerTokenFromContract;
            const formattedCost = ethers.formatUnits(totalCostWeiBN, tokenDecimals);
            setStatusMessage(`Calculated cost: ${formattedCost} ${tokenSymbol}. Requesting approval...`);

            setStatusMessage("Checking token allowance...");
            const currentAllowance = await paymentTokenContract.allowance(buyerAddress, checksummedOnchainAddress);

            if (currentAllowance < totalCostWeiBN) {
                setStatusMessage(`Requesting approval to spend ${formattedCost} ${tokenSymbol}...`);
                const approveTx = await paymentTokenContract.approve(checksummedOnchainAddress, totalCostWeiBN);
                setStatusMessage("Waiting for approval transaction...");
                await approveTx.wait(1);
                setStatusMessage("Approval successful! Initiating purchase...");
            } else {
                setStatusMessage("Sufficient allowance found. Initiating purchase...");
            }

            const purchaseTx = await propertyContract.buyTokens(amountBN);
            setStatusMessage("Waiting for purchase transaction...");
            const receipt = await purchaseTx.wait(1);

            if (!receipt || receipt.status !== 1) {
                throw new Error("Purchase transaction failed or was reverted.");
            }

            const txHash = receipt.hash;
            setStatusMessage(`Purchase successful! Tx: ${txHash.substring(0, 10)}...`);
            setIsLoading(false);
            onPurchaseSuccess(propertyId, amount, txHash);
            setTimeout(onClose, 3000);
        } catch (err: any) {
            console.error("Purchase failed:", err);
            let errorMessage = "An unknown error occurred.";
            if (err.code === "ACTION_REJECTED") {
                errorMessage = "Transaction rejected in wallet.";
            } else if (err.reason) {
                errorMessage = `Transaction failed: ${err.reason}`;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            setStatusMessage("");
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.purchaseOverlay}>
            <div className={styles.purchaseModal}>
                <button onClick={onClose} className={styles.closeButton} disabled={isLoading}>
                    &times;
                </button>
                <h2>Purchase Tokens</h2>
                <p>
                    Property Contract:{" "}
                    {onchainAddress
                        ? `${getAddress(onchainAddress).substring(0, 6)}...${getAddress(onchainAddress).substring(
                                getAddress(onchainAddress).length - 4
                            )}`
                        : "N/A"}
                </p>
                <p>Tokens Available: {tokensLeft}</p>
                <div className={styles.inputGroup}>
                    <label htmlFor="amount">Amount to Buy (Max: {tokensLeft}):</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={handleAmountChange}
                        min="1"
                        max={tokensLeft}
                        step="1"
                        disabled={isLoading}
                        className={styles.amountInput}
                        placeholder="Enter amount"
                    />
                </div>
                <p className={styles.costDisplay}>
                    Estimated Cost: {cost === "Error" ? "Error" : `${cost} ${tokenSymbol}`}
                </p>
                {error && <p className={styles.errorMessage}>{error}</p>}
                {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
                <button
                    onClick={handlePurchase}
                    disabled={
                        isLoading ||
                        !!error ||
                        !amount ||
                        parseInt(amount || "0", 10) <= 0 ||
                        parseInt(amount || "0", 10) > tokensLeft ||
                        !onchainAddress
                    }
                    className={styles.purchaseButton}
                >
                    {isLoading ? "Processing..." : "Purchase"}
                </button>
            </div>
        </div>
    );
};

export default Purchase;
