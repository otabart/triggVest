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

/**
 * =====================================
 * CIRCLE EXECUTOR API - TRIGGVEST
 * =====================================
 * 
 * Cette API est responsable de l'exécution des transactions gasless
 * via Circle CCTP (Cross-Chain Transfer Protocol).
 * 
 * Fonctionnalités principales :
 * - Exécution de bridges gasless entre chaînes
 * - Gestion des Smart Accounts
 * - Traitement des jobs de stratégies
 * - Gestion des positions et clôtures
 * 
 * Port par défaut : 3003
 * 
 * Dépendances :
 * - Circle CCTP pour les bridges
 * - Smart Accounts pour l'exécution gasless
 * - Viem pour les interactions blockchain
 * 
 * =====================================
 */

// Configuration de l'application
const app = express();
const PORT = process.env.PORT || 3003;

// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json());

// =====================================
// CONSTANTES ET CONFIGURATION
// =====================================

// Mapping des noms de chaînes vers les IDs (uniquement Arbitrum et Base pour CCTP)
const CHAIN_NAME_TO_ID: Record<string, SupportedChainId> = {
  'Arbitrum': SupportedChainId.ARB_SEPOLIA,
  'Base': SupportedChainId.BASE_SEPOLIA,
};

// Historique des exécutions (en mémoire pour le développement)
// TODO: Migrer vers une base de données pour la production
const executionHistory: Execution[] = [];

// =====================================
// UTILITAIRES CIRCLE CCTP
// =====================================

/**
 * Récupère l'attestation Circle pour une transaction donnée
 * 
 * @param transactionHash - Hash de la transaction de burn
 * @param sourceChainId - ID de la chaîne source
 * @returns Données d'attestation Circle
 * 
 * @throws Error si l'attestation n'est pas disponible après max retries
 */
