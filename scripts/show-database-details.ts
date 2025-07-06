import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showDatabaseDetails() {
  console.log('📊 Détails de la base de données TriggVest\n');
  
  try {
    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        walletAddress: true,
        username: true,
        createdAt: true
      }
    });
    
    console.log('👤 Utilisateurs:');
    users.forEach(user => {
      console.log(`  • ID: ${user.id}`);
      console.log(`    Wallet: ${user.walletAddress}`);
      console.log(`    Username: ${user.username || 'N/A'}`);
      console.log(`    Créé: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });
    
    // Récupérer toutes les stratégies avec leurs relations
    const strategies = await prisma.strategy.findMany({
      include: {
        user: {
          select: {
            walletAddress: true,
            username: true
          }
        },
        triggers: true,
        actions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('🎯 Stratégies:');
    strategies.forEach((strategy, index) => {
      console.log(`\n[${index + 1}] ${strategy.strategyName}`);
      console.log(`    • ID: ${strategy.id}`);
      console.log(`    • Utilisateur: ${strategy.user.username || strategy.user.walletAddress}`);
      console.log(`    • Wallet généré: ${strategy.generatedAddress}`);
      console.log(`    • Smart Account: ${strategy.smartAccountAddress || 'Non créé'}`);
      console.log(`    • Balance: ${strategy.balance} Wei`);
      console.log(`    • Statut: ${strategy.isActive ? 'Actif' : 'Inactif'}`);
      console.log(`    • Créé: ${strategy.createdAt.toLocaleString()}`);
      
      // Afficher les triggers
      console.log(`    • Triggers (${strategy.triggers.length}):`);
      strategy.triggers.forEach((trigger, idx) => {
        console.log(`      [${idx + 1}] Type: ${trigger.type}`);
        console.log(`          Account: ${trigger.account || 'N/A'}`);
        console.log(`          Keywords: ${trigger.keywords.join(', ')}`);
      });
      
      // Afficher les actions
      console.log(`    • Actions (${strategy.actions.length}):`);
      strategy.actions.forEach((action, idx) => {
        console.log(`      [${idx + 1}] Type: ${action.type}`);
        const params = action.parameters as any;
        console.log(`          Montant: ${params?.amount || 'N/A'} ${action.targetAsset}`);
        console.log(`          Asset: ${action.targetAsset}`);
        console.log(`          Chain: ${action.targetChain}`);
        console.log(`          Paramètres: ${JSON.stringify(action.parameters, null, 10)}`);
      });
    });
    
    // Récupérer les exécutions s'il y en a
    const executions = await prisma.execution.findMany({
      include: {
        strategy: {
          select: {
            strategyName: true
          }
        },
        action: {
          select: {
            type: true,
            targetAsset: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (executions.length > 0) {
      console.log('\n🚀 Exécutions:');
      executions.forEach((execution, index) => {
        console.log(`\n[${index + 1}] ${execution.strategy.strategyName}`);
        console.log(`    • ID: ${execution.id}`);
        console.log(`    • Action: ${execution.action.type} ${execution.action.targetAsset}`);
        console.log(`    • Statut: ${execution.status}`);
        console.log(`    • Montant: ${execution.amount || 'N/A'}`);
        console.log(`    • TX Hash: ${execution.txHash || 'N/A'}`);
        console.log(`    • Créé: ${execution.createdAt.toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour chercher une stratégie spécifique
async function findStrategyByAmount(amount: string) {
  console.log(`🔍 Recherche de stratégie avec montant: ${amount}\n`);
  
  try {
    const strategies = await prisma.strategy.findMany({
      include: {
        actions: true,
        triggers: true,
        user: {
          select: {
            walletAddress: true,
            username: true
          }
        }
      }
    });
    
    const matchingStrategies = strategies.filter(strategy => 
      strategy.actions.some(action => 
        action.parameters && 
        JSON.stringify(action.parameters).includes(amount)
      )
    );
    
    if (matchingStrategies.length === 0) {
      console.log('❌ Aucune stratégie trouvée avec ce montant');
      return;
    }
    
    console.log(`✅ ${matchingStrategies.length} stratégie(s) trouvée(s):`);
    matchingStrategies.forEach((strategy, index) => {
      console.log(`\n[${index + 1}] ${strategy.strategyName}`);
      console.log(`    • ID: ${strategy.id}`);
      console.log(`    • Utilisateur: ${strategy.user.username || strategy.user.walletAddress}`);
      
      strategy.actions.forEach((action, idx) => {
        console.log(`    • Action ${idx + 1}:`);
        console.log(`      Type: ${action.type}`);
        console.log(`      Asset: ${action.targetAsset}`);
        console.log(`      Chain: ${action.targetChain}`);
        console.log(`      Paramètres: ${JSON.stringify(action.parameters, null, 2)}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Point d'entrée principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--search') && args[args.indexOf('--search') + 1]) {
    const searchAmount = args[args.indexOf('--search') + 1];
    await findStrategyByAmount(searchAmount);
  } else {
    await showDatabaseDetails();
  }
}

main().catch(console.error); 