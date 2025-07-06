import inquirer from 'inquirer';
import axios from 'axios';
import chalk from 'chalk';
import { TweetEvent } from './types.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * =====================================
 * TRIGGER CLI - TRIGGVEST
 * =====================================
 * 
 * Interface CLI pour simuler des événements et tester les stratégies
 * 
 * Fonctionnalités principales :
 * - Simulation d'événements Twitter
 * - Comptes prédéfinis avec contenus populaires
 * - Envoi d'événements au Strategy Router
 * - Interface utilisateur interactive
 * 
 * Port par défaut : Aucun (CLI seulement)
 * 
 * Flux :
 * 1. CLI → Strategy Router (/api/process-event)
 * 2. Strategy Router → Circle Executor
 * 3. Circle Executor → Blockchain
 * 
 * =====================================
 */

console.log(chalk.blue.bold('🎯 Trigger CLI - TriggVest'));
console.log(chalk.gray('Simulateur d\'événements pour déclencher les stratégies\n'));

// =====================================
// CONFIGURATION
// =====================================

// URL de l'API Strategy Router
const STRATEGY_ROUTER_API = process.env.STRATEGY_ROUTER_API || 'http://localhost:3002';

// =====================================
// DONNÉES PRÉDÉFINIES
// =====================================

/**
 * Sources d'événements disponibles
 */
const SOURCES = [
  { name: '🐦 Twitter', value: 'twitter' }
  // Futur: 📈 Prix, 📰 News, etc.
];

/**
 * Comptes Twitter populaires avec exemples
 */
const TWITTER_ACCOUNTS = [
  { name: '🇺🇸 Donald Trump (@realdonaldtrump)', value: '@realdonaldtrump' },
  { name: '🏦 Federal Reserve (@federalreserve)', value: '@federalreserve' },
  { name: '🚀 Elon Musk (@elonmusk)', value: '@elonmusk' },
  { name: '💰 Coinbase (@coinbase)', value: '@coinbase' },
  { name: '⚡ Vitalik Buterin (@vitalikbuterin)', value: '@vitalikbuterin' },
  { name: '📝 Personnalisé', value: 'custom' }
];

/**
 * Contenus prédéfinis par compte avec des thèmes variés
 */
const PREDEFINED_CONTENTS: Record<string, string[]> = {
  '@realdonaldtrump': [
    'The economy is in terrible shape, massive recession coming!',
    'Bitcoin to the moon! Great investment!',
    'Market crash imminent, get out now!',
    'America First policies will save the economy'
  ],
  '@federalreserve': [
    'Interest rates rising due to economic instability',
    'Market outlook showing recession indicators',
    'Financial dumping patterns emerging across markets',
    'Emergency monetary policy measures under consideration'
  ],
  '@elonmusk': [
    'Bitcoin to the moon! 🚀',
    'Dogecoin is the future of currency',
    'Tesla stock going parabolic',
    'Mars colonization will boost crypto adoption'
  ],
  '@coinbase': [
    'New DeFi protocols launching this week',
    'Crypto adoption reaching all-time highs',
    'Institutional investors flooding the market',
    'Revolutionary blockchain technology emerging'
  ],
  '@vitalikbuterin': [
    'Ethereum 2.0 staking rewards increasing',
    'Layer 2 solutions scaling exponentially',
    'DeFi ecosystem reaching maturity',
    'Smart contract innovation accelerating'
  ]
};

// =====================================
// FONCTIONS UTILITAIRES
// =====================================

/**
 * Envoie un événement au Strategy Router
 * 
 * @param event - Événement à envoyer
 * @returns true si l'envoi réussit, false sinon
 */