async function retrieveAttestation(transactionHash: string, sourceChainId: SupportedChainId): Promise<any> {
  console.log(`🔍 [ATTESTATION] Récupération pour tx: ${transactionHash}`);
  
  const maxRetries = 20;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await axios.get(
        `https://iris-api-sandbox.circle.com/v1/attestations/${transactionHash}`
      );
      
      if (response.data && response.data.attestation) {
        console.log(`✅ [ATTESTATION] Récupérée avec succès après ${retries + 1} tentatives`);
        return response.data;
      }
      
      console.log(`⏳ [ATTESTATION] Pas encore prête, nouvelle tentative... (${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      retries++;
    } catch (error) {
      console.log(`❌ [ATTESTATION] Erreur lors de la récupération: ${error}`);
      retries++;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error(`Impossible de récupérer l'attestation après ${maxRetries} tentatives`);
}

// =====================================
// MOTEUR D'EXÉCUTION GASLESS
// =====================================

/**
 * Exécute un bridge gasless CCTP entre deux chaînes
 * 
 * Ce processus comprend :
 * 1. Création du Smart Account source
 * 2. Vérification du solde USDC
 * 3. Burn USDC sur la chaîne source
 * 4. Récupération de l'attestation Circle
 * 5. Création du Smart Account destination
 * 6. Mint USDC sur la chaîne destination
 * 
 * @param privateKey - Clé privée du propriétaire du Smart Account
 * @param sourceChainId - ID de la chaîne source
 * @param destinationChainId - ID de la chaîne destination
 * @param amount - Montant en USDC à transférer
 * @param userId - ID de l'utilisateur pour les logs
 * @returns Détails de l'exécution
 */
async function executeBridgeGasless(
  privateKey: string,
  sourceChainId: SupportedChainId,
  destinationChainId: SupportedChainId,
  amount: string,
  userId: string
): Promise<ExecutionDetails> {
  console.log(`🌉 [BRIDGE] Début du bridge gasless: ${amount} USDC`);
  console.log(`📍 [BRIDGE] ${sourceChainId} → ${destinationChainId} pour l'utilisateur ${userId}`);
  
  try {
    // =====================================
    // PHASE 1: PRÉPARATION CHAÎNE SOURCE
    // =====================================
    
    console.log(`🔧 [PHASE 1] Création du Smart Account source...`);
    const sourceSmartAccount = await createSmartAccountService(privateKey, sourceChainId);
    console.log(`✅ [PHASE 1] Smart Account source: ${sourceSmartAccount.getSmartAccountAddress()}`);
    
    // =====================================
    // PHASE 2: VÉRIFICATION DU SOLDE
    // =====================================
    
    console.log(`💰 [PHASE 2] Vérification du solde USDC...`);
    const balanceCheck = await sourceSmartAccount.checkSufficientBalance(amount, true);
    console.log(`💰 [PHASE 2] Solde actuel: ${balanceCheck.currentBalance} USDC`);
    
    if (!balanceCheck.sufficient) {
      console.error(`🚨 [PHASE 2] ALERTE: Solde USDC insuffisant!`);
      console.error(`   📍 Smart Account: ${sourceSmartAccount.getSmartAccountAddress()}`);
      console.error(`   💰 Solde actuel: ${balanceCheck.currentBalance} USDC`);
      console.error(`   🎯 Montant requis: ${balanceCheck.requiredAmount} USDC`);
      console.error(`   📈 Montant recommandé: ${balanceCheck.recommendedAmount} USDC (incluant frais gasless)`);
      console.error(`   ⚠️  Manque: ${balanceCheck.shortfall} USDC`);
      console.error(`   💡 Solution: Transférer des USDC vers ce Smart Account`);
      console.error(`   🌐 Faucet Circle: https://faucet.circle.com`);
      
      throw new Error(`❌ Solde USDC insuffisant: ${balanceCheck.currentBalance} USDC disponible, ${balanceCheck.recommendedAmount} USDC requis (incluant frais). Manque ${balanceCheck.shortfall} USDC.`);
    }
    
    console.log(`✅ [PHASE 2] Solde suffisant pour le bridge gasless`);
    console.log(`   🎯 Montant à transférer: ${amount} USDC`);
    console.log(`   💰 Solde restant: ${(parseFloat(balanceCheck.currentBalance) - parseFloat(amount)).toFixed(6)} USDC`);
    
    // =====================================
    // PHASE 3: BURN SUR CHAÎNE SOURCE
    // =====================================
    
    console.log(`🔥 [PHASE 3] Burn USDC sur la chaîne source...`);
    const burnAmount = parseUnits(amount, 6);
    const burnTxHash = await sourceSmartAccount.burnUSDC(
      burnAmount,
      destinationChainId,
      sourceSmartAccount.getSmartAccountAddress(),
      "fast"
    );
    console.log(`🔥 [PHASE 3] Transaction de burn envoyée: ${burnTxHash}`);
    
    // Attendre la confirmation du burn
    const burnReceipt = await sourceSmartAccount.waitForUserOperationReceipt(burnTxHash);
    console.log(`✅ [PHASE 3] Burn confirmé: ${burnReceipt.receipt.transactionHash}`);
    
    // =====================================
    // PHASE 4: RÉCUPÉRATION ATTESTATION
    // =====================================
    
    console.log(`📜 [PHASE 4] Récupération de l'attestation Circle...`);
    const attestation = await retrieveAttestation(burnReceipt.receipt.transactionHash, sourceChainId);
    console.log(`✅ [PHASE 4] Attestation récupérée avec succès`);
    
    // =====================================
    // PHASE 5: PRÉPARATION CHAÎNE DESTINATION
    // =====================================
    
    console.log(`🎯 [PHASE 5] Création du Smart Account destination...`);
    const destSmartAccount = await createSmartAccountService(privateKey, destinationChainId);
    console.log(`✅ [PHASE 5] Smart Account destination: ${destSmartAccount.getSmartAccountAddress()}`);
    
    // =====================================
    // PHASE 6: MINT SUR CHAÎNE DESTINATION
    // =====================================
    
    console.log(`🪙 [PHASE 6] Mint USDC sur la chaîne destination...`);
    const mintTxHash = await destSmartAccount.mintUSDC(attestation);
    console.log(`🪙 [PHASE 6] Transaction de mint envoyée: ${mintTxHash}`);
    
    // Attendre la confirmation du mint
    const mintReceipt = await destSmartAccount.waitForUserOperationReceipt(mintTxHash);
    console.log(`✅ [PHASE 6] Mint confirmé: ${mintReceipt.receipt.transactionHash}`);
    
    // =====================================
    // FINALISATION
    // =====================================
    
    console.log(`🎉 [BRIDGE] Bridge gasless terminé avec succès!`);
    console.log(`📊 [BRIDGE] Résumé:`);
    console.log(`   🌐 Source: ${sourceChainId} → Destination: ${destinationChainId}`);
    console.log(`   💰 Montant: ${amount} USDC`);
    console.log(`   🔥 Burn TX: ${burnReceipt.receipt.transactionHash}`);
    console.log(`   🪙 Mint TX: ${mintReceipt.receipt.transactionHash}`);
    
    return {
      fromAsset: 'USDC',
      toAsset: 'USDC',
      amount: amount,
      targetChain: destinationChainId.toString(),
      txHash: mintReceipt.receipt.transactionHash
    };
    
  } catch (error) {
    console.error(`❌ [BRIDGE] Échec du bridge gasless: ${error}`);
    throw error;
  }
}

// =====================================
// MOTEUR D'EXÉCUTION DES ACTIONS
// =====================================

/**
 * Exécute une action spécifique pour une stratégie
 * 
 * @param action - Action à exécuter
 * @param userId - ID de l'utilisateur
 * @param strategyPrivateKey - Clé privée de la stratégie (optionnelle)
 * @returns Exécution complétée
 */
async function executeAction(action: Action, userId: string, strategyPrivateKey?: string): Promise<Execution> {
  console.log(`🔄 [ACTION] Exécution de l'action: ${action.type} pour l'utilisateur ${userId}`);
  
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
        await executeBridgeGaslessAction(action, userId, strategyPrivateKey, execution);
        break;
        
      case 'close_position':
        await executeClosePositionAction(action, userId, execution);
        break;
        
      case 'convert_all':
        await executeConvertAllAction(action, userId, execution);
        break;
        
      default:
        throw new Error(`Type d'action non supporté: ${action.type}`);
    }
    
    execution.status = 'completed';
    console.log(`✅ [ACTION] Action ${action.type} terminée avec succès`);
    
  } catch (error) {
    execution.status = 'error';
    execution.error = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error(`❌ [ACTION] Échec de l'action ${action.type}: ${execution.error}`);
  }
  
  executionHistory.push(execution);
  return execution;
}

