import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  Job, 
  JobResponse, 
  Execution, 
  ExecutionDetails, 
  Action, 
  ClosePositionRequest, 
  ClosePositionResponse, 
  ExecutionsResponse, 
  ApiStatus 
} from './types';
import { 
  SmartAccountService, 
  SupportedChainId, 
  createSmartAccountService,
  isGaslessSupported
} from './lib/smart-account-service';
import { parseUnits } from 'viem';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Simulation des exécutions (en attente de l'intégration Circle SDK)
const executionHistory: Execution[] = [];

// Mapping des noms de chaînes vers les IDs (uniquement Arbitrum et Base pour CCTP)
const CHAIN_NAME_TO_ID: Record<string, SupportedChainId> = {
  'Arbitrum': SupportedChainId.ARB_SEPOLIA,
  'Base': SupportedChainId.BASE_SEPOLIA,
};

// Fonction pour récupérer l'attestation Circle
async function retrieveAttestation(transactionHash: string, sourceChainId: SupportedChainId): Promise<any> {
  console.log(`🔍 Retrieving attestation for tx: ${transactionHash}`);
  
  const maxRetries = 20;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await axios.get(
        `https://iris-api-sandbox.circle.com/v1/attestations/${transactionHash}`
      );
      
      if (response.data && response.data.attestation) {
        console.log(`✅ Attestation retrieved successfully`);
        return response.data;
      }
      
      console.log(`⏳ Attestation not ready, retrying... (${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      retries++;
    } catch (error) {
      console.log(`❌ Error retrieving attestation: ${error}`);
      retries++;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error('Failed to retrieve attestation after maximum retries');
}

// Fonction pour exécuter un bridge gasless CCTP
async function executeBridgeGasless(
  privateKey: string,
  sourceChainId: SupportedChainId,
  destinationChainId: SupportedChainId,
  amount: string,
  userId: string
): Promise<ExecutionDetails> {
  console.log(`🌉 Executing gasless bridge: ${amount} USDC from ${sourceChainId} to ${destinationChainId}`);
  
  try {
    // Étape 1: Créer le Smart Account Service pour la chaîne source
    const sourceSmartAccount = await createSmartAccountService(privateKey, sourceChainId);
    console.log(`✅ Source Smart Account created: ${sourceSmartAccount.getSmartAccountAddress()}`);
    
    // Étape 2: Vérifier le solde USDC avec alertes détaillées
    console.log(`💰 Vérification du solde USDC...`);
    
    const balanceCheck = await sourceSmartAccount.checkSufficientBalance(amount, true);
    console.log(`💰 Smart Account balance: ${balanceCheck.currentBalance} USDC`);
    
    if (!balanceCheck.sufficient) {
      console.error(`🚨 ALERTE: Solde USDC insuffisant!`);
      console.error(`   - Smart Account: ${sourceSmartAccount.getSmartAccountAddress()}`);
      console.error(`   - Solde actuel: ${balanceCheck.currentBalance} USDC`);
      console.error(`   - Montant requis: ${balanceCheck.requiredAmount} USDC`);
      console.error(`   - Montant recommandé: ${balanceCheck.recommendedAmount} USDC (incluant frais gasless)`);
      console.error(`   - Manque: ${balanceCheck.shortfall} USDC`);
      console.error(`   - 💡 Solution: Transférer des USDC vers ce Smart Account`);
      console.error(`   - 🌐 Faucet Circle: https://faucet.circle.com`);
      
      throw new Error(`❌ Solde USDC insuffisant: ${balanceCheck.currentBalance} USDC disponible, ${balanceCheck.recommendedAmount} USDC requis (incluant frais). Manque ${balanceCheck.shortfall} USDC.`);
    }
    
    // Log de confirmation si le solde est suffisant
    console.log(`✅ Solde suffisant pour le bridge gasless`);
    console.log(`   - Montant à transférer: ${amount} USDC`);
    console.log(`   - Solde restant après transaction: ${(parseFloat(balanceCheck.currentBalance) - parseFloat(amount)).toFixed(6)} USDC`);
    
    // Étape 3: Burn USDC sur la chaîne source
    const burnAmount = parseUnits(amount, 6);
    const burnTxHash = await sourceSmartAccount.burnUSDC(
      burnAmount,
      destinationChainId,
      sourceSmartAccount.getSmartAccountAddress(),
      "fast"
    );
    console.log(`🔥 Burn transaction sent: ${burnTxHash}`);
    
    // Étape 4: Attendre la confirmation du burn
    const burnReceipt = await sourceSmartAccount.waitForUserOperationReceipt(burnTxHash);
    console.log(`✅ Burn transaction confirmed: ${burnReceipt.receipt.transactionHash}`);
    
    // Étape 5: Récupérer l'attestation
    const attestation = await retrieveAttestation(burnReceipt.receipt.transactionHash, sourceChainId);
    console.log(`✅ Attestation retrieved`);
    
    // Étape 6: Créer le Smart Account Service pour la chaîne de destination
    const destSmartAccount = await createSmartAccountService(privateKey, destinationChainId);
    console.log(`✅ Destination Smart Account created: ${destSmartAccount.getSmartAccountAddress()}`);
    
    // Étape 7: Mint USDC sur la chaîne de destination
    const mintTxHash = await destSmartAccount.mintUSDC(attestation);
    console.log(`🪙 Mint transaction sent: ${mintTxHash}`);
    
    // Étape 8: Attendre la confirmation du mint
    const mintReceipt = await destSmartAccount.waitForUserOperationReceipt(mintTxHash);
    console.log(`✅ Mint transaction confirmed: ${mintReceipt.receipt.transactionHash}`);
    
    return {
      fromAsset: 'USDC',
      toAsset: 'USDC',
      amount: amount,
      targetChain: destinationChainId.toString(),
      txHash: mintReceipt.receipt.transactionHash
    };
    
  } catch (error) {
    console.error(`❌ Bridge gasless failed: ${error}`);
    throw error;
  }
}

