"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [networkName, setNetworkName] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const targetChainId = "0xaa36a7";
  const targetNetworkName = "sepolia";

  const checkMetaMaskAvailability = useCallback(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      setIsMetaMaskInstalled(true);
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    } else {
      setIsMetaMaskInstalled(false);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setError(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!window.ethereum.isMetaMask) {
        throw new Error("Please use MetaMask wallet");
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const currentSigner = await browserProvider.getSigner();
      const currentAccount = await currentSigner.getAddress();

      setAccount(currentAccount);
      setProvider(browserProvider);
      setSigner(currentSigner);
      setIsMetaMaskConnected(true);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("walletConnected", "true");
      }

      const network = await browserProvider.getNetwork();
      setNetworkName(network.name);
      const chainIdHex = "0x" + network.chainId.toString(16);
      if (chainIdHex === targetChainId) {
        setIsCorrectNetwork(true);
      } else {
        setIsCorrectNetwork(false);
        setError(
          `Please switch to the Sepolia network. You are currently on ${network.name}.`
        );
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError(`Failed to connect wallet: ${err.message || err.code}`);
    } finally {
      setIsLoading(false);
    }
  }, [isMetaMaskInstalled]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsMetaMaskConnected(false);
    setIsCorrectNetwork(false);
    setNetworkName(null);
    setError(null);
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletConnected");
    }
  }, []);

  const handleAccountsChanged = useCallback(
    (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        connectWallet();
      }
    },
    [account, disconnectWallet, connectWallet]
  );

  const handleChainChanged = useCallback((chainId) => {
    const chainIdLower = chainId.toLowerCase();
    if (chainIdLower === targetChainId) {
      setIsCorrectNetwork(true);
      setError(null);
    } else {
      setIsCorrectNetwork(false);
      setError(
        `Please switch to the Sepolia network. You are currently on chain ${chainId}.`
      );
    }
  }, []);

  useEffect(() => {
    checkMetaMaskAvailability();
  }, [checkMetaMaskAvailability]);

  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window === "undefined") return;
      
      const wasConnected = localStorage.getItem("walletConnected");
      if (wasConnected === "true" && window.ethereum && !account) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          
          if (accounts.length > 0) {
            await connectWallet();
          } else {
            localStorage.removeItem("walletConnected");
          }
        } catch (err) {
          console.error("Auto-reconnect failed:", err);
          localStorage.removeItem("walletConnected");
        }
      }
    };

    if (isMetaMaskInstalled && !isLoading) {
      autoConnect();
    }
  }, [isMetaMaskInstalled, account, connectWallet, isLoading]);

  const value = {
    account,
    provider,
    signer,
    error,
    isLoading,
    connectWallet,
    disconnectWallet,
    isMetaMaskInstalled,
    isMetaMaskConnected,
    isCorrectNetwork,
    networkName,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