async function sendEventToStrategyRouter(event: TweetEvent): Promise<boolean> {
  try {
    console.log(chalk.yellow('📤 [SEND] Envoi de l\'événement au Strategy Router...'));
    console.log(chalk.gray(`📍 [SEND] URL: ${STRATEGY_ROUTER_API}/api/process-event`));
    
    const response = await axios.post(`${STRATEGY_ROUTER_API}/api/process-event`, event);
    
    console.log(chalk.green('✅ [SEND] Événement envoyé avec succès !'));
    
    // Afficher les résultats détaillés
    const data = response.data;
    console.log(chalk.cyan('\n📊 [RESULTS] Résultats du traitement :'));
    console.log(chalk.white(`   🎯 Stratégies déclenchées: ${data.matchedStrategies || 0}`));
    console.log(chalk.white(`   👥 Utilisateurs impactés: ${data.users?.length || 0}`));
    console.log(chalk.white(`   🔧 Jobs envoyés: ${data.jobResults?.length || 0}`));
    
    // Détails des stratégies déclenchées
    if (data.strategies && data.strategies.length > 0) {
      console.log(chalk.cyan('\n🎯 [STRATEGIES] Stratégies déclenchées :'));
      data.strategies.forEach((strategy: any, index: number) => {
        console.log(chalk.white(`   ${index + 1}. ${strategy.name} (ID: ${strategy.id})`));
        console.log(chalk.gray(`      Wallet: ${strategy.generatedWallet}`));
      });
    }
    
    // Détails des utilisateurs
    if (data.users && data.users.length > 0) {
      console.log(chalk.cyan('\n👥 [USERS] Utilisateurs impactés :'));
      data.users.forEach((user: any, index: number) => {
        console.log(chalk.white(`   ${index + 1}. ${user.username || 'Anonyme'} (${user.userId})`));
        console.log(chalk.gray(`      Wallet: ${user.walletAddress}`));
        console.log(chalk.gray(`      Stratégie: ${user.strategyName}`));
      });
    }
    
    // Résultats des jobs
    if (data.jobResults && data.jobResults.length > 0) {
      console.log(chalk.cyan('\n🔧 [JOBS] Résultats des exécutions :'));
      data.jobResults.forEach((job: any, index: number) => {
        const status = job.status === 'completed' ? '✅' : '❌';
        console.log(chalk.white(`   ${index + 1}. ${status} Job ${job.jobId}`));
        console.log(chalk.gray(`      Statut: ${job.status}`));
        console.log(chalk.gray(`      Actions: ${job.executions?.length || 0}`));
      });
    }
    
    if (data.matchedStrategies === 0) {
      console.log(chalk.yellow('\n⚠️  [RESULTS] Aucune stratégie déclenchée par cet événement'));
      console.log(chalk.gray('💡 [TIP] Vérifiez que des stratégies correspondent à ce compte/contenu'));
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ [SEND] Erreur lors de l\'envoi :'));
    if (axios.isAxiosError(error)) {
      console.log(chalk.red(`   🌐 Erreur réseau: ${error.message}`));
      if (error.response?.status) {
        console.log(chalk.red(`   📊 Code HTTP: ${error.response.status}`));
      }
      if (error.response?.data) {
        console.log(chalk.red(`   📝 Détails: ${JSON.stringify(error.response.data, null, 2)}`));
      }
      
      // Conseils de dépannage
      console.log(chalk.yellow('\n💡 [HELP] Conseils de dépannage :'));
      console.log(chalk.white('   1. Vérifiez que Strategy Router API est démarrée (port 3002)'));
      console.log(chalk.white('   2. Vérifiez la connectivité réseau'));
      console.log(chalk.white('   3. Vérifiez la configuration des variables d\'environnement'));
    } else {
      console.log(chalk.red(`   🔧 Erreur: ${error}`));
    }
    return false;
  }
}

// =====================================
// INTERFACE CLI PRINCIPALE
// =====================================

/**
 * Fonction principale du CLI interactive
 * 
 * Guide l'utilisateur à travers :
 * 1. Sélection de la source d'événement
 * 2. Choix du compte Twitter
 * 3. Sélection du contenu
 * 4. Confirmation et envoi
 * 5. Option de continuer
 */