// Fonction pour exécuter une action
async function executeAction(action: Action, userId: string, strategyPrivateKey?: string): Promise<Execution> {
  console.log(`🔄 Exécution de l'action: ${action.type} pour ${userId}`);
  
  const execution: Execution = {
    id: `exec_${Date.now()}`,
    userId,
    action,
    status: 'pending',
    timestamp: new Date().toISOString(),
    details: {}
  };
  
  try {
    switch (action.type) {
      case 'bridge_gasless':
        if (!strategyPrivateKey) {
          throw new Error('Private key required for gasless bridge');
        }
        
        const sourceChainId = CHAIN_NAME_TO_ID[action.sourceChain || 'Arbitrum'];
        const destinationChainId = CHAIN_NAME_TO_ID[action.targetChain];
        const amount = action.amount || '10';
        
        if (!sourceChainId || !destinationChainId) {
          throw new Error('Unsupported chain');
        }
        
        if (!isGaslessSupported(sourceChainId) || !isGaslessSupported(destinationChainId)) {
          throw new Error('Gasless not supported on selected chains');
        }
        
        console.log(`🌉 Initialisation du bridge gasless: ${amount} USDC de ${action.sourceChain} vers ${action.targetChain}`);
        
        // Vérification préliminaire du solde avant d'exécuter
        try {
          const preliminarySmartAccount = await createSmartAccountService(strategyPrivateKey, sourceChainId);
          const preliminaryBalanceCheck = await preliminarySmartAccount.checkSufficientBalance(amount, true);
          
          if (!preliminaryBalanceCheck.sufficient) {
            console.error(`🚨 ÉCHEC PRÉ-VÉRIFICATION: Solde insuffisant`);
            console.error(`   - Smart Account: ${preliminarySmartAccount.getSmartAccountAddress()}`);
            console.error(`   - Solde: ${preliminaryBalanceCheck.currentBalance} USDC`);
            console.error(`   - Requis: ${preliminaryBalanceCheck.recommendedAmount} USDC`);
            console.error(`   - Manque: ${preliminaryBalanceCheck.shortfall} USDC`);
            
            throw new Error(`❌ Solde USDC insuffisant sur ${action.sourceChain}: ${preliminaryBalanceCheck.currentBalance} USDC disponible, ${preliminaryBalanceCheck.recommendedAmount} USDC requis. Manque ${preliminaryBalanceCheck.shortfall} USDC.`);
          }
          
          console.log(`✅ Pré-vérification réussie: ${preliminaryBalanceCheck.currentBalance} USDC disponible`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('Solde USDC insuffisant')) {
            throw error; // Re-lancer l'erreur de solde insuffisant
          }
          console.warn(`⚠️  Impossible de vérifier le solde préliminaire: ${errorMessage}`);
        }
        
        execution.details = await executeBridgeGasless(
          strategyPrivateKey,
          sourceChainId,
          destinationChainId,
          amount,
          userId
        );
        
        execution.status = 'completed';
        console.log(`✅ Bridge gasless terminé: ${amount} USDC → ${action.targetChain}`);
        break;
        
      case 'convert_all':
        // TODO: Implémenter la conversion réelle via DEX/swap
        execution.status = 'error';
        execution.error = 'Action convert_all non encore implémentée - implémentation en cours';
        console.log(`❌ Action convert_all non implémentée: ${action.type}`);
        break;
        
      case 'close_position':
        // TODO: Implémenter la fermeture de position réelle
        execution.status = 'error';
        execution.error = 'Action close_position non encore implémentée - implémentation en cours';
        console.log(`❌ Action close_position non implémentée: ${action.type}`);
        break;
        
      default:
        execution.status = 'error';
        execution.error = 'Type d\'action non supporté';
        console.log(`❌ Action non supportée: ${action.type}`);
    }
  } catch (error) {
    execution.status = 'error';
    execution.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Erreur lors de l'exécution: ${execution.error}`);
  }
  
  executionHistory.push(execution);
  return execution;
}

