#!/usr/bin/env node
/**
 * Script de test pour les alertes de solde USDC insuffisant
 * Ce script teste les nouvelles alertes de balance dans triggVest
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const STRATEGY_ROUTER_URL = 'http://localhost:3002';
const CIRCLE_EXECUTOR_URL = 'http://localhost:3003';

// Données de test avec un montant volontairement élevé pour déclencher l'alerte
const testUserInsufficientBalance = {
  walletAddress: '0x742d35Cc6644C30532e6391A35e7c785d0E7a123',
  strategyName: 'Test Balance Insuffisante Strategy',
  triggers: [
    {
      type: 'twitter',
      account: '@testbalance',
      keywords: ['test', 'balance', 'insufficient']
    }
  ],
  actions: [
    {
      type: 'bridge_gasless',
      targetAsset: 'USDC',
      targetChain: 'Base',
      sourceChain: 'Arbitrum',
      amount: '999999' // Montant volontairement élevé pour tester l'alerte
    }
  ]
};

const testEventInsufficientBalance = {
  type: 'twitter',
  account: '@testbalance',
  content: 'Test balance insufficient alert functionality',
  timestamp: new Date().toISOString(),
  id: 'test_insufficient_' + Date.now()
};

console.log('🚨 Test des alertes de solde USDC insuffisant - triggVest'.rainbow);
console.log('=' .repeat(60));

async function testInsufficientBalanceAlerts() {
  try {
    // Étape 1: Créer une stratégie de test avec un montant élevé
    console.log('\n📋 Étape 1: Création de la stratégie avec montant élevé...');
    
    const strategyResponse = await axios.post(`${STRATEGY_ROUTER_URL}/api/create-strategy`, testUserInsufficientBalance);
    
    if (strategyResponse.data.success) {
      console.log('✅ Stratégie créée avec succès:'.green);
      console.log(`   - ID: ${strategyResponse.data.strategy.id}`);
      console.log(`   - Nom: ${strategyResponse.data.strategy.strategyName}`);
      console.log(`   - Wallet généré: ${strategyResponse.data.strategy.generatedAddress}`);
      console.log(`   - Balance: ${strategyResponse.data.strategy.balance} USDC`);
      console.log(`   - Montant à transférer: 999,999 USDC (volontairement élevé)`.yellow);
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
    } catch (error) {
      console.log('❌ Strategy Router indisponible'.red);
      return;
    }

    try {
      const executorStatus = await axios.get(`${CIRCLE_EXECUTOR_URL}/api/status`);
      console.log(`✅ Circle Executor: ${executorStatus.data.status}`.green);
    } catch (error) {
      console.log('❌ Circle Executor indisponible'.red);
      return;
    }

    // Étape 3: Déclencher l'événement qui devrait générer une alerte de solde insuffisant
    console.log('\n🎯 Étape 3: Déclenchement de l\'alerte de solde insuffisant...');
    console.log('⚠️  Ceci devrait générer une erreur de solde insuffisant - c\'est normal!'.yellow);
    
    const eventResponse = await axios.post(`${STRATEGY_ROUTER_URL}/api/process-event`, testEventInsufficientBalance);
    
    if (eventResponse.data.success) {
      console.log('📊 Événement traité:'.blue);
      console.log(`   - Matches trouvés: ${eventResponse.data.matches.length}`);
      console.log(`   - Jobs exécutés: ${eventResponse.data.jobResults.length}`);
      
      // Analyser les résultats pour vérifier les alertes
      let foundInsufficientBalanceAlert = false;
      
      eventResponse.data.jobResults.forEach((job, index) => {
        if (job) {
          console.log(`\n📋 Job ${index + 1}:`.cyan);
          console.log(`   - ID: ${job.jobId}`);
          console.log(`   - Statut global: ${job.status}`);
          
          job.executions.forEach((exec, execIndex) => {
            console.log(`\n     🔍 Exécution ${execIndex + 1}:`.yellow);
            console.log(`       - Type: ${exec.action.type}`);
            console.log(`       - Statut: ${exec.status}`);
            
            if (exec.status === 'error' && exec.error) {
              if (exec.error.includes('Solde USDC insuffisant')) {
                foundInsufficientBalanceAlert = true;
                console.log(`       - 🚨 ALERTE DÉTECTÉE: ${exec.error}`.red);
                console.log(`       - ✅ Test réussi: L'alerte de solde insuffisant fonctionne!`.green);
                
                // Extraire les détails du message d'erreur
                const errorMessage = exec.error;
                console.log(`\n📊 Détails de l'alerte:`.cyan);
                
                if (errorMessage.includes('disponible')) {
                  const availableMatch = errorMessage.match(/(\d+\.?\d*) USDC disponible/);
                  if (availableMatch) {
                    console.log(`       - Solde disponible: ${availableMatch[1]} USDC`);
                  }
                }
                
                if (errorMessage.includes('requis')) {
                  const requiredMatch = errorMessage.match(/(\d+\.?\d*) USDC requis/);
                  if (requiredMatch) {
                    console.log(`       - Montant requis: ${requiredMatch[1]} USDC`);
                  }
                }
                
                if (errorMessage.includes('Manque')) {
                  const shortfallMatch = errorMessage.match(/Manque (\d+\.?\d*) USDC/);
                  if (shortfallMatch) {
                    console.log(`       - Manque: ${shortfallMatch[1]} USDC`);
                  }
                }
                
              } else {
                console.log(`       - ❌ Autre erreur: ${exec.error}`.red);
              }
            } else if (exec.status === 'completed') {
              console.log(`       - ✅ Exécution réussie (inattendu pour ce test)`.green);
            }
          });
        }
      });
      
      // Résultat du test
      if (foundInsufficientBalanceAlert) {
        console.log('\n🎉 SUCCÈS DU TEST:'.green);
        console.log('   ✅ L\'alerte de solde insuffisant a été correctement déclenchée');
        console.log('   ✅ Le message d\'erreur contient les informations détaillées');
        console.log('   ✅ Le système protège contre les transactions impossibles');
      } else {
        console.log('\n❌ ÉCHEC DU TEST:'.red);
        console.log('   ❌ Aucune alerte de solde insuffisant détectée');
        console.log('   ❌ Le système n\'a pas protégé contre la transaction impossible');
      }
      
    } else {
      console.log('❌ Échec du traitement de l\'événement:'.red);
      console.log(`   - Message: ${eventResponse.data.message}`);
    }

    // Étape 4: Vérifier l'historique des tentatives
    console.log('\n📚 Étape 4: Vérification de l\'historique...');
    
    const historyResponse = await axios.get(`${CIRCLE_EXECUTOR_URL}/api/executions`);
    
    if (historyResponse.data.executions.length > 0) {
      console.log(`📊 ${historyResponse.data.executions.length} exécution(s) dans l\'historique:`);
      
      // Chercher les échecs de solde insuffisant dans l'historique
      const insufficientBalanceFailures = historyResponse.data.executions.filter(exec => 
        exec.status === 'error' && exec.error && exec.error.includes('Solde USDC insuffisant')
      );
      
      if (insufficientBalanceFailures.length > 0) {
        console.log(`   ✅ ${insufficientBalanceFailures.length} échec(s) de solde insuffisant enregistré(s)`.green);
        
        insufficientBalanceFailures.slice(-2).forEach((exec, index) => {
          console.log(`     📋 Échec ${index + 1}:`.yellow);
          console.log(`       - ID: ${exec.id}`);
          console.log(`       - Type: ${exec.action.type}`);
          console.log(`       - Timestamp: ${exec.timestamp}`);
          console.log(`       - Erreur: ${exec.error.substring(0, 100)}...`);
        });
      } else {
        console.log(`   ⚠️  Aucun échec de solde insuffisant trouvé dans l'historique`.yellow);
      }
    } else {
      console.log('⚠️  Aucune exécution trouvée dans l\'historique'.yellow);
    }

    console.log('\n🎯 Test des alertes de solde insuffisant terminé!'.green);
    console.log('=' .repeat(60));

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
  console.log('\n📖 Aide - Test des alertes de solde insuffisant'.cyan);
  console.log('=' .repeat(60));
  console.log('Ce script teste spécifiquement les alertes de solde USDC insuffisant:');
  console.log('');
  console.log('🎯 Objectif du test:');
  console.log('   - Vérifier que le système détecte les soldes insuffisants');
  console.log('   - S\'assurer que les messages d\'erreur sont informatifs');
  console.log('   - Confirmer que les transactions impossibles sont bloquées');
  console.log('');
  console.log('🔧 Prérequis:');
  console.log('   - Strategy Router API sur le port 3002');
  console.log('   - Circle Executor API sur le port 3003');
  console.log('   - Base de données Supabase configurée');
  console.log('');
  console.log('🚀 Utilisation:');
  console.log('   node scripts/test-insufficient-balance.js');
  console.log('   node scripts/test-insufficient-balance.js --help');
  console.log('');
  console.log('⚠️  Note:');
  console.log('   Ce test utilise intentionnellement un montant élevé (999,999 USDC)');
  console.log('   pour déclencher l\'alerte de solde insuffisant. C\'est normal!');
  console.log('');
}

// Point d'entrée
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  testInsufficientBalanceAlerts().catch(console.error);
} 