async function runTriggerCLI(): Promise<void> {
  try {
    console.log(chalk.blue('\n🎯 [CLI] Démarrage du simulateur d\'événements'));
    
    // =====================================
    // ÉTAPE 1: CHOIX DE LA SOURCE
    // =====================================
    
    const { source } = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: 'Choisissez une source d\'événement :',
        choices: SOURCES
      }
    ]);

    if (source === 'twitter') {
      console.log(chalk.blue('\n🐦 [TWITTER] Simulation d\'événement Twitter'));
      
      // =====================================
      // ÉTAPE 2: CHOIX DU COMPTE
      // =====================================
      
      const { account } = await inquirer.prompt([
        {
          type: 'list',
          name: 'account',
          message: 'Choisissez un compte Twitter :',
          choices: TWITTER_ACCOUNTS
        }
      ]);

      let finalAccount = account;
      if (account === 'custom') {
        const { customAccount } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customAccount',
            message: 'Entrez le nom du compte (ex: @username) :',
            validate: (input: string) => {
              if (input.trim().length === 0) return 'Le nom du compte ne peut pas être vide';
              if (!input.startsWith('@')) return 'Le nom du compte doit commencer par @';
              return true;
            }
          }
        ]);
        finalAccount = customAccount;
      }

      // =====================================
      // ÉTAPE 3: CHOIX DU CONTENU
      // =====================================
      
      const predefinedContents = PREDEFINED_CONTENTS[finalAccount] || [];
      const contentChoices = [
        ...predefinedContents.map((content, index) => ({
          name: `📝 ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`,
          value: content
        })),
        { name: '✏️  Contenu personnalisé', value: 'custom' }
      ];

      const { content } = await inquirer.prompt([
        {
          type: 'list',
          name: 'content',
          message: 'Choisissez le contenu du tweet :',
          choices: contentChoices,
          pageSize: 10
        }
      ]);

      let finalContent = content;
      if (content === 'custom') {
        const { customContent } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customContent',
            message: 'Entrez le contenu du tweet :',
            validate: (input: string) => {
              if (input.trim().length === 0) return 'Le contenu ne peut pas être vide';
              if (input.length > 280) return 'Le contenu ne peut pas dépasser 280 caractères';
              return true;
            }
          }
        ]);
        finalContent = customContent;
      }

      // =====================================
      // ÉTAPE 4: CONFIRMATION
      // =====================================
      
      console.log(chalk.cyan('\n📋 [SUMMARY] Résumé de l\'événement :'));
      console.log(chalk.white(`   🐦 Source: ${source}`));
      console.log(chalk.white(`   👤 Compte: ${finalAccount}`));
      console.log(chalk.white(`   📝 Contenu: "${finalContent}"`));

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Confirmer l\'envoi de cet événement ?',
          default: true
        }
      ]);

      if (confirm) {
        // =====================================
        // ÉTAPE 5: CRÉATION ET ENVOI
        // =====================================
        
        console.log(chalk.blue('\n🚀 [SEND] Préparation de l\'événement...'));
        
        const tweetEvent: TweetEvent = {
          type: 'twitter',
          account: finalAccount,
          content: finalContent,
          timestamp: new Date().toISOString(),
          id: `tweet_${Date.now()}`
        };

        console.log(chalk.gray(`📅 [SEND] Timestamp: ${tweetEvent.timestamp}`));
        console.log(chalk.gray(`🆔 [SEND] ID: ${tweetEvent.id}`));

        const success = await sendEventToStrategyRouter(tweetEvent);
        
        if (success) {
          console.log(chalk.green('\n🎉 [SUCCESS] Événement traité avec succès !'));
        } else {
          console.log(chalk.red('\n💥 [ERROR] Échec du traitement de l\'événement'));
        }
        
        // =====================================
        // ÉTAPE 6: CONTINUER OU QUITTER
        // =====================================
        
        const { continuePrompt } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continuePrompt',
            message: 'Voulez-vous simuler un autre événement ?',
            default: true
          }
        ]);

        if (continuePrompt) {
          console.log(chalk.blue('\n🔄 [CLI] Nouveau cycle de simulation\n'));
          await runTriggerCLI(); // Récursion pour continuer
        } else {
          console.log(chalk.green('\n👋 [CLI] Au revoir ! Merci d\'avoir utilisé Trigger CLI'));
          console.log(chalk.gray('💡 [TIP] Relancez avec `npm start` pour une nouvelle session'));
        }
      } else {
        console.log(chalk.yellow('\n❌ [CANCELLED] Envoi annulé par l\'utilisateur'));
        
        const { retry } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'retry',
            message: 'Voulez-vous recommencer ?',
            default: true
          }
        ]);

        if (retry) {
          await runTriggerCLI();
        }
      }
    }

  } catch (error) {
    console.log(chalk.red('\n💥 [CLI] Erreur fatale du CLI :'));
    console.log(chalk.red(`   🔧 ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
    console.log(chalk.yellow('\n💡 [HELP] Redémarrez le CLI pour réessayer'));
  }
}

// =====================================
// POINT D'ENTRÉE
// =====================================

/**
 * Point d'entrée principal du CLI
 * 
 * Démarre l'interface interactive après avoir affiché
 * les informations de configuration.
 */
async function main(): Promise<void> {
  console.log(chalk.cyan('⚙️  [CONFIG] Configuration :'));
  console.log(chalk.white(`   🌐 Strategy Router API: ${STRATEGY_ROUTER_API}`));
  console.log(chalk.white(`   📊 Comptes prédéfinis: ${Object.keys(PREDEFINED_CONTENTS).length}`));
  console.log(chalk.white(`   📝 Contenus disponibles: ${Object.values(PREDEFINED_CONTENTS).flat().length}`));
  
  // Vérifier la connectivité avec Strategy Router
  try {
    console.log(chalk.yellow('\n🔍 [TEST] Test de connectivité avec Strategy Router...'));
    await axios.get(`${STRATEGY_ROUTER_API}/api/status`);
    console.log(chalk.green('✅ [TEST] Strategy Router accessible !'));
  } catch (error) {
    console.log(chalk.red('❌ [TEST] Strategy Router non accessible'));
    console.log(chalk.yellow('⚠️  [WARNING] Assurez-vous que Strategy Router API est démarrée'));
    console.log(chalk.gray('💡 [TIP] Lancez `npm run dev` dans apps/strategy-router-api/'));
  }
  
  console.log(chalk.blue('\n🎬 [START] Démarrage de l\'interface interactive...\n'));
  
  await runTriggerCLI();
}

// Démarrer le CLI
main().catch((error) => {
  console.error(chalk.red('\n💥 [FATAL] Erreur fatale :'), error);
  process.exit(1);
}); 