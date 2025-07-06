// Wallet Manager pour TriggVest - Gestion des wallets intégrés aux stratégies
import { ethers } from 'ethers';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createSmartAccount, getSupportedChains } from './smart-account-manager';

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
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

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
 * Créer une stratégie complète avec wallet intégré et smart account
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
    amount?: string; // Montant pour les actions d'achat/vente
  }>;
  smartAccountChain?: string; // Chaîne pour créer le smart account (optionnel)
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
      // Construire les paramètres JSON avec le montant
      const parameters = action.amount ? { amount: action.amount } : undefined;
      
      await prisma.action.create({
        data: {
          strategyId: strategy.id,
          type: action.type,
          targetAsset: action.targetAsset,
          targetChain: action.targetChain,
          parameters: parameters
        }
      });
    }

    console.log(`✅ Stratégie créée avec wallet: ${strategy.id} → ${wallet.address}`);

    // Créer le smart account si une chaîne est spécifiée
    let smartAccountInfo = null;
    if (data.smartAccountChain) {
      console.log(`🔄 Création du smart account sur ${data.smartAccountChain}...`);
      
      // Vérifier si la chaîne est supportée
      const supportedChains = getSupportedChains();
      if (!supportedChains.includes(data.smartAccountChain)) {
        return {
          success: false,
          message: `Chaîne ${data.smartAccountChain} non supportée. Chaînes supportées: ${supportedChains.join(', ')}`
        };
      }

      const smartAccountResult = await createSmartAccount({
        chain: data.smartAccountChain,
        ownerPrivateKey: wallet.privateKey,
        strategyId: strategy.id
      });

      if (!smartAccountResult.success) {
        // Supprimer la stratégie créée en cas d'erreur
        await prisma.strategy.delete({
          where: { id: strategy.id }
        });
        
        return {
          success: false,
          message: `Erreur lors de la création du smart account: ${smartAccountResult.message}`
        };
      }

      smartAccountInfo = smartAccountResult.smartAccount;
      console.log(`✅ Smart account créé: ${smartAccountInfo?.address}`);
    }

    return {
      success: true,
      message: data.smartAccountChain ? 
        'Stratégie, wallet et smart account créés avec succès' : 
        'Stratégie et wallet créés avec succès',
      strategy: {
        id: strategy.id,
        strategyName: strategy.strategyName,
        generatedAddress: strategy.generatedAddress,
        balance: strategy.balance.toString(),
        triggers: data.triggers,
        actions: data.actions,
        smartAccount: smartAccountInfo
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