import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  encodePacked,
  parseUnits,
  formatUnits,
  type Chain,
  type Hex,
  type Address,
  erc20Abi,
  maxUint256,
  parseErc6492Signature,
  getContract
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  createBundlerClient,
} from "viem/account-abstraction";
import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";
import {
  sepolia,
  arbitrumSepolia,
  baseSepolia,
  avalancheFuji,
  optimismSepolia,
  polygonAmoy,
} from "viem/chains";

// 🔗 Configuration des chaînes supportées par triggVest
export enum SupportedChainId {
  ETH_SEPOLIA = 11155111,
  ARB_SEPOLIA = 421614,
  BASE_SEPOLIA = 84532,
  AVAX_FUJI = 43113,
  OP_SEPOLIA = 11155420,
  POLYGON_AMOY = 80002,
}

// 🔗 Chain mapping for viem chains
const CHAIN_MAPPING: Record<SupportedChainId, Chain> = {
  [SupportedChainId.ETH_SEPOLIA]: sepolia,
  [SupportedChainId.ARB_SEPOLIA]: arbitrumSepolia,
  [SupportedChainId.BASE_SEPOLIA]: baseSepolia,
  [SupportedChainId.AVAX_FUJI]: avalancheFuji,
  [SupportedChainId.OP_SEPOLIA]: optimismSepolia,
  [SupportedChainId.POLYGON_AMOY]: polygonAmoy,
};

// 🔗 Adresses USDC par chaîne
const CHAIN_IDS_TO_USDC_ADDRESSES: Record<SupportedChainId, Address> = {
  [SupportedChainId.ETH_SEPOLIA]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  [SupportedChainId.ARB_SEPOLIA]: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  [SupportedChainId.BASE_SEPOLIA]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  [SupportedChainId.AVAX_FUJI]: "0x5425890298aed601595a70AB815c96711a31Bc65",
  [SupportedChainId.OP_SEPOLIA]: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
  [SupportedChainId.POLYGON_AMOY]: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
};

// 🔗 Adresses Token Messenger par chaîne
const CHAIN_IDS_TO_TOKEN_MESSENGER: Record<SupportedChainId, Address> = {
  [SupportedChainId.ETH_SEPOLIA]: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
  [SupportedChainId.ARB_SEPOLIA]: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
  [SupportedChainId.BASE_SEPOLIA]: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
  [SupportedChainId.AVAX_FUJI]: "0xa9fB1b3009DCb79E2fe346c16a604B8Fa8aE0a79",
  [SupportedChainId.OP_SEPOLIA]: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
  [SupportedChainId.POLYGON_AMOY]: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
};

// 🔗 Adresses Message Transmitter par chaîne
const CHAIN_IDS_TO_MESSAGE_TRANSMITTER: Record<SupportedChainId, Address> = {
  [SupportedChainId.ETH_SEPOLIA]: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
  [SupportedChainId.ARB_SEPOLIA]: "0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872",
  [SupportedChainId.BASE_SEPOLIA]: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
  [SupportedChainId.AVAX_FUJI]: "0xa9fB1b3009DCb79E2fe346c16a604B8Fa8aE0a79",
  [SupportedChainId.OP_SEPOLIA]: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
  [SupportedChainId.POLYGON_AMOY]: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
};

// 🔗 Domaines de destination pour CCTP
const DESTINATION_DOMAINS: Record<SupportedChainId, number> = {
  [SupportedChainId.ETH_SEPOLIA]: 0,
  [SupportedChainId.ARB_SEPOLIA]: 3,
  [SupportedChainId.BASE_SEPOLIA]: 6,
  [SupportedChainId.AVAX_FUJI]: 1,
  [SupportedChainId.OP_SEPOLIA]: 2,
  [SupportedChainId.POLYGON_AMOY]: 7,
};

// 🔗 Configuration des chaînes supportées par Circle Paymaster
const PAYMASTER_SUPPORTED_CHAINS: Record<number, {
  chain: any;
  paymasterAddress: Address;
  bundlerUrl: string;
  version: string;
}> = {
  [SupportedChainId.ARB_SEPOLIA]: {
    chain: arbitrumSepolia,
    paymasterAddress: process.env.CIRCLE_PAYMASTER_V08_ADDRESS as Address || "0x31BE08D380A21fc740883c0BC434FcFc88740b58",
    bundlerUrl: process.env.BUNDLER_URL_ARB_SEPOLIA || "https://api.pimlico.io/v2/421614/rpc?apikey=pim_your_api_key",
    version: "v0.8",
  },
  [SupportedChainId.BASE_SEPOLIA]: {
    chain: baseSepolia,
    paymasterAddress: process.env.CIRCLE_PAYMASTER_V08_ADDRESS as Address || "0x31BE08D380A21fc740883c0BC434FcFc88740b58",
    bundlerUrl: process.env.BUNDLER_URL_BASE_SEPOLIA || "https://api.pimlico.io/v2/84532/rpc?apikey=pim_your_api_key",
    version: "v0.8",
  },
};

