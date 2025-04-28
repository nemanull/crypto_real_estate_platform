import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";

const projectId = "YOUR_WALLETCONNECT_PROJECT_ID"; // Not necessary for this build

const mainnet = {
  chainId: 1,
  name: "Ethereum",
  currency: "ETH",
  explorerUrl: "https://etherscan.io",
  rpcUrl: "https://cloudflare-eth.com"
};

const sepolia = {
  chainId: 11155111,
  name: "Sepolia",
  currency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io",
  rpcUrl: "https://rpc.sepolia.org"
};

const metadata = {
  name: "BlockVista Valley",
  description: "Connect your wallet to BlockVista Valley",
  url: "http://localhost:5173",
  icons: ["../../assets/header_logo.svg"]
};

const ethersConfig = defaultConfig({
  metadata
});

createWeb3Modal({
  ethersConfig,
  chains: [mainnet, sepolia],
  projectId,
  enableAnalytics: true
});
