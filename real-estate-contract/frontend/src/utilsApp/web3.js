// src/utilsApp/web3.js

import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

export const initializeWeb3 = async () => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
    }

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return new Web3(window.ethereum);
    } catch (error) {
        console.error('Web3 initialization error:', error);
        if (error.code === 4001) {
            throw new Error('Please connect your wallet to use this application');
        }
        throw error;
    }
};

export const initializeContract = async (web3) => {
    if (!web3) {
        throw new Error('Web3 instance is required');
    }
    
    try {
        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        // Simple contract validation
        const code = await web3.eth.getCode(CONTRACT_ADDRESS);
        if (code === '0x' || code === '0x0') {
            throw new Error('No contract found at the specified address. Please ensure Hardhat is running and the contract is deployed.');
        }
        
        return contract;
    } catch (error) {
        throw new Error(`Contract initialization failed: ${error.message}`);
    }
};

export const connectWallet = async () => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Please unlock MetaMask.');
        }

        return accounts[0];
    } catch (error) {
        console.error('Wallet connection error:', error);
        if (error.code === 4001) {
            throw new Error('Connection rejected. Please approve the connection request in MetaMask.');
        }
        throw new Error('Failed to connect wallet: ' + error.message);
    }
};

export const switchToHardhatNetwork = async () => {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: Web3.utils.toHex(31337) }] // Using proper hex conversion
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: Web3.utils.toHex(31337),
                        chainName: 'Hardhat Local Network',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['http://127.0.0.1:8545'],
                        blockExplorerUrls: null
                    }]
                });
            } catch (addError) {
                throw new Error('Failed to add Hardhat network to MetaMask. Please try again.');
            }
        } else {
            throw new Error('Failed to switch to Hardhat network. Please make sure Hardhat is running.');
        }
    }
};


export const formatPrice = (web3Instance, priceInWei) => {
    if (!web3Instance || !priceInWei) return '0';
    try {
        return web3Instance.utils.fromWei(priceInWei.toString(), 'ether');
    } catch (error) {
        console.error('Price formatting error:', error);
        return '0';
    }
};

export const validatePropertyData = (property) => {
    if (!property.id || !property.id.trim()) {
        throw new Error('Property ID is required');
    }
    if (!property.title || !property.title.trim()) {
        throw new Error('Property title is required');
    }
    if (!property.price) {
        throw new Error('Property price is required');
    }

    const price = parseFloat(property.price);
    if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price greater than 0');
    }

    return true;
};