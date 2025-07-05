// Script de seed pour TriggVest - Structure fusionnée Strategy + Wallet
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Clé de chiffrement pour les wallets
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'TriggVest2025ETHGlobalCannes4Hack';

// Chiffrer une clé privée
function encryptPrivateKey(privateKey: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Générer un wallet Ethereum
function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

async function main() {
  console.log('🌱 Démarrage du seed avec structure fusionnée...');

  // Nettoyage (ordre important pour les relations)
  await prisma.execution.deleteMany();
  await prisma.event.deleteMany();
  await prisma.position.deleteMany();
  await prisma.action.deleteMany();
  await prisma.trigger.deleteMany();
  await prisma.strategy.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Tables nettoyées');

  // 1. Créer les utilisateurs
  const users = await Promise.all([
    prisma.user.create({
      data: {
        walletAddress: '0x742d35Cc6644C30532e6391A35e7c785d0E7a123',
        username: 'CryptoTrader1',
        email: 'trader1@example.com'
      }
    }),
    prisma.user.create({
      data: {
        walletAddress: '0x8ba1f109551bD432803012645Hac136c39dc456',
        username: 'InvestorPro',
        email: 'investor@example.com'
      }
    }),
    prisma.user.create({
      data: {
        walletAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        username: 'DeFiWhale',
        email: 'whale@example.com'
      }
    })
  ]);

  console.log(`👤 ${users.length} utilisateurs créés`);

  // 2. Créer les stratégies avec wallets intégrés
  
  // Stratégie 1: Trump BTC avec 2 triggers
  const wallet1 = generateWallet();
  const strategy1 = await prisma.strategy.create({
    data: {
      userId: users[0].id,
      strategyName: 'Trump Bitcoin Strategy',
      generatedAddress: wallet1.address,
      privateKey: encryptPrivateKey(wallet1.privateKey),
      balance: 0,
      isActive: true
    }
  });

  // Triggers pour stratégie 1
  await Promise.all([
    prisma.trigger.create({
      data: {
        strategyId: strategy1.id,
        type: 'twitter',
        account: '@realdonaldtrump',
        keywords: ['bitcoin', 'crypto', 'BTC']
      }
    }),
    prisma.trigger.create({
      data: {
        strategyId: strategy1.id,
        type: 'twitter',
        account: '@federalreserve',
        keywords: ['rates', 'policy', 'economy']
      }
    })
  ]);

  // Actions pour stratégie 1
  await prisma.action.create({
    data: {
      strategyId: strategy1.id,
      type: 'convert_all',
      targetAsset: 'BTC',
      targetChain: 'Ethereum'
    }
  });

  // Stratégie 2: Elon Musk avec 1 trigger
  const wallet2 = generateWallet();
  const strategy2 = await prisma.strategy.create({
    data: {
      userId: users[0].id,
      strategyName: 'Elon Musk Signal',
      generatedAddress: wallet2.address,
      privateKey: encryptPrivateKey(wallet2.privateKey),
      balance: 0,
      isActive: true
    }
  });

  // Trigger pour stratégie 2
  await prisma.trigger.create({
    data: {
      strategyId: strategy2.id,
      type: 'twitter',
      account: '@elonmusk',
      keywords: ['dogecoin', 'tesla', 'mars']
    }
  });

  // Actions pour stratégie 2
  await Promise.all([
    prisma.action.create({
      data: {
        strategyId: strategy2.id,
        type: 'convert_all',
        targetAsset: 'DOGE',
        targetChain: 'Ethereum'
      }
    }),
    prisma.action.create({
      data: {
        strategyId: strategy2.id,
        type: 'bridge',
        targetAsset: 'USDC',
        targetChain: 'Polygon'
      }
    })
  ]);

  // Stratégie 3: Coinbase Listings avec 2 triggers
  const wallet3 = generateWallet();
  const strategy3 = await prisma.strategy.create({
    data: {
      userId: users[1].id,
      strategyName: 'Coinbase Listing Alert',
      generatedAddress: wallet3.address,
      privateKey: encryptPrivateKey(wallet3.privateKey),
      balance: 0,
      isActive: true
    }
  });

  // Triggers pour stratégie 3
  await Promise.all([
    prisma.trigger.create({
      data: {
        strategyId: strategy3.id,
        type: 'twitter',
        account: '@coinbase',
        keywords: ['listing', 'support', 'asset']
      }
    }),
    prisma.trigger.create({
      data: {
        strategyId: strategy3.id,
        type: 'twitter',
        account: '@binance',
        keywords: ['new', 'token', 'launch']
      }
    })
  ]);

  // Actions pour stratégie 3
  await prisma.action.create({
    data: {
      strategyId: strategy3.id,
      type: 'convert_all',
      targetAsset: 'ETH',
      targetChain: 'Ethereum'
    }
  });

  // Stratégie 4: Vitalik Research avec 1 trigger
  const wallet4 = generateWallet();
  const strategy4 = await prisma.strategy.create({
    data: {
      userId: users[2].id,
      strategyName: 'Vitalik Research Insights',
      generatedAddress: wallet4.address,
      privateKey: encryptPrivateKey(wallet4.privateKey),
      balance: 0,
      isActive: true
    }
  });

  // Trigger pour stratégie 4
  await prisma.trigger.create({
    data: {
      strategyId: strategy4.id,
      type: 'twitter',
      account: '@vitalikbuterin',
      keywords: ['ethereum', 'research', 'scaling']
    }
  });

  // Actions pour stratégie 4
  await Promise.all([
    prisma.action.create({
      data: {
        strategyId: strategy4.id,
        type: 'convert_all',
        targetAsset: 'ETH',
        targetChain: 'Ethereum'
      }
    }),
    prisma.action.create({
      data: {
        strategyId: strategy4.id,
        type: 'bridge',
        targetAsset: 'ETH',
        targetChain: 'Avalanche'
      }
    })
  ]);

  console.log('🎯 Stratégies avec wallets intégrés créées :');
  console.log(`   - ${strategy1.strategyName} → ${strategy1.generatedAddress}`);
  console.log(`   - ${strategy2.strategyName} → ${strategy2.generatedAddress}`);
  console.log(`   - ${strategy3.strategyName} → ${strategy3.generatedAddress}`);
  console.log(`   - ${strategy4.strategyName} → ${strategy4.generatedAddress}`);

  // 3. Créer quelques événements de test
  const events = await Promise.all([
    prisma.event.create({
      data: {
        type: 'twitter',
        account: '@realdonaldtrump',
        content: 'Bitcoin is going to the moon! Best investment ever! 🚀',
        metadata: {
          timestamp: new Date().toISOString(),
          id: 'tweet_123'
        }
      }
    }),
    prisma.event.create({
      data: {
        type: 'twitter',
        account: '@elonmusk',
        content: 'Taking Dogecoin to Mars with Tesla! 🐕🚀',
        metadata: {
          timestamp: new Date().toISOString(),
          id: 'tweet_456'
        }
      }
    }),
    prisma.event.create({
      data: {
        type: 'twitter',
        account: '@coinbase',
        content: 'We are excited to announce support for a new digital asset! 📢',
        metadata: {
          timestamp: new Date().toISOString(),
          id: 'tweet_789'
        }
      }
    })
  ]);

  console.log(`📊 ${events.length} événements de test créés`);

  // 4. Créer quelques positions initiales
  await Promise.all([
    prisma.position.create({
      data: {
        userId: users[0].id,
        asset: 'USDC',
        chain: 'Ethereum',
        amount: 1000.50,
        valueUsd: 1000.50
      }
    }),
    prisma.position.create({
      data: {
        userId: users[1].id,
        asset: 'ETH',
        chain: 'Ethereum',
        amount: 2.5,
        valueUsd: 5000.0
      }
    }),
    prisma.position.create({
      data: {
        userId: users[2].id,
        asset: 'BTC',
        chain: 'Ethereum',
        amount: 0.1,
        valueUsd: 6000.0
      }
    })
  ]);

  console.log('💰 Positions initiales créées');

  // 5. Afficher le résumé
  const strategiesCount = await prisma.strategy.count();
  const triggersCount = await prisma.trigger.count();
  const actionsCount = await prisma.action.count();

  console.log('\n✨ Seed terminé avec succès !');
  console.log('📊 Résumé :');
  console.log(`   - ${users.length} utilisateurs`);
  console.log(`   - ${strategiesCount} stratégies (wallets intégrés)`);
  console.log(`   - ${triggersCount} triggers (max 2 par stratégie)`);
  console.log(`   - ${actionsCount} actions`);
  console.log(`   - ${events.length} événements de test`);
  console.log('\n🚀 Base de données prête pour ETHGlobal Cannes 2025 !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 