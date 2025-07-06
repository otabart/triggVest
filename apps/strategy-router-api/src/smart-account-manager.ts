// Smart Account Manager pour TriggVest - Gestion des smart accounts Circle Paymaster
import { ethers } from 'ethers';
import { createPimlicoPaymasterClient } from 'permissionless/clients/pimlico';
import { createPublicClient, http, createWalletClient, encodeFunctionData, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, arbitrumSepolia, baseSepolia, optimismSepolia, polygonAmoy } from 'viem/chains';
import { createSmartAccountClient } from 'permissionless';
import { signerToSimpleSmartAccount } from 'permissionless/accounts';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Clé de chiffrement pour les clés privées
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'TriggVest2025ETHGlobalCannes4Hack';

/**
 * Déchiffrer une clé privée
 */
function decryptPrivateKey(encryptedKey: string): string {
  const parts = encryptedKey.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Configuration des chaînes supportées
const CHAINS = {
  'eth-sepolia': {
    chain: sepolia,
    bundlerUrl: process.env.BUNDLER_URL_ETH_SEPOLIA || '',
    paymasterAddress: process.env.CIRCLE_PAYMASTER_V08_ADDRESS || '0x31BE08D380A21fc740883c0BC434FcFc88740b58'
  },
  'arb-sepolia': {
    chain: arbitrumSepolia,
    bundlerUrl: process.env.BUNDLER_URL_ARB_SEPOLIA || '',
    paymasterAddress: process.env.CIRCLE_PAYMASTER_V08_ADDRESS || '0x31BE08D380A21fc740883c0BC434FcFc88740b58'
  },
  'base-sepolia': {
    chain: baseSepolia,
    bundlerUrl: process.env.BUNDLER_URL_BASE_SEPOLIA || '',
    paymasterAddress: process.env.CIRCLE_PAYMASTER_V08_ADDRESS || '0x31BE08D380A21fc740883c0BC434FcFc88740b58'
  },
  'op-sepolia': {
    chain: optimismSepolia,
    bundlerUrl: process.env.BUNDLER_URL_OP_SEPOLIA || '',
    paymasterAddress: process.env.CIRCLE_PAYMASTER_V08_ADDRESS || '0x31BE08D380A21fc740883c0BC434FcFc88740b58'
  },
  'polygon-amoy': {
    chain: polygonAmoy,
    bundlerUrl: process.env.BUNDLER_URL_POLYGON_AMOY || '',
    paymasterAddress: process.env.CIRCLE_PAYMASTER_V08_ADDRESS || '0x31BE08D380A21fc740883c0BC434FcFc88740b58'
  }
};

export interface SmartAccountConfig {
  chain: string;
  ownerPrivateKey: string;
  strategyId: string;
}

export interface SmartAccountInfo {
  address: string;
  owner: string;
  chain: string;
  factory: string;
  created: boolean;
  balance: string;
}

/**
 * Créer un smart account avec Circle Paymaster
 */
export async function createSmartAccount(config: SmartAccountConfig): Promise<{
  success: boolean;
  message: string;
  smartAccount?: SmartAccountInfo;
}> {
  try {
    console.log(`🔄 Création du smart account sur ${config.chain}...`);

    // Vérifier si la chaîne est supportée
    const chainConfig = CHAINS[config.chain as keyof typeof CHAINS];
    if (!chainConfig) {
      return {
        success: false,
        message: `Chaîne ${config.chain} non supportée`
      };
    }

    // Créer le compte privé à partir de la clé privée
    const account = privateKeyToAccount(config.ownerPrivateKey as Hex);

    // Créer le client public
    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http()
    });

    // Créer le client wallet
    const walletClient = createWalletClient({
      account,
      chain: chainConfig.chain,
      transport: http()
    });

    // Créer le client Pimlico Paymaster
    const pimlicoPaymasterClient = createPimlicoPaymasterClient({
      transport: http(chainConfig.bundlerUrl)
    });

    // Créer le simple smart account
    const simpleSmartAccount = await signerToSimpleSmartAccount(publicClient, {
      signer: account,
      factoryAddress: '0x9406Cc6185a346906296840746125a0E44976454', // SimpleAccountFactory
      entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
    });

    // Créer le client smart account
    const smartAccountClient = createSmartAccountClient({
      account: simpleSmartAccount,
      entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      chain: chainConfig.chain,
      bundlerTransport: http(chainConfig.bundlerUrl),
      middleware: {
        sponsorUserOperation: pimlicoPaymasterClient.sponsorUserOperation
      }
    });

    // Récupérer l'adresse du smart account
    const smartAccountAddress = smartAccountClient.account.address;

    console.log(`✅ Smart account créé: ${smartAccountAddress}`);
    console.log(`👤 Propriétaire: ${account.address}`);
    console.log(`🌐 Chaîne: ${config.chain}`);

    // Créer l'objet SmartAccountInfo
    const smartAccount: SmartAccountInfo = {
      address: smartAccountAddress,
      owner: account.address,
      chain: config.chain,
      factory: '0x9406Cc6185a346906296840746125a0E44976454',
      created: true,
      balance: '0'
    };

    // Mettre à jour la stratégie en base de données
    await prisma.strategy.update({
      where: { id: config.strategyId },
      data: {
        smartAccountAddress: smartAccountAddress,
        smartAccountOwner: account.address,
        smartAccountChain: config.chain,
        smartAccountFactory: '0x9406Cc6185a346906296740746125a0E44976454',
        smartAccountCreated: true,
        smartAccountBalance: 0
      }
    });

    console.log(`✅ Smart account enregistré en base de données pour la stratégie ${config.strategyId}`);

    return {
      success: true,
      message: 'Smart account créé avec succès',
      smartAccount
    };

  } catch (error) {
    console.error('❌ Erreur lors de la création du smart account:', error);
    return {
      success: false,
      message: `Erreur lors de la création du smart account: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
}

/**
 * Récupérer les informations d'un smart account
 */
export async function getSmartAccountInfo(strategyId: string): Promise<SmartAccountInfo | null> {
  try {
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
      select: {
        smartAccountAddress: true,
        smartAccountOwner: true,
        smartAccountChain: true,
        smartAccountFactory: true,
        smartAccountCreated: true,
        smartAccountBalance: true
      }
    });

    if (!strategy || !strategy.smartAccountCreated) {
      return null;
    }

    return {
      address: strategy.smartAccountAddress!,
      owner: strategy.smartAccountOwner!,
      chain: strategy.smartAccountChain!,
      factory: strategy.smartAccountFactory!,
      created: strategy.smartAccountCreated,
      balance: strategy.smartAccountBalance.toString()
    };

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du smart account:', error);
    return null;
  }
}

/**
 * Mettre à jour la balance d'un smart account
 */
export async function updateSmartAccountBalance(strategyId: string, newBalance: string): Promise<boolean> {
  try {
    await prisma.strategy.update({
      where: { id: strategyId },
      data: {
        smartAccountBalance: newBalance
      }
    });

    console.log(`✅ Balance du smart account mise à jour: ${newBalance} pour la stratégie ${strategyId}`);
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la balance du smart account:', error);
    return false;
  }
}

/**
 * Exécuter une transaction gasless avec le smart account
 */
export async function executeGaslessTransaction(
  strategyId: string,
  to: string,
  value: bigint,
  data: string
): Promise<{
  success: boolean;
  message: string;
  txHash?: string;
}> {
  try {
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
      select: {
        smartAccountAddress: true,
        smartAccountOwner: true,
        smartAccountChain: true,
        privateKey: true
      }
    });

    if (!strategy || !strategy.smartAccountCreated) {
      return {
        success: false,
        message: 'Smart account non trouvé ou non créé'
      };
    }

    // Vérifier si la chaîne est supportée
    const chainConfig = CHAINS[strategy.smartAccountChain as keyof typeof CHAINS];
    if (!chainConfig) {
      return {
        success: false,
        message: `Chaîne ${strategy.smartAccountChain} non supportée`
      };
    }

    // Décrypter la clé privée
    const privateKey = decryptPrivateKey(strategy.privateKey);
    const account = privateKeyToAccount(privateKey as Hex);

    // Créer le client public
    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http()
    });

    // Créer le client Pimlico Paymaster
    const pimlicoPaymasterClient = createPimlicoPaymasterClient({
      transport: http(chainConfig.bundlerUrl)
    });

    // Créer le simple smart account
    const simpleSmartAccount = await signerToSimpleSmartAccount(publicClient, {
      signer: account,
      factoryAddress: '0x9406Cc6185a346906296840746125a0E44976454',
      entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
    });

    // Créer le client smart account
    const smartAccountClient = createSmartAccountClient({
      account: simpleSmartAccount,
      entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      chain: chainConfig.chain,
      bundlerTransport: http(chainConfig.bundlerUrl),
      middleware: {
        sponsorUserOperation: pimlicoPaymasterClient.sponsorUserOperation
      }
    });

    // Exécuter la transaction
    const txHash = await smartAccountClient.sendTransaction({
      to: to as Hex,
      value: value,
      data: data as Hex
    });

    console.log(`✅ Transaction gasless exécutée: ${txHash}`);

    return {
      success: true,
      message: 'Transaction gasless exécutée avec succès',
      txHash
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la transaction gasless:', error);
    return {
      success: false,
      message: `Erreur lors de l'exécution de la transaction: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
}

/**
 * Lister les chaînes supportées
 */
export function getSupportedChains(): string[] {
  return Object.keys(CHAINS);
} 