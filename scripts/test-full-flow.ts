import axios, { AxiosResponse } from 'axios';
import WebSocket from 'ws';

console.log('🧪 Test du flux complet TriggVest');
console.log('==================================');

// Configuration
const TRIGGER_API = 'http://localhost:3001';
const STRATEGY_API = 'http://localhost:3002';
const CIRCLE_API = 'http://localhost:3003';

// Interfaces
interface ApiStatus {
  status: 'active' | 'inactive';
  [key: string]: any;
}

interface TweetRequest {
  account: string;
  content: string;
}

interface TweetEvent {
  type: 'twitter';
  account: string;
  content: string;
  timestamp: string;
  id: string;
}

interface TweetResponse {
  success: boolean;
  message: string;
  event: TweetEvent;
}

interface ExecutionDetails {
  fromAsset?: string;
  toAsset?: string;
  amount?: string;
  targetChain?: string;
  txHash?: string;
}

interface Execution {
  id: string;
  userId: string;
  action: {
    type: string;
    targetAsset: string;
    targetChain: string;
  };
  status: string;
  timestamp: string;
  details: ExecutionDetails;
}

interface ExecutionsResponse {
  executions: Execution[];
  count: number;
}

interface ClosePositionRequest {
  userId: string;
  targetAsset: string;
  targetChain: string;
}

interface ClosePositionResponse {
  success: boolean;
  execution: Execution;
}

// Fonction pour attendre
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour vérifier qu'un service est disponible
async function checkService(url: string, name: string): Promise<boolean> {
  try {
    const response: AxiosResponse<ApiStatus> = await axios.get(`${url}/api/status`);
    console.log(`✅ ${name} est disponible`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} n'est pas disponible`);
    return false;
  }
}

// Fonction pour tester l'envoi d'un tweet
async function testTweetSimulation(): Promise<boolean> {
  console.log('\n🐦 Test de simulation de tweet...');
  
  try {
    const tweetRequest: TweetRequest = {
      account: '@federalreserve',
      content: 'Market outlook showing major recession indicators ahead'
    };
    
    const response: AxiosResponse<TweetResponse> = await axios.post(`${TRIGGER_API}/api/simulate-tweet`, tweetRequest);
    
    console.log('✅ Tweet simulé avec succès:', response.data.event.content);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ Erreur lors de la simulation du tweet:', errorMessage);
    return false;
  }
}

// Fonction pour vérifier les exécutions
async function checkExecutions(): Promise<boolean> {
  console.log('\n📋 Vérification des exécutions...');
  
  try {
    // Attendre un peu pour que les jobs soient traités
    await sleep(3000);
    
    const response: AxiosResponse<ExecutionsResponse> = await axios.get(`${CIRCLE_API}/api/executions`);
    console.log(`✅ ${response.data.count} exécution(s) trouvée(s)`);
    
    if (response.data.count > 0) {
      response.data.executions.forEach((exec, index) => {
        console.log(`  ${index + 1}. ${exec.action.type} - ${exec.status} - ${exec.userId}`);
        if (exec.details.txHash) {
          console.log(`     Transaction: ${exec.details.txHash}`);
        }
      });
    }
    
    return response.data.count > 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ Erreur lors de la vérification des exécutions:', errorMessage);
    return false;
  }
}

// Fonction pour tester la fermeture manuelle de position
async function testClosePosition(): Promise<boolean> {
  console.log('\n🔄 Test de fermeture manuelle de position...');
  
  try {
    const closeRequest: ClosePositionRequest = {
      userId: 'user-test',
      targetAsset: 'USDC',
      targetChain: 'Ethereum'
    };
    
    const response: AxiosResponse<ClosePositionResponse> = await axios.post(`${CIRCLE_API}/api/close-position`, closeRequest);
    
    console.log('✅ Position fermée avec succès:', response.data.execution.details);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ Erreur lors de la fermeture de position:', errorMessage);
    return false;
  }
}

// Fonction principale de test
async function runTests(): Promise<void> {
  console.log('🔍 Vérification des services...');
  
  // Vérifier que tous les services sont disponibles
  const servicesStatus = await Promise.all([
    checkService(TRIGGER_API, 'Trigger API'),
    checkService(STRATEGY_API, 'Strategy Router API'),
    checkService(CIRCLE_API, 'Circle Executor API')
  ]);
  
  if (!servicesStatus.every(status => status)) {
    console.log('\n❌ Certains services ne sont pas disponibles. Assurez-vous qu\'ils sont démarrés.');
    process.exit(1);
  }
  
  console.log('\n✅ Tous les services sont disponibles !');
  
  // Attendre un peu pour que les connexions WebSocket se stabilisent
  await sleep(2000);
  
  // Test 1: Simuler un tweet qui devrait déclencher une stratégie
  const tweetTest = await testTweetSimulation();
  if (!tweetTest) {
    console.log('\n❌ Test de tweet échoué');
    process.exit(1);
  }
  
  // Test 2: Vérifier que les exécutions ont été créées
  const executionTest = await checkExecutions();
  if (!executionTest) {
    console.log('\n⚠️  Aucune exécution trouvée - vérifiez que les stratégies matchent');
  }
  
  // Test 3: Tester la fermeture manuelle
  const closeTest = await testClosePosition();
  if (!closeTest) {
    console.log('\n❌ Test de fermeture de position échoué');
  }
  
  console.log('\n🎉 Tests terminés !');
  console.log('================');
  console.log('✅ Simulation de tweet: ' + (tweetTest ? 'OK' : 'ECHEC'));
  console.log('✅ Exécutions automatiques: ' + (executionTest ? 'OK' : 'AUCUNE'));
  console.log('✅ Fermeture manuelle: ' + (closeTest ? 'OK' : 'ECHEC'));
  
  process.exit(0);
}

// Démarrer les tests
runTests().catch(error => {
  console.error('❌ Erreur lors des tests:', error);
  process.exit(1);
}); 