/**
 * Exécute une action de bridge gasless
 */
async function executeBridgeGaslessAction(
  action: Action, 
  userId: string, 
  strategyPrivateKey: string | undefined, 
  execution: Execution
): Promise<void> {
  if (!strategyPrivateKey) {
    throw new Error('Clé privée requise pour le bridge gasless');
  }
  
  const sourceChainId = CHAIN_NAME_TO_ID[action.sourceChain || 'Arbitrum'];
  const destinationChainId = CHAIN_NAME_TO_ID[action.targetChain];
  const amount = action.amount || '10';
  
  if (!sourceChainId || !destinationChainId) {
    throw new Error('Chaîne non supportée');
  }
  
  if (!isGaslessSupported(sourceChainId) || !isGaslessSupported(destinationChainId)) {
    throw new Error('Bridge gasless non supporté sur les chaînes sélectionnées');
  }
  
  // Vérification préliminaire du solde
  const preliminarySmartAccount = await createSmartAccountService(strategyPrivateKey, sourceChainId);
  const preliminaryBalanceCheck = await preliminarySmartAccount.checkSufficientBalance(amount, true);
  
  if (!preliminaryBalanceCheck.sufficient) {
    console.error(`🚨 [BRIDGE] ÉCHEC PRÉ-VÉRIFICATION: Solde insuffisant`);
    console.error(`   📍 Smart Account: ${preliminarySmartAccount.getSmartAccountAddress()}`);
    console.error(`   💰 Solde: ${preliminaryBalanceCheck.currentBalance} USDC`);
    console.error(`   🎯 Requis: ${preliminaryBalanceCheck.recommendedAmount} USDC`);
    console.error(`   ⚠️  Manque: ${preliminaryBalanceCheck.shortfall} USDC`);
    
    throw new Error(`❌ Solde insuffisant: ${preliminaryBalanceCheck.currentBalance} USDC disponible, ${preliminaryBalanceCheck.recommendedAmount} USDC requis. Manque ${preliminaryBalanceCheck.shortfall} USDC.`);
  }
  
  // Exécuter le bridge gasless
  const executionDetails = await executeBridgeGasless(
    strategyPrivateKey,
    sourceChainId,
    destinationChainId,
    amount,
    userId
  );
  
  execution.details = executionDetails;
}

/**
 * Exécute une action de clôture de position
 */
