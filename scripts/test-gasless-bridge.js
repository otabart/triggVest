#!/usr/bin/env node
/**
 * Script de test pour le bridge gasless CCTP dans triggVest
 * Ce script simule une stratégie qui exécute un bridge gasless
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const STRATEGY_ROUTER_URL = 'http://localhost:3002';
const CIRCLE_EXECUTOR_URL = 'http://localhost:3003';

// Données de test
const testUser = {
  walletAddress: '0x742d35Cc6644C30532e6391A35e7c785d0E7a123',
  strategyName: 'Test Bridge Gasless Strategy',
  triggers: [
    {
      type: 'twitter',
      account: '@testaccount',
      keywords: ['bridge', 'gasless', 'test']
    }
  ],
  actions: [
    {
      type: 'bridge_gasless',
      targetAsset: 'USDC',
      targetChain: 'Base',
      sourceChain: 'Arbitrum',
      amount: '5'
    }
  ]
};

const testEvent = {
  type: 'twitter',
  account: '@testaccount',
  content: 'Test bridge gasless functionality',
  timestamp: new Date().toISOString(),
  id: 'test_' + Date.now()
};

console.log('🚀 Test du bridge gasless CCTP - triggVest'.rainbow);
console.log('=' .repeat(50));

async function testGaslessBridge() {
  try {
    // Étape 1: Créer une stratégie de test
    console.log('\n📋 Étape 1: Création de la stratégie de test...');
    
    const strategyResponse = await axios.post(`${STRATEGY_ROUTER_URL}/api/create-strategy`, testUser);
    
    if (strategyResponse.data.success) {
      console.log('✅ Stratégie créée avec succès:'.green);
      console.log(`   - ID: ${strategyResponse.data.strategy.id}`);
      console.log(`   - Nom: ${strategyResponse.data.strategy.strategyName}`);
      console.log(`   - Wallet généré: ${strategyResponse.data.strategy.generatedAddress}`);
      console.log(`   - Balance: ${strategyResponse.data.strategy.balance} USDC`);
    } else {
      console.log('❌ Échec de la création de la stratégie:'.red);
      console.log(`   - Message: ${strategyResponse.data.message}`);
      return;
    }

    // Étape 2: Vérifier que les APIs sont actives
    console.log('\n🔍 Étape 2: Vérification des APIs...');
    
    try {
      const routerStatus = await axios.get(`${STRATEGY_ROUTER_URL}/api/status`);
      console.log(`✅ Strategy Router: ${routerStatus.data.status}`.green);
      console.log(`   - Stratégies actives: ${routerStatus.data.strategiesCount}`);
    } catch (error) {
      console.log('❌ Strategy Router indisponible'.red);
      return;
    }

    try {
      const executorStatus = await axios.get(`${CIRCLE_EXECUTOR_URL}/api/status`);
      console.log(`✅ Circle Executor: ${executorStatus.data.status}`.green);
      console.log(`   - Exécutions: ${executorStatus.data.executionsCount}`);
    } catch (error) {
      console.log('❌ Circle Executor indisponible'.red);
      return;
    }

    // Étape 3: Simuler un événement qui déclenche la stratégie
    console.log('\n🎯 Étape 3: Simulation d\'un événement déclencheur...');
    
    const eventResponse = await axios.post(`${STRATEGY_ROUTER_URL}/api/process-event`, testEvent);
    
    if (eventResponse.data.success) {
      console.log('✅ Événement traité avec succès:'.green);
      console.log(`   - Matches trouvés: ${eventResponse.data.matches.length}`);
      console.log(`   - Jobs exécutés: ${eventResponse.data.jobResults.length}`);
      
      // Afficher les détails des exécutions
      eventResponse.data.jobResults.forEach((job, index) => {
        if (job) {
          console.log(`\n📊 Job ${index + 1}:`.cyan);
          console.log(`   - ID: ${job.jobId}`);
          console.log(`   - Statut: ${job.status}`);
          console.log(`   - Exécutions: ${job.executions.length}`);
          
          job.executions.forEach((exec, execIndex) => {
            console.log(`     📋 Exécution ${execIndex + 1}:`.yellow);
            console.log(`       - Type: ${exec.action.type}`);
            console.log(`       - Statut: ${exec.status}`);
            
            if (exec.status === 'error' && exec.error) {
              if (exec.error.includes('Solde USDC insuffisant')) {
                console.log(`       - 🚨 ALERTE SOLDE: ${exec.error}`.red);
                console.log(`       - 💡 Solution: Alimenter le Smart Account avec des USDC`.yellow);
                console.log(`       - 🌐 Faucet Circle: https://faucet.circle.com`.blue);
              } else {
                console.log(`       - ❌ Erreur: ${exec.error}`.red);
              }
            } else if (exec.status === 'completed') {
              console.log(`       - Asset: ${exec.details.fromAsset} → ${exec.details.toAsset}`);
              console.log(`       - Montant: ${exec.details.amount}`);
              console.log(`       - Chaîne: ${exec.details.targetChain}`);
              if (exec.details.txHash) {
                console.log(`       - TX Hash: ${exec.details.txHash}`);
              }
            }
          });
        }
      });
    } else {
      console.log('❌ Échec du traitement de l\'événement:'.red);
      console.log(`   - Message: ${eventResponse.data.message}`);
    }

    // Étape 4: Vérifier l'historique des exécutions
    console.log('\n📚 Étape 4: Vérification de l\'historique...');
    
    const historyResponse = await axios.get(`${CIRCLE_EXECUTOR_URL}/api/executions`);
    
    if (historyResponse.data.executions.length > 0) {
      console.log(`✅ ${historyResponse.data.executions.length} exécution(s) trouvée(s):`.green);
      
      historyResponse.data.executions.slice(-3).forEach((exec, index) => {
        console.log(`   📋 Exécution ${index + 1}:`.cyan);
        console.log(`     - ID: ${exec.id}`);
        console.log(`     - Type: ${exec.action.type}`);
        console.log(`     - Statut: ${exec.status}`);
        console.log(`     - Timestamp: ${exec.timestamp}`);
      });
    } else {
      console.log('⚠️  Aucune exécution trouvée dans l\'historique'.yellow);
    }

    console.log('\n🎉 Test terminé avec succès!'.green);
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Erreur lors du test:'.red);
    console.error(`   - Message: ${error.message}`);
    if (error.response) {
      console.error(`   - Status: ${error.response.status}`);
      console.error(`   - Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Fonction pour afficher l'aide
function showHelp() {
  console.log('\n📖 Aide - Test du bridge gasless CCTP'.cyan);
  console.log('=' .repeat(50));
  console.log('Ce script teste l\'intégration complète du bridge gasless CCTP:');
  console.log('');
  console.log('🔧 Prérequis:');
  console.log('   - Strategy Router API sur le port 3002');
  console.log('   - Circle Executor API sur le port 3003');
  console.log('   - Base de données Supabase configurée');
  console.log('   - Variables d\'environnement configurées');
  console.log('');
  console.log('🚀 Utilisation:');
  console.log('   node scripts/test-gasless-bridge.js');
  console.log('   node scripts/test-gasless-bridge.js --help');
  console.log('');
  console.log('✨ Le script va:');
  console.log('   1. Créer une stratégie de test avec wallet');
  console.log('   2. Vérifier que les APIs sont actives');
  console.log('   3. Simuler un événement déclencheur');
  console.log('   4. Vérifier l\'exécution du bridge gasless');
  console.log('   5. Afficher l\'historique des exécutions');
  console.log('');
}

// Point d'entrée
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  testGaslessBridge().catch(console.error);
} 