// ✅ ABI EIP-2612 exact selon Circle documentation
const eip2612Abi = [
  ...erc20Abi,
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface SmartAccountConfig {
  privateKey: string;
  chainId: SupportedChainId;
}

export interface PaymasterData {
  paymaster: Address;
  paymasterData: Hex;
  paymasterVerificationGasLimit: bigint;
  paymasterPostOpGasLimit: bigint;
  isFinal: boolean;
}

export class SmartAccountService {
  private publicClient: any;
  private owner: any;
  private smartAccount: any = null;
  private bundlerClient: any;
  private chainConfig: any;

  constructor(config: SmartAccountConfig) {
    const chainConfig = PAYMASTER_SUPPORTED_CHAINS[config.chainId];
    if (!chainConfig) {
      throw new Error(`Chain ${config.chainId} not supported by Circle Paymaster`);
    }

    this.chainConfig = chainConfig;
    this.publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http(),
    });

    this.owner = privateKeyToAccount(`0x${config.privateKey.replace("0x", "")}`);
  }

  /**
   * Initialise le Smart Account et le configure avec Circle Paymaster
   */
  async initialize(): Promise<any> {
    console.log("🔧 Initializing Smart Account with Circle Paymaster...");

    // Créer le Smart Account
    this.smartAccount = await toCircleSmartAccount({
      client: this.publicClient,
      owner: this.owner,
    });

    console.log(`✅ Smart Account created: ${this.smartAccount.address}`);

    // Créer le bundler client
    this.bundlerClient = createBundlerClient({
      chain: this.chainConfig.chain,
      transport: http(this.chainConfig.bundlerUrl),
      paymaster: this.createPaymaster(),
    });

    console.log(`✅ Bundler client configured for chain ${this.chainConfig.chain.name}`);
    
    return this.smartAccount;
  }

  /**
   * Crée le paymaster pour les transactions gasless
   */
  private createPaymaster() {
    return {
      async getPaymasterData(userOperation: any): Promise<PaymasterData> {
        console.log("🔍 Requesting paymaster data...");
        
        // Simulation - dans un vrai environnement, cela ferait un appel à l'API Circle
        return {
          paymaster: this.chainConfig.paymasterAddress,
          paymasterData: "0x",
          paymasterVerificationGasLimit: 100000n,
          paymasterPostOpGasLimit: 100000n,
          isFinal: false,
        };
      },
      
      async getPaymasterStubData(): Promise<any> {
        return {
          paymaster: this.chainConfig.paymasterAddress,
          paymasterData: "0x",
          paymasterVerificationGasLimit: 100000n,
          paymasterPostOpGasLimit: 100000n,
        };
      },
    };
  }

  /**
   * Obtient le solde USDC du Smart Account
   */
  async getUSDCBalance(): Promise<string> {
    if (!this.smartAccount) {
      throw new Error("Smart Account not initialized");
    }

    try {
      const balance = await this.publicClient.readContract({
        address: this.getUSDCAddress(),
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [this.smartAccount.address],
      });

      return formatUnits(balance, 6);
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération du solde USDC: ${error}`);
      throw new Error(`Impossible de récupérer le solde USDC du Smart Account`);
    }
  }

  /**
   * Vérifie si le Smart Account a suffisamment de fonds pour une transaction
   */
  async checkSufficientBalance(requiredAmount: string, includeGasFees: boolean = true): Promise<{
    sufficient: boolean;
    currentBalance: string;
    requiredAmount: string;
    shortfall?: string;
    recommendedAmount?: string;
  }> {
    const balance = await this.getUSDCBalance();
    const balanceFloat = parseFloat(balance);
    const requiredFloat = parseFloat(requiredAmount);
    
    // Ajouter une marge pour les frais gasless si demandé
    const gasMargin = includeGasFees ? 1.0 : 0;
    const totalRequired = requiredFloat + gasMargin;
    
    const sufficient = balanceFloat >= totalRequired;
    
    const result: {
      sufficient: boolean;
      currentBalance: string;
      requiredAmount: string;
      shortfall?: string;
      recommendedAmount?: string;
    } = {
      sufficient,
      currentBalance: balance,
      requiredAmount: requiredAmount,
    };
    
    if (!sufficient) {
      result.shortfall = (totalRequired - balanceFloat).toFixed(6);
      result.recommendedAmount = (totalRequired).toFixed(6);
    }
    
    return result;
  }

  /**
   * Envoie une user operation via le bundler
   */
  async sendUserOperation(calls: any[]): Promise<Hex> {
    if (!this.smartAccount || !this.bundlerClient) {
      throw new Error("Smart Account or Bundler not initialized");
    }

    console.log("📤 Sending user operation...");
    
    const userOpHash = await this.bundlerClient.sendUserOperation({
      account: this.smartAccount,
      calls,
    });

    console.log(`✅ User operation sent: ${userOpHash}`);
    return userOpHash;
  }

  /**
   * Attend la réception d'une user operation
   */
  async waitForUserOperationReceipt(hash: Hex) {
    if (!this.bundlerClient) {
      throw new Error("Bundler not initialized");
    }

    console.log(`⏳ Waiting for user operation receipt: ${hash}`);
    
    const receipt = await this.bundlerClient.waitForUserOperationReceipt({
      hash,
    });

    console.log(`✅ User operation mined: ${receipt.transactionHash}`);
    return receipt;
  }

  /**
   * Exécute un burn USDC pour CCTP (gasless)
   */
  async burnUSDC(
    amount: bigint,
    destinationChainId: SupportedChainId,
    destinationAddress: string,
    transferType: "fast" | "standard" = "fast"
  ): Promise<Hex> {
    if (!this.smartAccount) {
      throw new Error("Smart Account not initialized");
    }

    console.log("🔥 Burning USDC via CCTP...");

    const finalityThreshold = transferType === "fast" ? 1000 : 2000;
    const maxFee = amount - 1n;
    const mintRecipient = `0x${destinationAddress.replace(/^0x/, "").padStart(64, "0")}`;

    const userOpHash = await this.sendUserOperation([
      {
        to: CHAIN_IDS_TO_TOKEN_MESSENGER[this.chainConfig.chain.id as SupportedChainId],
        data: encodeFunctionData({
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
              ],
              outputs: [{ name: "nonce", type: "uint64" }],
            },
          ],
          functionName: "depositForBurn",
          args: [
            amount,
            DESTINATION_DOMAINS[destinationChainId],
            mintRecipient as Hex,
            this.getUSDCAddress(),
          ],
        }),
      },
    ]);

    console.log(`✅ USDC burned: ${userOpHash}`);
    return userOpHash;
  }

  /**
   * Exécute un mint USDC pour CCTP (gasless)
   */
  async mintUSDC(attestation: any): Promise<Hex> {
    if (!this.smartAccount) {
      throw new Error("Smart Account not initialized");
    }

    console.log("🪙 Minting USDC via CCTP...");

    const userOpHash = await this.sendUserOperation([
      {
        to: CHAIN_IDS_TO_MESSAGE_TRANSMITTER[this.chainConfig.chain.id as SupportedChainId],
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "receiveMessage",
              stateMutability: "nonpayable",
              inputs: [
                { name: "message", type: "bytes" },
                { name: "attestation", type: "bytes" },
              ],
              outputs: [{ name: "success", type: "bool" }],
            },
          ],
          functionName: "receiveMessage",
          args: [attestation.message, attestation.attestation],
        }),
      },
    ]);

    console.log(`✅ USDC minted: ${userOpHash}`);
    return userOpHash;
  }

  /**
   * Obtient l'adresse USDC pour la chaîne courante
   */
  private getUSDCAddress(): Address {
    return CHAIN_IDS_TO_USDC_ADDRESSES[this.chainConfig.chain.id as SupportedChainId];
  }

  /**
   * Obtient l'adresse du Smart Account
   */
  getSmartAccountAddress(): Address {
    if (!this.smartAccount) {
      throw new Error("Smart Account not initialized");
    }
    return this.smartAccount.address;
  }

  /**
   * Obtient l'adresse du propriétaire
   */
  getOwnerAddress(): Address {
    return this.owner.address;
  }

  /**
   * Vérifie si le Smart Account est initialisé
   */
  get isInitialized(): boolean {
    return this.smartAccount !== null;
  }

  /**
   * Obtient les chaînes supportées
   */
  get supportedChains(): SupportedChainId[] {
    return Object.keys(PAYMASTER_SUPPORTED_CHAINS).map(id => Number(id) as SupportedChainId);
  }
}

/**
 * Vérifie si une chaîne supporte Circle Paymaster
 */
export function isPaymasterSupported(chainId: SupportedChainId): boolean {
  return chainId in PAYMASTER_SUPPORTED_CHAINS;
}

/**
 * Crée et initialise un Smart Account Service
 */
export async function createSmartAccountService(
  privateKey: string,
  chainId: SupportedChainId
): Promise<SmartAccountService> {
  const service = new SmartAccountService({ privateKey, chainId });
  await service.initialize();
  return service;
}

/**
 * Vérifie si une chaîne supporte les transactions gasless
 */
export function isGaslessSupported(chainId: SupportedChainId): boolean {
  return isPaymasterSupported(chainId);
}

// Export des constantes utiles
export {
  CHAIN_IDS_TO_USDC_ADDRESSES,
  CHAIN_IDS_TO_TOKEN_MESSENGER,
  CHAIN_IDS_TO_MESSAGE_TRANSMITTER,
  DESTINATION_DOMAINS,
  CHAIN_MAPPING,
}; 