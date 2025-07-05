// Wallet Manager pour TriggVest - Gestion des wallets intégrés aux stratégies
import { ethers } from 'ethers';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Clé de chiffrement pour les clés privées
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'TriggVest2025ETHGlobalCannes4Hack';

export interface WalletCreationRequest {
  strategyId: string;
  userWalletAddress: string;
}

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  balance: string;
}

/**
 * Chiffrer une clé privée
 */
function encryptPrivateKey(privateKey: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * Déchiffrer une clé privée
 */
function decryptPrivateKey(encryptedKey: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Générer un nouveau wallet Ethereum
 */
export function generateWallet(): GeneratedWallet {
  const wallet = ethers.Wallet.createRandom();
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    balance: '0'
  };
}

/**
 * Créer une stratégie complète avec wallet intégré
 */
export async function createStrategyWithWallet(data: {
  userWalletAddress: string;
  strategyName: string;
  triggers: Array<{
    type: string;
    account?: string;
    keywords?: string[];
  }>;
  actions: Array<{
    type: string;
    targetAsset: string;
    targetChain: string;
  }>;
}): Promise<{
  success: boolean;
  message: string;
  strategy?: any;
}> {
  try {
    // Validation : max 2 triggers
    if (data.triggers.length > 2) {
      return {
        success: false,
        message: 'Maximum 2 triggers autorisés par stratégie'
      };
    }

    // Créer ou récupérer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { walletAddress: data.userWalletAddress }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: data.userWalletAddress,
          username: `User_${data.userWalletAddress.slice(0, 8)}`
        }
      });
      console.log(`👤 Nouvel utilisateur créé: ${user.id}`);
    }

    // Générer le wallet
    const wallet = generateWallet();
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);

    // Créer la stratégie avec wallet intégré
    const strategy = await prisma.strategy.create({
      data: {
        userId: user.id,
        strategyName: data.strategyName,
        generatedAddress: wallet.address,
        privateKey: encryptedPrivateKey,
        balance: 0,
        isActive: true
      }
    });

    // Créer les triggers
    for (const trigger of data.triggers) {
      await prisma.trigger.create({
        data: {
          strategyId: strategy.id,
          type: trigger.type,
          account: trigger.account,
          keywords: trigger.keywords || []
        }
      });
    }

    // Créer les actions
    for (const action of data.actions) {
      await prisma.action.create({
        data: {
          strategyId: strategy.id,
          type: action.type,
          targetAsset: action.targetAsset,
          targetChain: action.targetChain
        }
      });
    }

    console.log(`✅ Stratégie créée avec wallet: ${strategy.id} → ${wallet.address}`);

    return {
      success: true,
      message: 'Stratégie et wallet créés avec succès',
      strategy: {
        id: strategy.id,
        strategyName: strategy.strategyName,
        generatedAddress: strategy.generatedAddress,
        balance: strategy.balance.toString(),
        triggers: data.triggers,
        actions: data.actions
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de la création de la stratégie:', error);
    return {
      success: false,
      message: 'Erreur lors de la création de la stratégie'
    };
  }
}

/**
 * Récupérer un wallet de stratégie (pour exécution)
 */
export async function getStrategyWallet(strategyId: string): Promise<{
  wallet: ethers.Wallet | null;
  address: string;
  balance: string;
}> {
  try {
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId }
    });

    if (!strategy) {
      return { wallet: null, address: '', balance: '0' };
    }

    // Déchiffrer la clé privée
    const privateKey = decryptPrivateKey(strategy.privateKey);
    
    // Créer l'instance wallet
    const wallet = new ethers.Wallet(privateKey);

    return {
      wallet,
      address: strategy.generatedAddress,
      balance: strategy.balance.toString()
    };

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du wallet:', error);
    return { wallet: null, address: '', balance: '0' };
  }
}

/**
 * Mettre à jour la balance d'une stratégie
 */
export async function updateStrategyBalance(strategyId: string, newBalance: string): Promise<boolean> {
  try {
    await prisma.strategy.update({
      where: { id: strategyId },
      data: { balance: parseFloat(newBalance) }
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la balance:', error);
    return false;
  }
}

/**
 * Lister toutes les stratégies d'un utilisateur
 */
export async function getUserStrategies(userWalletAddress: string): Promise<{
  strategyId: string;
  strategyName: string;
  generatedAddress: string;
  balance: string;
  isActive: boolean;
  triggersCount: number;
  actionsCount: number;
}[]> {
  try {
    const strategies = await prisma.strategy.findMany({
      where: { 
        user: { walletAddress: userWalletAddress }
      },
      include: {
        triggers: true,
        actions: true
      }
    });

    return strategies.map(strategy => ({
      strategyId: strategy.id,
      strategyName: strategy.strategyName,
      generatedAddress: strategy.generatedAddress,
      balance: strategy.balance.toString(),
      isActive: strategy.isActive,
      triggersCount: strategy.triggers.length,
      actionsCount: strategy.actions.length
    }));

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stratégies:', error);
    return [];
  }
}

/**
 * Récupérer les stratégies actives pour le matching
 */
export async function getActiveStrategies(): Promise<any[]> {
  try {
    const strategies = await prisma.strategy.findMany({
      where: { isActive: true },
      include: {
        user: true,
        triggers: true,
        actions: true
      }
    });

    // Convertir au format attendu par l'API
    return strategies.map(strategy => ({
      id: strategy.id,
      userId: strategy.userId,
      strategyName: strategy.strategyName,
      generatedAddress: strategy.generatedAddress,
      triggers: strategy.triggers.map(trigger => ({
        type: trigger.type,
        account: trigger.account || undefined,
        keywords: trigger.keywords
      })),
      actions: strategy.actions.map(action => ({
        type: action.type,
        targetAsset: action.targetAsset,
        targetChain: action.targetChain
      }))
    }));

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stratégies actives:', error);
    return [];
  }
} 