import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Strategy, TweetEvent, Job, JobResponse, ApiStatus } from './types.js';
import { 
  createStrategyWithWallet, 
  getUserStrategies, 
  getActiveStrategies,
  getStrategyWallet 
} from './wallet-manager';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Fonction pour vérifier si un événement match avec un trigger
function matchesTrigger(event: TweetEvent, trigger: any): boolean {
  if (event.type !== trigger.type) return false;
  
  if (trigger.type === 'twitter') {
    // Vérifier si le compte correspond
    if (trigger.account && event.account !== trigger.account) return false;
    
    // Vérifier si au moins un mot-clé est présent
    if (trigger.keywords && trigger.keywords.length > 0) {
      const content = event.content.toLowerCase();
      return trigger.keywords.some((keyword: string) => 
        content.includes(keyword.toLowerCase())
      );
    }
  }
  
  return true;
}

// Fonction pour enregistrer l'événement en base de données
async function saveEvent(event: TweetEvent): Promise<string> {
  try {
    const savedEvent = await prisma.event.create({
      data: {
        type: event.type,
        account: event.account,
        content: event.content,
        metadata: {
          timestamp: event.timestamp,
          id: event.id
        }
      }
    });
    
    console.log('✅ Événement sauvegardé en base:', savedEvent.id);
    return savedEvent.id;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de l\'événement:', error);
    throw error;
  }
}

// Fonction pour enregistrer l'exécution en base de données
async function saveExecution(
  strategy: any, 
  eventId: string, 
  actionId: string,
  jobResult: JobResponse | null
): Promise<string> {
  try {
    const execution = await prisma.execution.create({
      data: {
        userId: strategy.userId,
        strategyId: strategy.id,
        eventId: eventId,
        actionId: actionId,
        status: jobResult ? 'completed' : 'failed',
        txHash: jobResult?.txHash || null,
        errorMessage: jobResult ? null : 'Failed to execute job'
      }
    });
    
    console.log('✅ Exécution sauvegardée en base:', execution.id);
    return execution.id;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de l\'exécution:', error);
    throw error;
  }
}

