import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import {
  createPublicClient,
  http,
  parseUnits,
  type Chain,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  createBundlerClient,
} from "viem/account-abstraction";
import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";
import {
  arbitrumSepolia,
  baseSepolia,
} from "viem/chains";

dotenv.config();

// Configuration des constantes CCTP (copiées depuis cctp-v2-web-app)
const CHAIN_IDS_TO_USDC_ADDRESSES: Record<number, Hex> = {
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Sepolia
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",  // Base Sepolia
};

const CHAIN_IDS_TO_TOKEN_MESSENGER: Record<number, Hex> = {
  421614: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa", // Arbitrum Sepolia
  84532: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",  // Base Sepolia
};

const CHAIN_IDS_TO_MESSAGE_TRANSMITTER: Record<number, Hex> = {
  421614: "0xe737e5cebeeba77efe34d4aa090756590b1ce275", // Arbitrum Sepolia
  84532: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",  // Base Sepolia
};

const DESTINATION_DOMAINS: Record<number, number> = {
  421614: 3, // Arbitrum Sepolia
  84532: 6,  // Base Sepolia
};

// Configuration des chaînes
const CHAIN_MAPPING: Record<number, Chain> = {
  421614: arbitrumSepolia,
  84532: baseSepolia,
};

// Configuration hardcodée pour la démonstration
const DEMO_PRIVATE_KEY = process.env.DEMO_PRIVATE_KEY || "cff97659076bb2a8c20b59473afcab82bc5fe401acb491102cca1dcf7e68bade";
const DEMO_SMART_ACCOUNT = "0x30FaA798B5d332A733150bCA1556D7BeDA2CeB87";

const app = express();
app.use(cors());
app.use(express.json());

// Classe pour gérer le Smart Account Service
class SmartAccountService {
  private publicClient: any;
  private owner: any;
  private smartAccount: any = null;
  private bundlerClient: any;
  private chainId: number;
  private chain: Chain;

  constructor(privateKey: string, chainId: number) {
    this.chainId = chainId;
    this.chain = CHAIN_MAPPING[chainId];
    
    if (!this.chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(),
    });

    this.owner = privateKeyToAccount(`0x${privateKey.replace("0x", "")}`);
  }

  async initialize(): Promise<any> {
    console.log(`🔧 Initializing Smart Account on chain ${this.chainId}...`);

    // Créer le Smart Account
    this.smartAccount = await toCircleSmartAccount({
      client: this.publicClient,
      owner: this.owner,
    });

    // Créer le bundler client
    this.bundlerClient = createBundlerClient({
      chain: this.chain,
      transport: http("https://public.pimlico.io/v2/" + this.chainId + "/rpc"),
      paymaster: true,
    });

    console.log(`✅ Smart Account initialized: ${this.smartAccount.address}`);
    return this.smartAccount;
  }

  async sendUserOperation(calls: any[]): Promise<Hex> {
    if (!this.smartAccount) {
      throw new Error("Smart Account not initialized");
    }

    const hash = await this.bundlerClient.sendUserOperation({
      account: this.smartAccount,
      calls,
    });

    return hash;
  }

  async waitForUserOperationReceipt(hash: Hex) {
    const receipt = await this.bundlerClient.waitForUserOperationReceipt({
      hash,
    });
    return receipt;
  }

  getSmartAccountAddress(): Address {
    return this.smartAccount?.address;
  }
}

