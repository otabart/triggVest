// Test pour la structure fusionnée Strategy + Wallet
// ETHGlobal Cannes 2025 - TriggVest

import chalk from 'chalk';
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

// Logger avec couleurs
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️ '), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠️ '), msg),
  header: (msg) => console.log(chalk.cyan.bold(`\n${msg}`)),
  json: (obj) => console.log(chalk.gray(JSON.stringify(obj, null, 2)))
};

// Wallet de test
const TEST_WALLET = '0x1234567890123456789012345678901234567890';

// Test 1: Créer une stratégie avec 2 triggers
async function testCreateStrategyWithTwoTriggers() {
  log.header('TEST 1: Créer stratégie avec 2 triggers (limite)');
  
  const strategy = {
    userWalletAddress: TEST_WALLET,
    strategyName: 'Trump + Fed Strategy',
    triggers: [
      {
        type: 'twitter',
        account: '@realdonaldtrump',
        keywords: ['bitcoin', 'crypto', 'economy']
      },
      {
        type: 'twitter',
        account: '@federalreserve',
        keywords: ['rates', 'interest', 'policy']
      }
    ],
    actions: [
      {
        type: 'convert_all',
        targetAsset: 'USDC',
        targetChain: 'Ethereum'
      }
    ]
  };
  
  try {
    const response = await fetch(`${API_BASE}/create-strategy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy)
    });
    
    const result = await response.json();
    
    if (result.success) {
      log.success('Stratégie créée avec 2 triggers');
      log.json({
        id: result.strategy.id,
        name: result.strategy.strategyName,
        generatedWallet: result.strategy.generatedAddress,
        triggers: result.strategy.triggers.length
      });
      return result.strategy.id;
    } else {
      log.error(`Erreur: ${result.error}`);
      return null;
    }
  } catch (error) {
    log.error(`Erreur réseau: ${error.message}`);
    return null;
  }
}

// Test 2: Tenter de créer avec 3 triggers (devrait échouer)
async function testCreateStrategyWithThreeTriggers() {
  log.header('TEST 2: Tenter création avec 3 triggers (doit échouer)');
  
  const strategy = {
    userWalletAddress: TEST_WALLET,
    strategyName: 'Too Many Triggers Strategy',
    triggers: [
      {
        type: 'twitter',
        account: '@realdonaldtrump',
        keywords: ['bitcoin']
      },
      {
        type: 'twitter',
        account: '@federalreserve',
        keywords: ['rates']
      },
      {
        type: 'twitter',
        account: '@elonmusk',
        keywords: ['crypto']
      }
    ],
    actions: [
      {
        type: 'convert_all',
        targetAsset: 'BTC',
        targetChain: 'Ethereum'
      }
    ]
  };
  
  try {
    const response = await fetch(`${API_BASE}/create-strategy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy)
    });
    
    const result = await response.json();
    
    if (!result.success && result.error.includes('Maximum 2 triggers')) {
      log.success('Validation OK - Rejet avec 3 triggers');
      log.info(`Message: ${result.error}`);
    } else {
      log.error('Validation échouée - 3 triggers acceptés !');
      log.json(result);
    }
  } catch (error) {
    log.error(`Erreur réseau: ${error.message}`);
  }
}