async function executeClosePositionAction(
  action: Action, 
  userId: string, 
  execution: Execution
): Promise<void> {
  console.log(`🔄 [CLOSE_POSITION] Simulation de clôture de position pour ${userId}`);
  
  // Simulation de clôture de position
  execution.details = {
    fromAsset: action.targetAsset,
    toAsset: 'USDC',
    amount: '100',
    targetChain: action.targetChain,
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`
  };
  
  console.log(`✅ [CLOSE_POSITION] Position fermée (simulation)`);
}

/**
 * Exécute une action de conversion totale
 */
async function executeConvertAllAction(
  action: Action, 
  userId: string, 
  execution: Execution
): Promise<void> {
  console.log(`🔄 [CONVERT_ALL] Simulation de conversion totale pour ${userId}`);
  
  // Simulation de conversion
  execution.details = {
    fromAsset: 'USDC',
    toAsset: action.targetAsset,
    amount: '100',
    targetChain: action.targetChain,
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`
  };
  
  console.log(`✅ [CONVERT_ALL] Conversion terminée (simulation)`);
}

// =====================================
// ROUTES API REST
// =====================================

/**
 * POST /api/execute-job
 * 
 * Exécute un job de stratégie avec ses actions associées
 * 
 * @route POST /api/execute-job
 * @param {Job} req.body - Données du job à exécuter
 * @param {string} req.body.strategyId - ID de la stratégie
 * @param {string} req.body.userId - ID de l'utilisateur
 * @param {string} req.body.strategyName - Nom de la stratégie
 * @param {TweetEvent} req.body.triggeredBy - Événement déclencheur
 * @param {Action[]} req.body.actions - Actions à exécuter
 * @param {string} req.body.strategyPrivateKey - Clé privée de la stratégie
 * 
 * @returns {JobResponse} Résultat de l'exécution du job
 * 
 * @example
 * POST /api/execute-job
 * {
 *   "strategyId": "strategy_123",
 *   "userId": "user_456",
 *   "strategyName": "Bridge vers Base",
 *   "triggeredBy": {
 *     "type": "twitter",
 *     "account": "@elonmusk",
 *     "content": "Bitcoin to the moon!",
 *     "timestamp": "2025-01-05T10:00:00Z",
 *     "id": "tweet_789"
 *   },
 *   "actions": [
 *     {
 *       "type": "bridge_gasless",
 *       "targetAsset": "USDC",
 *       "targetChain": "Base",
 *       "amount": "10",
 *       "sourceChain": "Arbitrum"
 *     }
 *   ],
 *   "strategyPrivateKey": "0x..."
 * }
 */
