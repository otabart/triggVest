import dotenv from 'dotenv';
import { SupportedChainId, createSmartAccountService } from '../src/lib/smart-account-service';
import { parseUnits } from 'viem';
import axios from 'axios';

// Charger les variables d'environnement
dotenv.config();

// Configuration du test
const TEST_PRIVATE_KEY = process.env.PRIVATE_KEY || 'your_private_key_here';
const TEST_AMOUNT = '10'; // 10 USDC
const SOURCE_CHAIN = SupportedChainId.ARB_SEPOLIA;
const DESTINATION_CHAIN = SupportedChainId.BASE_SEPOLIA;

// Fonction pour récupérer l'attestation Circle
async function retrieveAttestation(transactionHash: string, sourceChainId: SupportedChainId): Promise<any> {
  console.log(`🔍 Récupération de l'attestation pour tx: ${transactionHash}`);
  
  const maxRetries = 20;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await axios.get(
        `https://iris-api-sandbox.circle.com/v1/attestations/${transactionHash}`
      );
      
      if (response.data && response.data.attestation) {
        console.log(`✅ Attestation récupérée avec succès`);
        return response.data;
      }
      
      console.log(`⏳ Attestation pas encore prête, nouvelle tentative... (${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      retries++;
    } catch (error) {
      console.log(`❌ Erreur lors de la récupération de l'attestation: ${error}`);
      retries++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('Impossible de récupérer l\'attestation après le nombre maximum de tentatives');
}

async function testCCTPBridge() {
  console.log('🚀 Démarrage du test de bridge CCTP');
  console.log(`📋 Configuration:`);
  console.log(`   - Source: Arbitrum Sepolia`);
  console.log(`   - Destination: Base Sepolia`);
  console.log(`   - Montant: ${TEST_AMOUNT} USDC`);
  console.log('');

  try {
    // Étape 1: Créer le Smart Account pour Arbitrum
    console.log('🔧 Création du Smart Account source (Arbitrum)...');
    const sourceSmartAccount = await createSmartAccountService(TEST_PRIVATE_KEY, SOURCE_CHAIN);
    console.log(`✅ Smart Account source créé: ${sourceSmartAccount.getSmartAccountAddress()}`);
    
    // Étape 2: Vérifier le solde USDC
    console.log('💰 Vérification du solde USDC...');
    const balance = await sourceSmartAccount.getUSDCBalance();
    console.log(`💰 Solde USDC sur Arbitrum: ${balance} USDC`);
    
    const balanceCheck = await sourceSmartAccount.checkSufficientBalance(TEST_AMOUNT, true);
    if (!balanceCheck.sufficient) {
      console.error(`🚨 Solde USDC insuffisant!`);
      console.error(`   - Solde actuel: ${balanceCheck.currentBalance} USDC`);
      console.error(`   - Requis: ${balanceCheck.recommendedAmount} USDC`);
      console.error(`   - Manque: ${balanceCheck.shortfall} USDC`);
      console.error(`   - 💡 Alimentez votre Smart Account avec des USDC depuis le faucet Circle`);
      console.error(`   - 🌐 Faucet: https://faucet.circle.com`);
      return;
    }
    
    console.log(`✅ Solde suffisant pour le bridge`);
    
    // Étape 3: Approuver et burn USDC sur Arbitrum
    console.log('🔥 Burn USDC sur Arbitrum...');
    const burnAmount = parseUnits(TEST_AMOUNT, 6);
    const burnTxHash = await sourceSmartAccount.burnUSDC(
      burnAmount,
      DESTINATION_CHAIN,
      sourceSmartAccount.getSmartAccountAddress(),
      "fast"
    );
    console.log(`✅ Burn transaction hash: ${burnTxHash}`);
    
    // Étape 4: Attendre la confirmation
    console.log('⏳ Attente de la confirmation du burn...');
    const burnReceipt = await sourceSmartAccount.waitForUserOperationReceipt(burnTxHash);
    console.log(`✅ Burn confirmé: ${burnReceipt.receipt.transactionHash}`);
    
    // Étape 5: Récupérer l'attestation
    console.log('🔍 Récupération de l\'attestation Circle...');
    const attestation = await retrieveAttestation(burnReceipt.receipt.transactionHash, SOURCE_CHAIN);
    console.log(`✅ Attestation récupérée`);
    
    // Étape 6: Créer le Smart Account pour Base
    console.log('🔧 Création du Smart Account destination (Base)...');
    const destSmartAccount = await createSmartAccountService(TEST_PRIVATE_KEY, DESTINATION_CHAIN);
    console.log(`✅ Smart Account destination créé: ${destSmartAccount.getSmartAccountAddress()}`);
    
    // Étape 7: Mint USDC sur Base
    console.log('🪙 Mint USDC sur Base...');
    const mintTxHash = await destSmartAccount.mintUSDC(attestation);
    console.log(`✅ Mint transaction hash: ${mintTxHash}`);
    
    // Étape 8: Attendre la confirmation
    console.log('⏳ Attente de la confirmation du mint...');
    const mintReceipt = await destSmartAccount.waitForUserOperationReceipt(mintTxHash);
    console.log(`✅ Mint confirmé: ${mintReceipt.receipt.transactionHash}`);
    
    // Étape 9: Vérifier le solde final
    console.log('💰 Vérification du solde final...');
    const finalBalance = await destSmartAccount.getUSDCBalance();
    console.log(`💰 Nouveau solde USDC sur Base: ${finalBalance} USDC`);
    
    console.log('');
    console.log('🎉 Bridge CCTP terminé avec succès!');
    console.log(`📋 Résumé:`);
    console.log(`   - ${TEST_AMOUNT} USDC transférés d'Arbitrum vers Base`);
    console.log(`   - Burn TX: ${burnReceipt.receipt.transactionHash}`);
    console.log(`   - Mint TX: ${mintReceipt.receipt.transactionHash}`);
    console.log(`   - Smart Account: ${destSmartAccount.getSmartAccountAddress()}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test de bridge:', error);
  }
}

// Fonction pour vérifier les soldes sans faire de bridge
async function checkBalances() {
  console.log('🔍 Vérification des soldes...');
  
  try {
    // Arbitrum
    const arbSmartAccount = await createSmartAccountService(TEST_PRIVATE_KEY, SOURCE_CHAIN);
    const arbBalance = await arbSmartAccount.getUSDCBalance();
    console.log(`💰 Solde Arbitrum: ${arbBalance} USDC`);
    console.log(`   - Smart Account: ${arbSmartAccount.getSmartAccountAddress()}`);
    
    // Base
    const baseSmartAccount = await createSmartAccountService(TEST_PRIVATE_KEY, DESTINATION_CHAIN);
    const baseBalance = await baseSmartAccount.getUSDCBalance();
    console.log(`💰 Solde Base: ${baseBalance} USDC`);
    console.log(`   - Smart Account: ${baseSmartAccount.getSmartAccountAddress()}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des soldes:', error);
  }
}

// Point d'entrée
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check-balances')) {
    await checkBalances();
  } else if (args.includes('--bridge')) {
    await testCCTPBridge();
  } else {
    console.log('🔧 Script de test du bridge CCTP');
    console.log('');
    console.log('Usage:');
    console.log('  npm run test:cctp --check-balances  # Vérifier les soldes');
    console.log('  npm run test:cctp --bridge          # Effectuer un bridge');
    console.log('');
    console.log('⚠️  Assurez-vous d\'avoir configuré PRIVATE_KEY dans .env');
    console.log('💡 Alimentez votre Smart Account avec des USDC depuis https://faucet.circle.com');
  }
}

main().catch(console.error); 