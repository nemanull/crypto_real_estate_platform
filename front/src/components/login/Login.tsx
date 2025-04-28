import { useState, useRef, useEffect } from "react"
import { ethers, BrowserProvider, Eip1193Provider } from "ethers"
import { useNavigate } from "react-router-dom"
import {
    useWeb3Modal,
    useWeb3ModalProvider,
    useWeb3ModalAccount
} from "@web3modal/ethers/react"

import styles from "./Login.module.css"

import logo from "../../assets/header_logo.svg"
import metamask from "../../assets/metamask.svg"
import phantom_wallet from "../../assets/phantom_wallet.svg"
import wallet_connect from "../../assets/wallet_connect.svg"
import google from "../../assets/google.jpeg"

import "./WalletConnectHandler"

const Login = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isMetaMaskLoading, setIsMetaMaskLoading] = useState(false)
    const [isPhantomLoading, setIsPhantomLoading] = useState(false)
    const [isWalletConnectLoading, setIsWalletConnectLoading] = useState(false)
    const [isWalletConnectFlowActive, setIsWalletConnectFlowActive] = useState(false)

    const navigate = useNavigate()
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { open } = useWeb3Modal()
    const { address, chainId, isConnected } = useWeb3ModalAccount()
    const { walletProvider } = useWeb3ModalProvider()

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        setIsMenuOpen(true)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsMenuOpen(false)
        }, 300)
    }

    const CryptoLogin = async (provider: ethers.BrowserProvider) => {
        setError(null)
        try {
            const signer = await provider.getSigner()
            const signerAddress = await signer.getAddress()

            const challengeResponse = await fetch(
                "http://localhost:3000/api/auth/crypto/request-challenge",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: signerAddress })
                }
            )
            if (!challengeResponse.ok) {
                const errorData = await challengeResponse.json()
                throw new Error(
                    errorData.error ||
                        `Request challenge failed: ${challengeResponse.statusText}`
                )
            }
            const { challenge } = await challengeResponse.json()
            const signature = await signer.signMessage(challenge)

            const verifyResponse = await fetch(
                "http://localhost:3000/api/auth/crypto/verify-signature",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        address: signerAddress,
                        signature: signature
                    })
                }
            )
            if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json()
                throw new Error(
                    errorData.error ||
                        `Verification failed: ${verifyResponse.statusText}`
                )
            }
            const verifyData = await verifyResponse.json()
            if (verifyData.isAuthenticated) {
                navigate("/home")
            } else {
                throw new Error(
                    verifyData.error || "Authentication failed after verification."
                )
            }
        } catch (err: any) {
            setError(
                err.message || "An unexpected error occurred during crypto login."
            )
        }
    }

    const MetaMaskLogin = async () => {
        if (!window.ethereum) {
            setError("Please install MetaMask.")
            return
        }
        setError(null)
        setIsMetaMaskLoading(true)
        try {
            const ethereumProvider = window.ethereum as unknown as
                | Eip1193Provider
                | undefined
            if (!ethereumProvider) {
                throw new Error("MetaMask provider not found after check.")
            }
            await ethereumProvider.request({ method: "eth_requestAccounts" })
            const provider = new ethers.BrowserProvider(ethereumProvider)
            await CryptoLogin(provider)
        } catch (err: any) {
            setError(err.message || "Failed to connect or login with MetaMask.")
        } finally {
            setIsMetaMaskLoading(false)
        }
    }

    const PhantomLogin = async () => {
        setError(null)
        setIsPhantomLoading(true)
        try {
            const phantomProvider = window.phantom
                ?.ethereum as unknown as Eip1193Provider | undefined
            if (!phantomProvider) {
                setError("Please install Phantom.")
                throw new Error("Phantom provider not found after check.")
            }
            await phantomProvider.request({ method: "eth_requestAccounts" })
            const provider = new ethers.BrowserProvider(phantomProvider)
            await CryptoLogin(provider)
        } catch (err: any) {
            if (!error) {
                setError(err.message || "Failed to connect or login with Phantom.")
            }
        } finally {
            setIsPhantomLoading(false)
        }
    }

    const handleWalletConnectLogin = async () => {
        setError(null)
        setIsWalletConnectFlowActive(true)
        open()
    }

    useEffect(() => {
        const attemptWalletConnectLogin = async () => {
            if (
                isWalletConnectFlowActive &&
                isConnected &&
                walletProvider &&
                address
            ) {
                setIsWalletConnectFlowActive(false)
                setIsWalletConnectLoading(true)
                try {
                    const ethersProvider = new BrowserProvider(walletProvider, chainId)
                    await CryptoLogin(ethersProvider)
                } catch (err: any) {
                    setError(err.message || "An error occurred during WalletConnect login.")
                } finally {
                    setIsWalletConnectLoading(false)
                }
            } else if (
                isWalletConnectFlowActive &&
                !isConnected &&
                !walletProvider
            ) {
                setIsWalletConnectFlowActive(false)
            }
        }
        attemptWalletConnectLogin()
    }, [isConnected, walletProvider, address, chainId, isWalletConnectFlowActive])

    const anyCryptoLoading =
        isMetaMaskLoading || isPhantomLoading || isWalletConnectLoading

    return (
        <div className={styles.login_page}>
            <div className={styles.header}>
                <a href="/">
                    <img src={logo} alt="Logo" className={styles.logo} />
                </a>

                <div
                    className={styles.burger_menu_container}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className={styles.burger_menu}>
                        <div className={styles.burger_line} />
                        <div className={styles.burger_line} />
                        <div className={styles.burger_line} />
                    </div>

                    <div
                        className={`${styles.dropdown_menu} ${
                            isMenuOpen ? styles.open : ""
                        }`}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <a href="/connect" className={styles.dropdown_item}>
                            Connect
                        </a>
                        <a href="/team" className={styles.dropdown_item}>
                            Smart Contracts
                        </a>
                        <a href="/support" className={styles.dropdown_item}>
                            Support
                        </a>
                    </div>
                </div>
            </div>

            <div className={styles.main_bcg}>
                <div className={styles.main_login_box}>
                    <div className={styles.main_login_content_top}>
                        <h2 className={styles.main_login_content_text}>
                            Choose your way to connect
                        </h2>

                        {error && (
                            <p style={{ color: "red", marginBottom: "15px" }}>
                                Error: {error}
                            </p>
                        )}

                        <div className={`${styles.connect_box} ${styles.metamask}`}>
                            <img
                                src={metamask}
                                alt="MetaMask"
                                className={styles.connect_box_img}
                            />
                            <div className={styles.connect_button_container}>
                                <button
                                    className={styles.connect_button}
                                    onClick={MetaMaskLogin}
                                    disabled={anyCryptoLoading}
                                >
                                    {isMetaMaskLoading
                                        ? "Connecting..."
                                        : "Connect MetaMask"}
                                </button>
                                <div className={styles.connect_button_bottom} />
                            </div>
                        </div>

                        <div className={styles.connect_box}>
                            <img
                                src={phantom_wallet}
                                alt="Phantom Wallet"
                                className={styles.connect_box_img}
                            />
                            <div className={styles.connect_button_container}>
                                <button
                                    className={styles.connect_button}
                                    onClick={PhantomLogin}
                                    disabled={anyCryptoLoading}
                                >
                                    {isPhantomLoading
                                        ? "Connecting..."
                                        : "Connect Phantom"}
                                </button>
                                <div className={styles.connect_button_bottom} />
                            </div>
                        </div>

                        <div className={styles.connect_box}>
                            <img
                                src={wallet_connect}
                                alt="WalletConnect"
                                className={styles.connect_box_img}
                            />
                            <div className={styles.connect_button_container}>
                                <button
                                    className={styles.connect_button}
                                    onClick={handleWalletConnectLogin}
                                    disabled={anyCryptoLoading}
                                >
                                    {isWalletConnectLoading
                                        ? "Connecting..."
                                        : "WalletConnect"}
                                </button>
                                <div className={styles.connect_button_bottom} />
                            </div>
                        </div>

                        <a
                            href="http://localhost:3000/api/auth/google"
                            className={styles.google_auth_button}
                            style={{ textDecoration: "none" }}
                        >
                            <div className={styles.google_auth_box}>
                                <img
                                    src={google}
                                    alt="google_auth_img"
                                    className={styles.google_auth_button_img}
                                />
                                <p className={styles.google_auth_text}>
                                    Login with Google
                                </p>
                            </div>
                        </a>
                    </div>
                    <div className={styles.main_login_content_bottom} />
                </div>
            </div>
        </div>
    )
}

export default Login