app.post('/api/execute-job', async (req: express.Request<{}, JobResponse, Job>, res: express.Response<JobResponse>) => {
  const { strategyId, userId, strategyName, triggeredBy, actions, strategyPrivateKey } = req.body;
  
  console.log(`📋 [JOB] Nouveau job reçu: ${strategyName} (${userId})`);
  console.log(`🎯 [JOB] Déclenché par: ${triggeredBy.type} - ${triggeredBy.account}`);
  console.log(`📝 [JOB] Contenu: ${triggeredBy.content}`);
  console.log(`🔧 [JOB] ${actions.length} action(s) à exécuter`);
  
  try {
    const executions: Execution[] = [];
    
    // Exécuter chaque action séquentiellement
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      console.log(`🔄 [JOB] Exécution de l'action ${i + 1}/${actions.length}: ${action.type}`);
      
      const execution = await executeAction(action, userId, strategyPrivateKey);
      executions.push(execution);
      
      // Arrêter si une action échoue
      if (execution.status === 'error') {
        console.error(`❌ [JOB] Arrêt du job après l'échec de l'action ${i + 1}`);
        break;
      }
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
    
    console.log(`✅ [JOB] Job terminé: ${executions.length} action(s) exécutée(s) - Status: ${jobStatus}`);
    
    res.json(jobResult);
  } catch (error) {
    console.error('❌ [JOB] Erreur fatale lors de l\'exécution du job:', error);
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

/**
 * POST /api/close-position
 * 
 * Ferme une position manuellement pour un utilisateur
 * 
 * @route POST /api/close-position
 * @param {ClosePositionRequest} req.body - Données de la position à fermer
 * @param {string} req.body.userId - ID de l'utilisateur
 * @param {string} req.body.targetAsset - Asset à fermer
 * @param {string} req.body.targetChain - Chaîne cible
 * 
 * @returns {ClosePositionResponse} Résultat de la fermeture
 * 
 * @example
 * POST /api/close-position
 * {
 *   "userId": "user_123",
 *   "targetAsset": "ETH",
 *   "targetChain": "Base"
 * }
 */
app.post('/api/close-position', async (req: express.Request<{}, ClosePositionResponse, ClosePositionRequest>, res: express.Response<ClosePositionResponse | { error: string; message?: string }>) => {
  const { userId, targetAsset, targetChain } = req.body;
  
  console.log(`🔄 [CLOSE_POSITION] Fermeture manuelle de position pour l'utilisateur ${userId}`);
  console.log(`📍 [CLOSE_POSITION] Asset: ${targetAsset}, Chaîne: ${targetChain}`);
  
  // Validation des paramètres
  if (!userId || !targetAsset || !targetChain) {
    console.error('❌ [CLOSE_POSITION] Paramètres manquants');
    return res.status(400).json({
      error: 'Paramètres manquants',
      message: 'Les champs userId, targetAsset et targetChain sont requis'
    });
  }
  
  try {
    const action: Action = {
      type: 'close_position',
      targetAsset,
      targetChain
    };
    
    const execution = await executeAction(action, userId);
    
    console.log(`✅ [CLOSE_POSITION] Position fermée avec succès`);
    
    res.json({
      success: true,
      execution
    });
  } catch (error) {
    console.error('❌ [CLOSE_POSITION] Erreur lors de la fermeture:', error);
    res.status(500).json({
      error: 'Erreur lors de la fermeture de position',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/executions
 * 
 * Récupère l'historique des exécutions
 * 
 * @route GET /api/executions
 * @param {string} [query.userId] - Filtrer par ID d'utilisateur (optionnel)
 * 
 * @returns {ExecutionsResponse} Liste des exécutions
 * 
 * @example
 * GET /api/executions
 * GET /api/executions?userId=user_123
 */
app.get('/api/executions', (req: express.Request<{}, ExecutionsResponse, {}, { userId?: string }>, res: express.Response<ExecutionsResponse>) => {
  const { userId } = req.query;
  
  console.log(`📊 [EXECUTIONS] Récupération de l'historique des exécutions`);
  if (userId) {
    console.log(`🔍 [EXECUTIONS] Filtrage par utilisateur: ${userId}`);
  }
  
  let filteredHistory = executionHistory;
  if (userId) {
    filteredHistory = executionHistory.filter(exec => exec.userId === userId);
  }
  
  console.log(`📋 [EXECUTIONS] ${filteredHistory.length} exécution(s) trouvée(s)`);
  
  res.json({
    executions: filteredHistory,
    count: filteredHistory.length
  });
});

/**
 * GET /api/status
 * 
 * Récupère le statut de l'API Circle Executor
 * 
 * @route GET /api/status
 * @returns {ApiStatus} Statut de l'API
 * 
 * @example
 * GET /api/status
 * {
 *   "status": "active",
 *   "executionsCount": 42,
 *   "timestamp": "2025-01-05T10:00:00Z"
 * }
 */
app.get('/api/status', (req: express.Request, res: express.Response<ApiStatus>) => {
  console.log(`🔍 [STATUS] Vérification du statut de l'API`);
  
  const status: ApiStatus = {
    status: 'active',
    executionsCount: executionHistory.length,
    timestamp: new Date().toISOString()
  };
  
  console.log(`✅ [STATUS] API active avec ${executionHistory.length} exécution(s)`);
  
  res.json(status);
});

// =====================================
// DÉMARRAGE DU SERVEUR
// =====================================

/**
 * Démarre le serveur Circle Executor API
 * 
 * Le serveur écoute sur le port configuré (par défaut 3003)
 * et affiche les informations de démarrage dans la console.
 */
app.listen(PORT, () => {
  console.log(`🚀 Circle Executor API démarrée sur le port ${PORT}`);
  console.log(`🌐 API REST disponible sur http://localhost:${PORT}/api`);
  console.log(`🔗 Prêt à recevoir des jobs de Strategy Router`);
  console.log(`📋 Routes disponibles:`);
  console.log(`   POST /api/execute-job      - Exécuter un job de stratégie`);
  console.log(`   POST /api/close-position   - Fermer une position manuellement`);
  console.log(`   GET  /api/executions       - Historique des exécutions`);
  console.log(`   GET  /api/status           - Statut de l'API`);
  console.log(`🎯 Fonctionnalités supportées:`);
  console.log(`   ✅ Bridge gasless CCTP (Arbitrum ↔ Base)`);
  console.log(`   ✅ Smart Accounts avec Circle Paymaster`);
  console.log(`   ✅ Fermeture de positions (simulation)`);
  console.log(`   ✅ Conversion d'assets (simulation)`);
  console.log(`💡 Prêt pour l'intégration avec TriggVest!`);
}); 