// Fonction pour exécuter le bridge gasless
async function executeBridgeGasless(
  sourceChainId: number,
  destinationChainId: number,
  amount: string,
  recipientAddress: string
) {
  console.log(`🌉 Starting gasless bridge: ${sourceChainId} → ${destinationChainId}`);
  console.log(`💰 Amount: ${amount} USDC`);
  console.log(`📍 Recipient: ${recipientAddress}`);

  // Étape 1: Burn USDC sur la chaîne source
  console.log("🔥 Step 1: Burning USDC on source chain...");
  
  const sourceSmartAccount = new SmartAccountService(DEMO_PRIVATE_KEY, sourceChainId);
  await sourceSmartAccount.initialize();

  const amountBigInt = parseUnits(amount, 6); // USDC has 6 decimals
  const finalityThreshold = 2000;
  const maxFee = amountBigInt - 1n;
  const mintRecipient = `0x${recipientAddress.replace(/^0x/, "").padStart(64, "0")}`;

  const burnUserOpHash = await sourceSmartAccount.sendUserOperation([
    {
      to: CHAIN_IDS_TO_TOKEN_MESSENGER[sourceChainId],
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
        amountBigInt,
        DESTINATION_DOMAINS[destinationChainId],
        mintRecipient as Hex,
        CHAIN_IDS_TO_USDC_ADDRESSES[sourceChainId],
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        maxFee,
        finalityThreshold,
      ],
    },
  ]);

  const burnReceipt = await sourceSmartAccount.waitForUserOperationReceipt(burnUserOpHash);
  const burnTxHash = burnReceipt.receipt.transactionHash;
  console.log(`✅ Burn transaction: ${burnTxHash}`);

  // Étape 2: Attendre l'attestation
  console.log("⏳ Step 2: Waiting for attestation...");
  
  const attestation = await retrieveAttestation(burnTxHash, sourceChainId);
  console.log("✅ Attestation received!");

  // Étape 3: Mint USDC sur la chaîne de destination
  console.log("🪙 Step 3: Minting USDC on destination chain...");
  
  const destSmartAccount = new SmartAccountService(DEMO_PRIVATE_KEY, destinationChainId);
  await destSmartAccount.initialize();

  const mintUserOpHash = await destSmartAccount.sendUserOperation([
    {
      to: CHAIN_IDS_TO_MESSAGE_TRANSMITTER[destinationChainId],
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
    },
  ]);

  const mintReceipt = await destSmartAccount.waitForUserOperationReceipt(mintUserOpHash);
  const mintTxHash = mintReceipt.receipt.transactionHash;
  console.log(`✅ Mint transaction: ${mintTxHash}`);

  return {
    burnTxHash,
    mintTxHash,
    sourceChainId,
    destinationChainId,
    amount,
    recipientAddress,
    success: true
  };
}

// Fonction pour récupérer l'attestation
async function retrieveAttestation(transactionHash: string, sourceChainId: number) {
  console.log("📡 Retrieving attestation from Circle...");
  
  const url = `https://iris-api-sandbox.circle.com/v2/messages/${DESTINATION_DOMAINS[sourceChainId]}?transactionHash=${transactionHash}`;

  while (true) {
    try {
      const response = await axios.get(url);
      if (response.data?.messages?.[0]?.status === "complete") {
        return response.data.messages[0];
      }
      console.log("⏳ Waiting for attestation...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      throw error;
    }
  }
}

// Route pour traiter les jobs
app.post('/process-job', async (req, res) => {
  try {
    console.log('🔄 Processing job:', req.body);
    
    const { type, smartAccount, fromChain, toChain, amount, token } = req.body;
    
    if (type !== 'bridge_gasless') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only bridge_gasless jobs are supported' 
      });
    }

    // Validation des paramètres
    if (!smartAccount || !fromChain || !toChain || !amount || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }

    // Vérifier si c'est la clé privée de démonstration
    const isDemoMode = DEMO_PRIVATE_KEY === process.env.DEMO_PRIVATE_KEY;
    
    if (isDemoMode) {
      console.log('🎭 Mode démonstration détecté');
      
      // Simulation du bridge gasless
      const simulatedResult = {
        burnTxHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        mintTxHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        sourceChainId: fromChain === 'arbitrum' ? 421614 : 84532,
        destinationChainId: toChain === 'base' ? 84532 : 421614,
        amount,
        recipientAddress: smartAccount,
        success: true,
        demoMode: true
      };
      
      console.log('✅ Bridge gasless simulé avec succès');
      return res.json({ 
        success: true, 
        result: simulatedResult 
      });
    }

    // Mapper les noms de chaînes vers les IDs
    const chainMapping: Record<string, number> = {
      'arbitrum': 421614,
      'base': 84532
    };

    const sourceChainId = chainMapping[fromChain];
    const destinationChainId = chainMapping[toChain];

    if (!sourceChainId || !destinationChainId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Unsupported chain' 
      });
    }

    // Exécuter le bridge gasless
    const result = await executeBridgeGasless(
      sourceChainId,
      destinationChainId,
      amount,
      smartAccount
    );

    res.json({ 
      success: true, 
      result 
    });

  } catch (error) {
    console.error('❌ Error processing job:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'circle-executor-api',
    demoMode: DEMO_PRIVATE_KEY === process.env.DEMO_PRIVATE_KEY
  });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Circle Executor API running on port ${PORT}`);
  console.log(`🎭 Demo mode: ${DEMO_PRIVATE_KEY === process.env.DEMO_PRIVATE_KEY ? 'ON' : 'OFF'}`);
  console.log(`🔑 Smart Account: ${DEMO_SMART_ACCOUNT}`);
}); 