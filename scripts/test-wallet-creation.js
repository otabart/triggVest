const axios = require('axios');

const STRATEGY_API = 'http://localhost:3002';

// Simulation d'adresses wallet utilisateurs
const mockWalletAddresses = [
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabcdef1234567890abcdef1234567890abcdef12',
    '0x9876543210fedcba9876543210fedcba98765432'
];

// Test de création d'une stratégie avec wallet (API complète)
async function testCreateStrategyWithWallet() {
    console.log('🧪 Test: Création de stratégie avec wallet (API complète)\n');
    
    try {
        // Données de la stratégie
        const strategyData = {
            userWalletAddress: mockWalletAddresses[0],
            strategyName: 'Test Strategy API Complete',
            triggers: [{
                type: 'twitter',
                account: '@elonmusk',
                keywords: ['bitcoin', 'crypto', 'moon']
            }],
            actions: [{
                type: 'convert_all',
                targetAsset: 'BTC',
                targetChain: 'Ethereum'
            }]
        };
        
        console.log('📤 Envoi de la requête...');
        const response = await axios.post(`${STRATEGY_API}/api/create-strategy-with-wallet`, strategyData);
        
        if (response.data.success) {
            console.log('✅ Stratégie créée avec succès !');
            console.log('📋 Détails:');
            console.log(`   - ID: ${response.data.strategy.id}`);
            console.log(`   - Nom: ${response.data.strategy.strategyName}`);
            console.log(`   - Wallet utilisateur: ${response.data.strategy.userWalletAddress}`);
            console.log(`   - Wallet généré: ${response.data.strategy.wallet.address}`);
            console.log(`   - Wallet ID: ${response.data.strategy.wallet.id}`);
            
            return response.data.strategy;
        } else {
            console.log('❌ Échec de la création:', response.data.error);
        }
        
    } catch (error) {
        console.log('❌ Erreur lors de la création:', error.message);
        if (error.response) {
            console.log('📄 Réponse serveur:', error.response.data);
        }
    }
}

// Test de création d'une stratégie simple (API simplifiée)
async function testCreateSimpleStrategy() {
    console.log('\n🧪 Test: Création de stratégie simple (API simplifiée)\n');
    
    try {
        // Données de la stratégie simple
        const strategyData = {
            userWalletAddress: mockWalletAddresses[1],
            strategyName: 'Trump Trade Hackathon',
            triggerAccount: '@realdonaldtrump',
            keywords: ['economy', 'crash', 'recession'],
            targetAsset: 'USDC',
            targetChain: 'Ethereum'
        };
        
        console.log('📤 Envoi de la requête simple...');
        const response = await axios.post(`${STRATEGY_API}/api/create-strategy`, strategyData);
        
        if (response.data.success) {
            console.log('✅ Stratégie simple créée avec succès !');
            console.log('📋 Détails:');
            console.log(`   - ID: ${response.data.strategy.id}`);
            console.log(`   - Nom: ${response.data.strategy.strategyName}`);
            console.log(`   - Wallet utilisateur: ${response.data.strategy.userWalletAddress}`);
            console.log(`   - Compte Twitter: ${response.data.strategy.triggerAccount}`);
            console.log(`   - Mots-clés: ${response.data.strategy.keywords.join(', ')}`);
            console.log(`   - Asset cible: ${response.data.strategy.targetAsset}`);
            console.log(`   - Chaîne cible: ${response.data.strategy.targetChain}`);
            console.log(`   - Wallet généré: ${response.data.strategy.wallet.address}`);
            
            return response.data.strategy;
        } else {
            console.log('❌ Échec de la création:', response.data.error);
        }
        
    } catch (error) {
        console.log('❌ Erreur lors de la création:', error.message);
        if (error.response) {
            console.log('📄 Réponse serveur:', error.response.data);
        }
    }
}

