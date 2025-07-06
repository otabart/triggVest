// API Handler pour TriggVest - Connexion avec les APIs existantes
// Ce fichier gère les appels vers l'API Strategy Router qui existe déjà

const STRATEGY_ROUTER_API_URL = process.env.NEXT_PUBLIC_STRATEGY_ROUTER_API_URL || 'http://localhost:3002';

export interface CreateStrategyRequest {
  userWalletAddress: string;
  strategyName: string;
  triggers: Array<{
    type: string;
    account?: string;
    keywords?: string[];
  }>;
  actions: Array<{
    type: string;
    targetAsset: string;
    targetChain: string;
  }>;
  smartAccountChain?: string; // Chaîne pour créer le Smart Account (optionnel)
}

export interface CreateStrategyResponse {
  success: boolean;
  message: string;
  strategy?: {
    id: string;
    strategyName: string;
    generatedAddress: string;
    balance: string;
    triggers: any[];
    actions: any[];
    smartAccount?: {
      address: string;
      owner: string;
      chain: string;
      factory: string;
      created: boolean;
      balance: string;
    };
  };
  error?: string;
}

/**
 * Créer une nouvelle stratégie avec wallet intégré et Smart Account
 * 
 * Cette fonction appelle l'API Strategy Router existante qui :
 * - Crée un nouveau wallet avec clé privée chiffrée
 * - Génère un Smart Account Circle si demandé
 * - Sauvegarde tout en base de données
 * - Retourne les informations complètes
 */
export async function createStrategy(data: CreateStrategyRequest): Promise<CreateStrategyResponse> {
  try {
    console.log('🚀 Création de stratégie via API...', data);
    
    const response = await fetch(`${STRATEGY_ROUTER_API_URL}/api/create-strategy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la création de la stratégie');
    }

    console.log('✅ Stratégie créée avec succès:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la stratégie:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Transformer les données du formulaire vers le format API
 */
export function transformFormDataToAPIRequest(formData: {
  name: string;
  description: string;
  triggerType: string;
  triggerSource: string;
  triggerKeywords: string;
  actionType: string;
  tokenSymbol: string;
  amount: string;
  blockchain: string;
}, userWalletAddress: string): CreateStrategyRequest {
  
  // Transformer les mots-clés en tableau
  const keywords = formData.triggerKeywords
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0);

  // Mapper les blockchains du formulaire vers les chaînes supportées
  const chainMapping: { [key: string]: string } = {
    'arbitrum': 'arb-sepolia',
    'base': 'base-sepolia',
    'ethereum': 'eth-sepolia',
    'polygon': 'polygon-amoy',
    'optimism': 'op-sepolia'
  };

  // Créer la requête API
  const apiRequest: CreateStrategyRequest = {
    userWalletAddress,
    strategyName: formData.name,
    triggers: [
      {
        type: formData.triggerType,
        account: formData.triggerSource,
        keywords: keywords
      }
    ],
    actions: [
      {
        type: formData.actionType,
        targetAsset: formData.tokenSymbol.toUpperCase(),
        targetChain: chainMapping[formData.blockchain] || formData.blockchain
      }
    ],
    smartAccountChain: chainMapping[formData.blockchain] // Créer le Smart Account sur la même chaîne
  };

  return apiRequest;
}

/**
 * Récupérer les stratégies d'un utilisateur
 */
export async function getUserStrategies(userWalletAddress: string) {
  try {
    const response = await fetch(`${STRATEGY_ROUTER_API_URL}/api/user-strategies?address=${userWalletAddress}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stratégies:', error);
    return { success: false, strategies: [] };
  }
}

/**
 * Récupérer le statut de l'API Strategy Router
 */
export async function getAPIStatus() {
  try {
    const response = await fetch(`${STRATEGY_ROUTER_API_URL}/api/status`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut API:', error);
    return { success: false, message: 'API non disponible' };
  }
} 