// Test 3: Créer une stratégie avec 1 trigger
async function testCreateStrategyWithOneTrigger() {
  log.header('TEST 3: Créer stratégie avec 1 trigger');
  
  const strategy = {
    userWalletAddress: `${TEST_WALLET}_2`,
    strategyName: 'Single Trigger Strategy',
    triggers: [
      {
        type: 'twitter',
        account: '@coinbase',
        keywords: ['listing', 'new', 'asset']
      }
    ],
    actions: [
      {
        type: 'convert_all',
        targetAsset: 'ETH',
        targetChain: 'Polygon'
      },
      {
        type: 'bridge',
        targetAsset: 'USDC',
        targetChain: 'Avalanche'
      }
    ]
  };
  
  try {
    const response = await fetch(`${API_BASE}/create-strategy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy)
    });
    
    const result = await response.json();
    
    if (result.success) {
      log.success('Stratégie créée avec 1 trigger');
      log.json({
        id: result.strategy.id,
        name: result.strategy.strategyName,
        generatedWallet: result.strategy.generatedAddress,
        triggers: result.strategy.triggers.length,
        actions: result.strategy.actions.length
      });
      return result.strategy.id;
    } else {
      log.error(`Erreur: ${result.error}`);
      return null;
    }
  } catch (error) {
    log.error(`Erreur réseau: ${error.message}`);
    return null;
  }
}

// Test 4: Lister les stratégies d'un utilisateur
async function testListUserStrategies(walletAddress) {
  log.header(`TEST 4: Lister stratégies de ${walletAddress.slice(0, 10)}...`);
  
  try {
    const response = await fetch(`${API_BASE}/user-strategies/${walletAddress}`);
    const result = await response.json();
    
    if (result.success) {
      log.success(`${result.total} stratégies trouvées`);
      
      result.strategies.forEach((strategy, index) => {
        log.info(`Stratégie ${index + 1}:`);
        log.json({
          id: strategy.strategyId.slice(0, 8) + '...',
          name: strategy.strategyName,
          wallet: strategy.generatedAddress.slice(0, 10) + '...',
          balance: strategy.balance + ' wei',
          triggers: strategy.triggersCount,
          actions: strategy.actionsCount,
          active: strategy.isActive
        });
      });
    } else {
      log.error(`Erreur: ${result.error}`);
    }
  } catch (error) {
    log.error(`Erreur réseau: ${error.message}`);
  }
}

// Test 5: Envoyer un événement pour déclencher les stratégies
async function testTriggerEvent() {
  log.header('TEST 5: Déclencher événement Trump Bitcoin');
  
  const event = {
    id: 'test_' + Date.now(),
    type: 'twitter',
    account: '@realdonaldtrump',
    content: 'Bitcoin is the future of money! Crypto will change everything! 🚀',
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch(`${API_BASE}/process-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    
    const result = await response.json();
    
    if (result.success) {
      log.success(`Événement traité - ${result.matchedStrategies} stratégies matchées`);
      
      if (result.strategies.length > 0) {
        result.strategies.forEach((strategy) => {
          log.info(`Match: ${strategy.name} → ${strategy.generatedWallet.slice(0, 10)}...`);
        });
        
        result.users.forEach((user) => {
          log.info(`Utilisateur: ${user.walletAddress.slice(0, 10)}... → ${user.username}`);
        });
      }
    } else {
      log.error(`Erreur: ${result.error}`);
    }
  } catch (error) {
    log.error(`Erreur réseau: ${error.message}`);
  }
}

// Test 6: Vérifier le statut de l'API
async function testApiStatus() {
  log.header('TEST 6: Statut de l\'API');
  
  try {
    const response = await fetch(`${API_BASE}/status`);
    const result = await response.json();
    
    log.success('API active');
    log.json({
      status: result.status,
      strategiesActives: result.strategiesCount,
      timestamp: result.timestamp
    });
  } catch (error) {
    log.error(`API non disponible: ${error.message}`);
  }
}

// Script principal
async function runTests() {
  console.log(chalk.magenta.bold('🧪 Tests Structure Fusionnée Strategy + Wallet'));
  console.log(chalk.gray('ETHGlobal Cannes 2025 - TriggVest\n'));
  
  // Vérifier que l'API est active
  await testApiStatus();
  
  // Test de validation (3 triggers = rejet)
  await testCreateStrategyWithThreeTriggers();
  
  // Créer stratégies test
  const strategyId1 = await testCreateStrategyWithTwoTriggers();
  const strategyId2 = await testCreateStrategyWithOneTrigger();
  
  // Lister les stratégies
  await testListUserStrategies(TEST_WALLET);
  await testListUserStrategies(`${TEST_WALLET}_2`);
  
  // Test de déclenchement
  await testTriggerEvent();
  
  log.header('✨ Tests terminés !');
  
  if (strategyId1 && strategyId2) {
    log.success('Toutes les stratégies ont été créées avec succès');
    log.info('Structure fusionnée validée ✅');
  } else {
    log.warn('Certains tests ont échoué');
  }
}

// Lancer les tests
runTests().catch(console.error); 