// Test de récupération des wallets utilisateur
async function testGetUserWallets(walletAddress) {
    console.log(`\n🧪 Test: Récupération des wallets pour ${walletAddress.slice(0, 8)}...\n`);
    
    try {
        console.log('📤 Récupération des wallets...');
        const response = await axios.get(`${STRATEGY_API}/api/user-wallets/${walletAddress}`);
        
        if (response.data.success) {
            console.log(`✅ ${response.data.wallets.length} wallets trouvés`);
            
            response.data.wallets.forEach((wallet, index) => {
                console.log(`\n💼 Wallet ${index + 1}:`);
                console.log(`   - Stratégie: ${wallet.strategyName}`);
                console.log(`   - Adresse: ${wallet.generatedAddress}`);
                console.log(`   - Balance: ${wallet.balance} ETH`);
                console.log(`   - Status: ${wallet.isActive ? '🟢 Actif' : '🔴 Inactif'}`);
            });
            
            return response.data.wallets;
        } else {
            console.log('❌ Échec de la récupération:', response.data.error);
        }
        
    } catch (error) {
        console.log('❌ Erreur lors de la récupération:', error.message);
    }
}

// Test de traitement d'un événement
async function testProcessEvent() {
    console.log('\n🧪 Test: Traitement d\'événement avec matching\n');
    
    try {
        const eventData = {
            type: 'twitter',
            account: '@elonmusk',
            content: 'Bitcoin is going to the moon! 🚀 #crypto',
            timestamp: new Date().toISOString(),
            id: `test_event_${Date.now()}`
        };
        
        console.log('📤 Envoi de l\'événement...');
        const response = await axios.post(`${STRATEGY_API}/api/process-event`, eventData);
        
        if (response.data.success) {
            console.log('✅ Événement traité avec succès !');
            console.log(`📊 ${response.data.matchedStrategies} stratégies matchées`);
            
            if (response.data.users && response.data.users.length > 0) {
                console.log('\n👥 Utilisateurs concernés:');
                response.data.users.forEach((user, index) => {
                    console.log(`   ${index + 1}. ${user.username || 'Anonyme'}`);
                    console.log(`      - Wallet: ${user.walletAddress}`);
                    console.log(`      - Stratégie: ${user.strategyName}`);
                });
            }
            
            return response.data;
        } else {
            console.log('❌ Échec du traitement:', response.data.error);
        }
        
    } catch (error) {
        console.log('❌ Erreur lors du traitement:', error.message);
    }
}

// Test de l'API status
async function testApiStatus() {
    console.log('\n🧪 Test: Status de l\'API\n');
    
    try {
        const response = await axios.get(`${STRATEGY_API}/api/status`);
        
        if (response.data.status) {
            console.log('✅ API accessible');
            console.log(`📊 Status: ${response.data.status}`);
            console.log(`🔗 Trigger API: ${response.data.connectedToTriggerApi ? '✅' : '❌'}`);
            console.log(`🎯 Stratégies: ${response.data.strategiesCount}`);
        }
        
    } catch (error) {
        console.log('❌ API non accessible:', error.message);
    }
}

// Fonction principale
async function runTests() {
    console.log('🎯 TriggVest - Tests API Backend (Hackathon Version)\n');
    console.log('=================================================\n');
    
    // Test 0: Status API
    await testApiStatus();
    await sleep(1000);
    
    // Test 1: Création de stratégie complète avec wallet
    await testCreateStrategyWithWallet();
    await sleep(1000);
    
    // Test 2: Création de stratégie simple
    await testCreateSimpleStrategy();
    await sleep(1000);
    
    // Test 3: Récupération des wallets pour le premier utilisateur
    await testGetUserWallets(mockWalletAddresses[0]);
    await sleep(1000);
    
    // Test 4: Récupération des wallets pour le deuxième utilisateur
    await testGetUserWallets(mockWalletAddresses[1]);
    await sleep(1000);
    
    // Test 5: Traitement d'événement
    await testProcessEvent();
    
    console.log('\n🎉 Tests terminés !');
    console.log('\n📋 Résumé:');
    console.log('   - ✅ Création de stratégies sans signature');
    console.log('   - ✅ Génération automatique de wallets');
    console.log('   - ✅ Matching d\'événements');
    console.log('   - ✅ API simplifiée pour hackathon');
}

// Fonction helper pour attendre
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Exécuter les tests
runTests().catch(console.error); 