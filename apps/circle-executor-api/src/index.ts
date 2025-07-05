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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Simulation des exécutions (en attente de l'intégration Circle SDK)
const executionHistory: Execution[] = [];

// Fonction pour simuler l'exécution d'une action
async function simulateAction(action: Action, userId: string): Promise<Execution> {
  console.log(`🔄 Simulation de l'action: ${action.type} pour ${userId}`);
  
  // Simuler un délai d'exécution
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const execution: Execution = {
    id: `exec_${Date.now()}`,
    userId,
    action,
    status: 'completed',
    timestamp: new Date().toISOString(),
    details: {}
  };
  
  switch (action.type) {
    case 'convert_all':
      execution.details = {
        fromAsset: 'ETH',
        toAsset: action.targetAsset,
        amount: '1.5',
        targetChain: action.targetChain,
        txHash: `0x${Math.random().toString(16).substring(2, 18)}...`
      };
      console.log(`✅ Conversion simulée: 1.5 ETH → ${action.targetAsset} sur ${action.targetChain}`);
      break;
      
    case 'close_position':
      execution.details = {
        fromAsset: 'BTC',
        toAsset: action.targetAsset,
        amount: '0.05',
        targetChain: action.targetChain,
        txHash: `0x${Math.random().toString(16).substring(2, 18)}...`
      };
      console.log(`✅ Position fermée: 0.05 BTC → ${action.targetAsset} sur ${action.targetChain}`);
      break;
      
    default:
      execution.status = 'error';
      execution.error = 'Type d\'action non supporté';
      console.log(`❌ Action non supportée: ${action.type}`);
  }
  
  executionHistory.push(execution);
  return execution;
}

// Route pour exécuter un job
app.post('/api/execute-job', async (req: express.Request<{}, JobResponse, Job>, res: express.Response<JobResponse>) => {
  const { strategyId, userId, strategyName, triggeredBy, actions } = req.body;
  
  console.log(`📋 Nouveau job reçu: ${strategyName} (${userId})`);
  console.log(`🎯 Déclenché par: ${triggeredBy.type} - ${triggeredBy.content}`);
  
  try {
    const executions: Execution[] = [];
    
    // Exécuter chaque action
    for (const action of actions) {
      const execution = await simulateAction(action, userId);
      executions.push(execution);
    }
    
    const jobResult: JobResponse = {
      jobId: `job_${Date.now()}`,
      strategyId,
      userId,
      strategyName,
      triggeredBy,
      executions,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Job terminé: ${executions.length} action(s) exécutée(s)`);
    
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
    
    const execution = await simulateAction(action, userId);
    
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