// Fonction pour envoyer un job à circle-executor-api
async function sendJobToCircleExecutor(strategy: any, event: TweetEvent): Promise<JobResponse | null> {
  // Récupérer la clé privée de la stratégie
  const strategyWallet = await getStrategyWallet(strategy.id);
  const privateKey = strategyWallet.wallet?.privateKey.replace('0x', '');
  
  const job: Job = {
    strategyId: strategy.id,
    userId: strategy.userId,
    strategyName: strategy.strategyName,
    triggeredBy: event,
    actions: strategy.actions,
    timestamp: new Date().toISOString(),
    strategyPrivateKey: privateKey
  };
  
  try {
    const response = await axios.post<JobResponse>('http://localhost:3003/api/execute-job', job);
    console.log('✅ Job envoyé à Circle Executor:', response.data.jobId);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du job:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Fonction pour traiter un événement reçu
async function processEvent(event: TweetEvent): Promise<{ 
  matches: any[]; 
  jobResults: (JobResponse | null)[]; 
  userDetails: any[] 
}> {
  console.log('🔄 Traitement de l\'événement:', event.type, '-', event.account, '-', event.content);
  
  // Sauvegarder l'événement en base de données
  const eventId = await saveEvent(event);
  
  // Récupérer les stratégies actives depuis la base de données
  const strategies = await getActiveStrategies();
  console.log(`📊 ${strategies.length} stratégies actives récupérées depuis la base de données`);
  
  const matchedStrategies: any[] = [];
  const jobResults: (JobResponse | null)[] = [];
  const userDetails: any[] = [];
  
  // Vérifier chaque stratégie
  for (const strategy of strategies) {
    for (const trigger of strategy.triggers) {
      if (matchesTrigger(event, trigger)) {
        matchedStrategies.push(strategy);
        
        // Récupérer les détails de l'utilisateur
        const userInfo = await prisma.user.findUnique({
          where: { id: strategy.userId },
          select: {
            id: true,
            walletAddress: true,
            username: true,
            email: true
          }
        });
        
        if (userInfo) {
          userDetails.push({
            userId: userInfo.id,
            walletAddress: userInfo.walletAddress,
            username: userInfo.username,
            email: userInfo.email,
            strategyId: strategy.id,
            strategyName: strategy.strategyName,
            generatedWallet: strategy.generatedAddress
          });
        }
        
        console.log(`✅ Match trouvé: ${strategy.strategyName} (${strategy.userId})`);
        console.log(`👤 Wallet utilisateur: ${userInfo?.walletAddress}`);
        console.log(`🔐 Wallet généré: ${strategy.generatedAddress}`);
        
        // Envoyer le job à Circle Executor
        const jobResult = await sendJobToCircleExecutor(strategy, event);
        jobResults.push(jobResult);
        
        // Sauvegarder l'exécution en base de données
        const firstAction = strategy.actions[0];
        if (firstAction) {
          // Récupérer l'ID de l'action depuis la base de données
          const actionInDb = await prisma.action.findFirst({
            where: {
              strategyId: strategy.id,
              type: firstAction.type,
              targetAsset: firstAction.targetAsset,
              targetChain: firstAction.targetChain
            }
          });
          
          if (actionInDb) {
            await saveExecution(strategy, eventId, actionInDb.id, jobResult);
          }
        }
        
        break; // Une seule fois par stratégie
      }
    }
  }
  
  if (matchedStrategies.length === 0) {
    console.log('❌ Aucun match trouvé pour cet événement');
  }
  
  return { matches: matchedStrategies, jobResults, userDetails };
}

// Route pour créer une stratégie avec 2 triggers max et wallet intégré
app.post('/api/create-strategy', async (req: express.Request, res: express.Response) => {
  try {
    const { 
      userWalletAddress, 
      strategyName, 
      triggers,
      actions
    } = req.body;
    
    // Validation des champs requis
    if (!userWalletAddress || !strategyName || !triggers || !actions) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis manquants: userWalletAddress, strategyName, triggers, actions'
      });
    }

    // Validation : max 2 triggers
    if (triggers.length > 2) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 2 triggers autorisés par stratégie'
      });
    }
    
    console.log(`📝 Création de stratégie avec ${triggers.length} triggers pour ${userWalletAddress}`);
    
    const result = await createStrategyWithWallet({
      userWalletAddress,
      strategyName,
      triggers,
      actions
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.message
      });
    }
    
    console.log(`✅ Stratégie créée: ${result.strategy?.id} → ${result.strategy?.generatedAddress}`);
    
    res.json({
      success: true,
      strategy: result.strategy,
      message: result.message
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la stratégie:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la stratégie',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route pour lister les stratégies d'un utilisateur
app.get('/api/user-strategies/:walletAddress', async (req: express.Request, res: express.Response) => {
  try {
    const { walletAddress } = req.params;
    
    const strategies = await getUserStrategies(walletAddress);
    
    res.json({
      success: true,
      walletAddress,
      strategies,
      total: strategies.length
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stratégies:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des stratégies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route pour traiter les événements du CLI
app.post('/api/process-event', async (req: express.Request<{}, any, TweetEvent>, res: express.Response) => {
  try {
    const event = req.body;
    
    // Validation basique
    if (!event.type || !event.account || !event.content) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis manquants: type, account, content'
      });
    }
    
    console.log(`📨 Événement reçu du CLI: ${event.account} - "${event.content}"`);
    
    // Traiter l'événement
    const result = await processEvent(event);
    
    // Réponse détaillée avec informations utilisateur
    res.json({
      success: true,
      event,
      matchedStrategies: result.matches.length,
      strategies: result.matches.map(s => ({
        id: s.id,
        name: s.strategyName,
        userId: s.userId,
        generatedWallet: s.generatedAddress
      })),
      users: result.userDetails,
      jobResults: result.jobResults.filter(r => r !== null),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du traitement de l\'événement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de l\'événement',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route pour obtenir le statut de l'API
app.get('/api/status', async (req: express.Request, res: express.Response<ApiStatus>) => {
  try {
    const strategiesCount = await prisma.strategy.count({
      where: { isActive: true }
    });
    
    res.json({
      status: 'active',
      connectedToTriggerApi: true,
      strategiesCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      connectedToTriggerApi: false,
      strategiesCount: 0,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour lister toutes les stratégies actives
app.get('/api/strategies', async (req: express.Request, res: express.Response) => {
  try {
    const strategies = await getActiveStrategies();
    res.json({
      success: true,
      strategies,
      total: strategies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des stratégies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Démarrer le serveur
app.listen(PORT, async () => {
  console.log(`🚀 Strategy Router API démarrée sur le port ${PORT}`);
  console.log(`🌐 API REST disponible sur http://localhost:${PORT}/api`);
  console.log(`📨 Prêt à recevoir des événements du CLI sur /api/process-event`);
  
  // Afficher le nombre de stratégies en base
  try {
    const strategiesCount = await prisma.strategy.count({ where: { isActive: true } });
    console.log(`📊 ${strategiesCount} stratégies actives en base de données`);
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
  }
});

// Gérer la fermeture propre de Prisma
process.on('SIGINT', async () => {
  console.log('\n🔌 Fermeture de la connexion à la base de données...');
  await prisma.$disconnect();
  process.exit(0);
}); 