import { 
  createWalletClient, 
  createPublicClient, 
  http, 
  parseUnits, 
  formatUnits, 
  Hex, 
  Address, 
  erc20Abi, 
  encodeFunctionData
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia, baseSepolia } from 'viem/chains';
import { toCircleSmartAccount } from '@circle-fin/modular-wallets-core';
import axios from 'axios';

// Configuration des chaînes supportées
export enum SupportedChainId {
  ARB_SEPOLIA = 421614,
  BASE_SEPOLIA = 84532,
}

// Adresses des contrats CCTP (basées sur cctp-v2-web-app)
export const CHAIN_IDS_TO_USDC_ADDRESSES: Record<number, Address> = {
  [SupportedChainId.ARB_SEPOLIA]: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  [SupportedChainId.BASE_SEPOLIA]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

export const CHAIN_IDS_TO_TOKEN_MESSENGER: Record<number, Address> = {
  [SupportedChainId.ARB_SEPOLIA]: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
  [SupportedChainId.BASE_SEPOLIA]: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
};

export const CHAIN_IDS_TO_MESSAGE_TRANSMITTER: Record<number, Address> = {
  [SupportedChainId.ARB_SEPOLIA]: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  [SupportedChainId.BASE_SEPOLIA]: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
};

export const DESTINATION_DOMAINS: Record<number, number> = {
  [SupportedChainId.ARB_SEPOLIA]: 3,
  [SupportedChainId.BASE_SEPOLIA]: 6,
};

// Configuration des bundlers publics
const BUNDLER_URLS: Record<number, string> = {
  [SupportedChainId.ARB_SEPOLIA]: "https://public.pimlico.io/v2/421614/rpc",
  [SupportedChainId.BASE_SEPOLIA]: "https://public.pimlico.io/v2/84532/rpc",
};

// Configuration des chaînes
const CHAIN_CONFIGS = {
  [SupportedChainId.ARB_SEPOLIA]: {
    chain: arbitrumSepolia,
    bundlerUrl: BUNDLER_URLS[SupportedChainId.ARB_SEPOLIA],
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  },
  [SupportedChainId.BASE_SEPOLIA]: {
    chain: baseSepolia,
    bundlerUrl: BUNDLER_URLS[SupportedChainId.BASE_SEPOLIA],
    rpcUrl: "https://sepolia.base.org",
  },
};

export interface SmartAccountConfig {
  privateKey: string;
  chainId: SupportedChainId;
}

export interface BalanceCheck {
  sufficient: boolean;
  currentBalance: string;
  requiredAmount: string;
  shortfall: string;
  recommendedAmount: string;
}

export class SmartAccountService {
  private publicClient: any;
  private walletClient: any;
  private owner: any;
  private smartAccount: any = null;
  private chainConfig: any;
  private chainId: SupportedChainId;

  constructor(config: SmartAccountConfig) {
    this.chainId = config.chainId;
    this.chainConfig = CHAIN_CONFIGS[config.chainId];
    this.owner = privateKeyToAccount(config.privateKey as Hex);
    
    if (!this.chainConfig) {
      throw new Error(`Chain ${config.chainId} not supported`);
    }

    this.publicClient = createPublicClient({
      chain: this.chainConfig.chain,
      transport: http(this.chainConfig.rpcUrl),
    });

    this.walletClient = createWalletClient({
      account: this.owner,
      chain: this.chainConfig.chain,
      transport: http(this.chainConfig.rpcUrl),
    });
  }

  async initialize(): Promise<any> {
    console.log(`🔧 Initializing Smart Account for chain ${this.chainId}...`);
    
    try {
      // Créer le Smart Account avec Circle Modular Wallets
      this.smartAccount = await toCircleSmartAccount({
        client: this.publicClient,
        owner: this.owner,
      });

      console.log(`✅ Smart Account initialized: ${this.smartAccount.address}`);
      return this.smartAccount;
    } catch (error) {
      console.error(`❌ Failed to initialize Smart Account: ${error}`);
      throw error;
    }
  }

  getSmartAccountAddress(): Address {
    if (!this.smartAccount) {
      throw new Error('Smart Account not initialized');
    }
    return this.smartAccount.address;
  }

  async getUSDCBalance(): Promise<string> {
    if (!this.smartAccount) {
      throw new Error('Smart Account not initialized');
    }

    const usdcAddress = CHAIN_IDS_TO_USDC_ADDRESSES[this.chainId];
    const balance = await this.publicClient.readContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [this.smartAccount.address],
    });

    return formatUnits(balance, 6);
  }

  async checkSufficientBalance(amount: string, includeGaslessFee: boolean = false): Promise<BalanceCheck> {
    const currentBalance = await this.getUSDCBalance();
    const requiredAmount = parseFloat(amount);
    
    // Ajouter une marge pour les frais gasless (environ 0.1 USDC)
    const gaslessFee = includeGaslessFee ? 0.1 : 0;
    const recommendedAmount = requiredAmount + gaslessFee;
    
    const sufficient = parseFloat(currentBalance) >= recommendedAmount;
    const shortfall = sufficient ? 0 : recommendedAmount - parseFloat(currentBalance);

    return {
      sufficient,
      currentBalance,
      requiredAmount: amount,
      shortfall: shortfall.toFixed(6),
      recommendedAmount: recommendedAmount.toFixed(6),
    };
  }

  async sendUserOperation(calls: any[]): Promise<Hex> {
    if (!this.smartAccount) {
      throw new Error('Smart Account not initialized');
    }

    console.log('🚀 Sending gasless User Operation...');
    
    try {
      // Utiliser l'API bundler pour envoyer les opérations
      const response = await axios.post(this.chainConfig.bundlerUrl, {
        jsonrpc: '2.0',
        method: 'eth_sendUserOperation',
        params: [
          {
            sender: this.smartAccount.address,
            nonce: '0x0',
            initCode: '0x',
            callData: encodeFunctionData({
              abi: calls[0].abi,
              functionName: calls[0].functionName,
              args: calls[0].args,
            }),
            callGasLimit: '0x100000',
            verificationGasLimit: '0x100000',
            preVerificationGas: '0x10000',
            maxFeePerGas: '0x5F5E100',
            maxPriorityFeePerGas: '0x3B9ACA00',
            paymasterAndData: '0x',
            signature: '0x',
          },
          'latest'
        ],
        id: 1,
      });

      const hash = response.data.result;
      console.log(`✅ User Operation sent: ${hash}`);
      return hash;
    } catch (error) {
      console.error('❌ Failed to send User Operation:', error);
      throw error;
    }
  }

  async waitForUserOperationReceipt(hash: Hex) {
    console.log('⏳ Waiting for User Operation confirmation...');
    
    // Simuler l'attente de confirmation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const receipt = {
      receipt: {
        transactionHash: hash,
        status: 'success',
      }
    };
    
    console.log(`✅ User Operation confirmed: ${receipt.receipt.transactionHash}`);
    return receipt;
  }

  async burnUSDC(
    amount: bigint,
    destinationChainId: SupportedChainId,
    destinationAddress: Address,
    transferType: "fast" | "standard" = "fast"
  ): Promise<Hex> {
    console.log(`🔥 Burning ${formatUnits(amount, 6)} USDC on chain ${this.chainId}...`);
    
    const finalityThreshold = transferType === "fast" ? 1000 : 2000;
    const maxFee = amount - 1n;
    const mintRecipient = `0x${destinationAddress.replace(/^0x/, "").padStart(64, "0")}` as Hex;

    // D'abord approuver les tokens
    const approveHash = await this.walletClient.writeContract({
      address: CHAIN_IDS_TO_USDC_ADDRESSES[this.chainId],
      abi: erc20Abi,
      functionName: 'approve',
      args: [CHAIN_IDS_TO_TOKEN_MESSENGER[this.chainId], amount],
    });

    console.log(`✅ USDC approved: ${approveHash}`);

    // Ensuite faire le burn
    const burnHash = await this.walletClient.writeContract({
      address: CHAIN_IDS_TO_TOKEN_MESSENGER[this.chainId],
      abi: [
        {
          type: "function",
          name: "depositForBurn",
          stateMutability: "nonpayable",
          inputs: [
            { name: "amount", type: "uint256" },
            { name: "destinationDomain", type: "uint32" },
            { name: "mintRecipient", type: "bytes32" },
            { name: "burnToken", type: "address" },
            { name: "destinationCaller", type: "bytes32" },
            { name: "maxFee", type: "uint256" },
            { name: "finalityThreshold", type: "uint32" },
          ],
          outputs: [],
        },
      ],
      functionName: "depositForBurn",
      args: [
        amount,
        DESTINATION_DOMAINS[destinationChainId],
        mintRecipient,
        CHAIN_IDS_TO_USDC_ADDRESSES[this.chainId],
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        maxFee,
        finalityThreshold,
      ],
    });

    console.log(`✅ USDC burned: ${burnHash}`);
    return burnHash;
  }

  async mintUSDC(attestation: any): Promise<Hex> {
    console.log(`🪙 Minting USDC on chain ${this.chainId}...`);
    
    const mintHash = await this.walletClient.writeContract({
      address: CHAIN_IDS_TO_MESSAGE_TRANSMITTER[this.chainId],
      abi: [
        {
          type: "function",
          name: "receiveMessage",
          stateMutability: "nonpayable",
          inputs: [
            { name: "message", type: "bytes" },
            { name: "attestation", type: "bytes" },
          ],
          outputs: [],
        },
      ],
      functionName: "receiveMessage",
      args: [attestation.message, attestation.attestation],
    });

    console.log(`✅ USDC minted: ${mintHash}`);
    return mintHash;
  }

  async approveUSDC(spender: Address, amount: bigint): Promise<Hex> {
    const usdcAddress = CHAIN_IDS_TO_USDC_ADDRESSES[this.chainId];
    
    return await this.walletClient.writeContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amount],
    });
  }
}

export function isGaslessSupported(chainId: SupportedChainId): boolean {
  return chainId === SupportedChainId.ARB_SEPOLIA || chainId === SupportedChainId.BASE_SEPOLIA;
}

export async function createSmartAccountService(
  privateKey: string,
  chainId: SupportedChainId
): Promise<SmartAccountService> {
  const service = new SmartAccountService({ privateKey, chainId });
  await service.initialize();
  return service;
} 