// Route pour exécuter un job
app.post('/api/execute-job', async (req: express.Request<{}, JobResponse, Job>, res: express.Response<JobResponse>) => {
  const { strategyId, userId, strategyName, triggeredBy, actions, strategyPrivateKey } = req.body;
  
  console.log(`📋 Nouveau job reçu: ${strategyName} (${userId})`);
  console.log(`🎯 Déclenché par: ${triggeredBy.type} - ${triggeredBy.content}`);
  
  try {
    const executions: Execution[] = [];
    
    // Exécuter chaque action
    for (const action of actions) {
      const execution = await executeAction(action, userId, strategyPrivateKey);
      executions.push(execution);
    }
    
    // Déterminer le statut global du job
    const hasErrors = executions.some(exec => exec.status === 'error');
    const jobStatus = hasErrors ? 'error' : 'completed';
    
    const jobResult: JobResponse = {
      jobId: `job_${Date.now()}`,
      strategyId,
      userId,
      strategyName,
      triggeredBy,
      executions,
      status: jobStatus,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Job terminé: ${executions.length} action(s) exécutée(s) - Status: ${jobStatus}`);
    
    res.json(jobResult);
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du job:', error);
    res.status(500).json({
      jobId: `job_${Date.now()}`,
      strategyId,
      userId,
      strategyName,
      triggeredBy,
      executions: [],
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour fermer une position manuellement
app.post('/api/close-position', async (req: express.Request<{}, ClosePositionResponse, ClosePositionRequest>, res: express.Response<ClosePositionResponse | { error: string; message?: string }>) => {
  const { userId, targetAsset, targetChain } = req.body;
  
  if (!userId || !targetAsset || !targetChain) {
    return res.status(400).json({
      error: 'Les champs userId, targetAsset et targetChain sont requis'
    });
  }
  
  try {
    const action: Action = {
      type: 'close_position',
      targetAsset,
      targetChain
    };
    
    const execution = await executeAction(action, userId);
    
    res.json({
      success: true,
      execution
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la fermeture de position',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route pour obtenir l'historique des exécutions
app.get('/api/executions', (req: express.Request<{}, ExecutionsResponse, {}, { userId?: string }>, res: express.Response<ExecutionsResponse>) => {
  const { userId } = req.query;
  
  let filteredHistory = executionHistory;
  if (userId) {
    filteredHistory = executionHistory.filter(exec => exec.userId === userId);
  }
  
  res.json({
    executions: filteredHistory,
    count: filteredHistory.length
  });
});

// Route pour obtenir le statut de l'API
app.get('/api/status', (req: express.Request, res: express.Response<ApiStatus>) => {
  res.json({
    status: 'active',
    executionsCount: executionHistory.length,
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Circle Executor API démarrée sur le port ${PORT}`);
  console.log(`🌐 API REST disponible sur http://localhost:${PORT}/api`);
  console.log(`🔗 Prêt à recevoir des jobs de Strategy Router`);
}); 