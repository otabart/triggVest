import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...');
  
  try {
    // Supprimer toutes les exécutions
    console.log('🗑️ Suppression des exécutions...');
    const deletedExecutions = await prisma.execution.deleteMany({});
    console.log(`✅ ${deletedExecutions.count} exécutions supprimées`);
    
    // Supprimer tous les événements
    console.log('🗑️ Suppression des événements...');
    const deletedEvents = await prisma.event.deleteMany({});
    console.log(`✅ ${deletedEvents.count} événements supprimés`);
    
    // Supprimer toutes les actions
    console.log('🗑️ Suppression des actions...');
    const deletedActions = await prisma.action.deleteMany({});
    console.log(`✅ ${deletedActions.count} actions supprimées`);
    
    // Supprimer tous les triggers
    console.log('🗑️ Suppression des triggers...');
    const deletedTriggers = await prisma.trigger.deleteMany({});
    console.log(`✅ ${deletedTriggers.count} triggers supprimés`);
    
    // Supprimer toutes les stratégies
    console.log('🗑️ Suppression des stratégies...');
    const deletedStrategies = await prisma.strategy.deleteMany({});
    console.log(`✅ ${deletedStrategies.count} stratégies supprimées`);
    
    // Supprimer toutes les positions
    console.log('🗑️ Suppression des positions...');
    const deletedPositions = await prisma.position.deleteMany({});
    console.log(`✅ ${deletedPositions.count} positions supprimées`);
    
    // Optionnel : supprimer tous les utilisateurs (décommentez si nécessaire)
    // console.log('🗑️ Suppression des utilisateurs...');
    // const deletedUsers = await prisma.user.deleteMany({});
    // console.log(`✅ ${deletedUsers.count} utilisateurs supprimés`);
    
    console.log('🎉 Base de données nettoyée avec succès !');
    
    // Afficher un résumé
    console.log('\n📊 Résumé du nettoyage :');
    console.log(`- Exécutions supprimées: ${deletedExecutions.count}`);
    console.log(`- Événements supprimés: ${deletedEvents.count}`);
    console.log(`- Actions supprimées: ${deletedActions.count}`);
    console.log(`- Triggers supprimés: ${deletedTriggers.count}`);
    console.log(`- Stratégies supprimées: ${deletedStrategies.count}`);
    console.log(`- Positions supprimées: ${deletedPositions.count}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour nettoyer seulement les stratégies (plus sélectif)
async function cleanStrategiesOnly() {
  console.log('🧹 Nettoyage des stratégies uniquement...');
  
  try {
    // Supprimer dans l'ordre correct pour éviter les contraintes de clé étrangère
    
    // 1. Supprimer toutes les exécutions
    console.log('🗑️ Suppression des exécutions...');
    const deletedExecutions = await prisma.execution.deleteMany({});
    console.log(`✅ ${deletedExecutions.count} exécutions supprimées`);
    
    // 2. Supprimer toutes les actions
    console.log('🗑️ Suppression des actions...');
    const deletedActions = await prisma.action.deleteMany({});
    console.log(`✅ ${deletedActions.count} actions supprimées`);
    
    // 3. Supprimer tous les triggers
    console.log('🗑️ Suppression des triggers...');
    const deletedTriggers = await prisma.trigger.deleteMany({});
    console.log(`✅ ${deletedTriggers.count} triggers supprimés`);
    
    // 4. Supprimer toutes les stratégies
    console.log('🗑️ Suppression des stratégies...');
    const deletedStrategies = await prisma.strategy.deleteMany({});
    console.log(`✅ ${deletedStrategies.count} stratégies supprimées`);
    
    // 5. Supprimer les événements orphelins
    console.log('🗑️ Suppression des événements orphelins...');
    const deletedEvents = await prisma.event.deleteMany({});
    console.log(`✅ ${deletedEvents.count} événements supprimés`);
    
    console.log('🎉 Stratégies nettoyées avec succès !');
    
    // Afficher un résumé
    console.log('\n📊 Résumé du nettoyage :');
    console.log(`- Exécutions supprimées: ${deletedExecutions.count}`);
    console.log(`- Actions supprimées: ${deletedActions.count}`);
    console.log(`- Triggers supprimés: ${deletedTriggers.count}`);
    console.log(`- Stratégies supprimées: ${deletedStrategies.count}`);
    console.log(`- Événements supprimés: ${deletedEvents.count}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des stratégies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour vérifier l'état de la base de données
async function checkDatabaseState() {
  console.log('🔍 Vérification de l\'état de la base de données...');
  
  try {
    const usersCount = await prisma.user.count();
    const strategiesCount = await prisma.strategy.count();
    const triggersCount = await prisma.trigger.count();
    const actionsCount = await prisma.action.count();
    const executionsCount = await prisma.execution.count();
    const eventsCount = await prisma.event.count();
    const positionsCount = await prisma.position.count();
    
    console.log('\n📊 État actuel de la base de données :');
    console.log(`- Utilisateurs: ${usersCount}`);
    console.log(`- Stratégies: ${strategiesCount}`);
    console.log(`- Triggers: ${triggersCount}`);
    console.log(`- Actions: ${actionsCount}`);
    console.log(`- Exécutions: ${executionsCount}`);
    console.log(`- Événements: ${eventsCount}`);
    console.log(`- Positions: ${positionsCount}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Point d'entrée principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    await checkDatabaseState();
  } else if (args.includes('--strategies-only')) {
    await cleanStrategiesOnly();
  } else if (args.includes('--full')) {
    await cleanDatabase();
  } else {
    console.log('🔧 Script de nettoyage de la base de données');
    console.log('');
    console.log('Options disponibles :');
    console.log('  --check            Vérifier l\'état de la base de données');
    console.log('  --strategies-only  Nettoyer uniquement les stratégies');
    console.log('  --full             Nettoyage complet (sauf utilisateurs)');
    console.log('');
    console.log('Exemples :');
    console.log('  npm run clean-db --check');
    console.log('  npm run clean-db --strategies-only');
    console.log('  npm run clean-db --full');
  }
}

main().catch(console.error); 