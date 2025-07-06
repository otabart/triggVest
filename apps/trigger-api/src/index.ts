import inquirer from 'inquirer';
import axios from 'axios';
import chalk from 'chalk';
import { TweetEvent } from './types.js';
import dotenv from 'dotenv';

dotenv.config();

console.log(chalk.blue.bold('🎯 Trigger CLI - TriggVest'));
console.log(chalk.gray('Simulateur d\'événements pour déclencher les stratégies\n'));

// Configuration
const STRATEGY_ROUTER_API = process.env.STRATEGY_ROUTER_API || 'http://localhost:3002';

// Sources disponibles
const SOURCES = [
  { name: '🐦 Twitter', value: 'twitter' }
  // Futur: 📈 Prix, 📰 News, etc.
];

// Comptes Twitter populaires
const TWITTER_ACCOUNTS = [
  { name: '🇺🇸 Donald Trump (@realdonaldtrump)', value: '@realdonaldtrump' },
  { name: '🏦 Federal Reserve (@federalreserve)', value: '@federalreserve' },
  { name: '🚀 Elon Musk (@elonmusk)', value: '@elonmusk' },
  { name: '💰 Coinbase (@coinbase)', value: '@coinbase' },
  { name: '⚡ Vitalik Buterin (@vitalikbuterin)', value: '@vitalikbuterin' },
  { name: '📝 Personnalisé', value: 'custom' }
];

// Contenus prédéfinis par compte
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

// Fonction pour envoyer l'événement à strategy-router
async function sendEventToStrategyRouter(event: TweetEvent): Promise<boolean> {
  try {
    console.log(chalk.yellow('📤 Envoi de l\'événement au Strategy Router...'));
    
    const response = await axios.post(`${STRATEGY_ROUTER_API}/api/process-event`, event);
    
    console.log(chalk.green('✅ Événement envoyé avec succès !'));
    console.log(chalk.gray(`📊 Réponse: ${JSON.stringify(response.data, null, 2)}`));
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Erreur lors de l\'envoi :'));
    if (axios.isAxiosError(error)) {
      console.log(chalk.red(`   ${error.message}`));
      if (error.response?.data) {
        console.log(chalk.red(`   ${JSON.stringify(error.response.data)}`));
      }
    } else {
      console.log(chalk.red(`   ${error}`));
    }
    return false;
  }
}

// Fonction principale du CLI
async function runTriggerCLI(): Promise<void> {
  try {
    // 1. Choisir la source
    const { source } = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: 'Choisissez une source d\'événement :',
        choices: SOURCES
      }
    ]);

    if (source === 'twitter') {
      // 2. Choisir le compte Twitter
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

      // 3. Choisir le contenu
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

      // 4. Confirmation
      console.log(chalk.cyan('\n📋 Résumé de l\'événement :'));
      console.log(chalk.white(`   Source: ${source}`));
      console.log(chalk.white(`   Compte: ${finalAccount}`));
      console.log(chalk.white(`   Contenu: "${finalContent}"`));

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Confirmer l\'envoi de cet événement ?',
          default: true
        }
      ]);

      if (confirm) {
        // 5. Créer et envoyer l'événement
        const tweetEvent: TweetEvent = {
          type: 'twitter',
          account: finalAccount,
          content: finalContent,
          timestamp: new Date().toISOString(),
          id: `tweet_${Date.now()}`
        };

        const success = await sendEventToStrategyRouter(tweetEvent);
        
        if (success) {
          console.log(chalk.green('\n🎉 Événement traité avec succès !'));
          
          // 6. Demander si on veut continuer
          const { continuePrompt } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'continuePrompt',
              message: 'Voulez-vous envoyer un autre événement ?',
              default: true
            }
          ]);

          if (continuePrompt) {
            console.log('\n' + '='.repeat(50) + '\n');
            await runTriggerCLI();
          } else {
            console.log(chalk.blue('\n👋 Au revoir !'));
          }
        } else {
          console.log(chalk.red('\n💥 Échec de l\'envoi. Vérifiez que strategy-router-api est démarré.'));
        }
      } else {
        console.log(chalk.yellow('\n🚫 Événement annulé.'));
        await runTriggerCLI();
      }
    }
  } catch (error) {
    if (error === '') {
      // Ctrl+C pressé
      console.log(chalk.blue('\n\n👋 Au revoir !'));
      process.exit(0);
    } else {
      console.error(chalk.red('❌ Erreur inattendue :'), error);
    }
  }
}

// Point d'entrée
console.log(chalk.gray('🚀 Démarrage du CLI...\n'));

// Vérifier que strategy-router est accessible
axios.get(`${STRATEGY_ROUTER_API}/api/status`)
  .then(() => {
    console.log(chalk.green('✅ Strategy Router détecté\n'));
    runTriggerCLI();
  })
  .catch(() => {
    console.log(chalk.red('❌ Strategy Router non accessible'));
    console.log(chalk.yellow('💡 Assurez-vous que strategy-router-api est démarré sur le port 3002'));
    process.exit(1);
  }); 