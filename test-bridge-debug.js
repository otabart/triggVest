const axios = require('axios');

// Test du bridge gasless avec les données de démonstration
async function testBridgeJob() {
  console.log('🧪 [TEST] Test du job de bridge gasless...');
  
  const testJob = {
    strategyId: "test_strategy_123",
    userId: "test_user_456", 
    strategyName: "Test Bridge Gasless",
    triggeredBy: {
      type: "twitter",
      account: "@elonmusk", 
      content: "Test bridge",
      timestamp: new Date().toISOString(),
      id: "test_tweet_789"
    },
    actions: [
      {
        type: "bridge_gasless",
        targetAsset: "USDC",
        targetChain: "Base",
        amount: "1", // Commencer avec 1 USDC
        sourceChain: "Arbitrum"
      }
    ],
    timestamp: new Date().toISOString(),
    strategyPrivateKey: "cff97659076bb2a8c20b59473afcab82bc5fe401acb491102cca1dcf7e68bade"
  };

  try {
    console.log('📤 [TEST] Envoi du job au Circle Executor...');
    console.log('🔧 [TEST] Action:', testJob.actions[0]);
    
    const response = await axios.post('http://localhost:3003/api/execute-job', testJob, {
      timeout: 30000
    });
    
    console.log('✅ [TEST] Réponse reçue:');
    console.log('   📋 Job ID:', response.data.jobId);
    console.log('   📊 Status:', response.data.status);
    console.log('   🔧 Exécutions:', response.data.executions?.length || 0);
    
    if (response.data.executions && response.data.executions.length > 0) {
      const execution = response.data.executions[0];
      console.log('   📍 Execution Status:', execution.status);
      
      if (execution.status === 'error') {
        console.log('❌ [TEST] ERREUR DÉTECTÉE:');
        console.log('   💬 Message:', execution.error);
      } else if (execution.status === 'completed') {
        console.log('✅ [TEST] Bridge réussi!');
        console.log('   📝 Détails:', execution.details);
      }
    }
    
  } catch (error) {
    console.error('❌ [TEST] Erreur de requête:', error.message);
    
    if (error.response) {
      console.error('   📊 Status HTTP:', error.response.status);
      console.error('   💬 Données:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   🔌 L\'API Circle Executor n\'est pas démarrée sur le port 3003');
    }
  }
}

// Test de vérification du solde Smart Account
async function testSmartAccountBalance() {
  console.log('\n💰 [TEST] Vérification du solde Smart Account...');
  
  try {
    // Utiliser la même clé privée que dans le test
    const privateKey = "cff97659076bb2a8c20b59473afcab82bc5fe401acb491102cca1dcf7e68bade";
    
    // Pour l'instant, simulation (il faudrait implémenter un endpoint dédié)
    console.log('🔑 [TEST] Clé privée utilisée:', privateKey.substring(0, 10) + '...');
    console.log('🏦 [TEST] Smart Account attendu: 0x30FaA798B5d332A733150bCA1556D7BeDA2CeB87');
    console.log('⚠️  [TEST] Vérification manuelle requise sur Arbitrum Sepolia');
    console.log('🌐 [TEST] Explorer: https://sepolia.arbiscan.io/address/0x30FaA798B5d332A733150bCA1556D7BeDA2CeB87');
    
  } catch (error) {
    console.error('❌ [TEST] Erreur lors de la vérification du solde:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 [TEST] Début des tests de débogage du bridge gasless\n');
  
  await testSmartAccountBalance();
  await testBridgeJob();
  
  console.log('\n🏁 [TEST] Tests terminés');
}

runTests().catch(console.error); 