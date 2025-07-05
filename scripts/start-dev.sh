#!/bin/bash

echo "🚀 Démarrage de TriggVest - Plateforme d'automatisation d'investissement"
echo "============================================================="

# Fonction pour démarrer un service dans un nouveau terminal
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo "🔧 Démarrage de $service_name sur le port $port..."
    
    # Vérifier si le dossier existe
    if [ ! -d "$service_path" ]; then
        echo "❌ Erreur: Le dossier $service_path n'existe pas"
        exit 1
    fi
    
    # Vérifier si package.json existe
    if [ ! -f "$service_path/package.json" ]; then
        echo "❌ Erreur: package.json manquant dans $service_path"
        exit 1
    fi
    
    # Démarrer le service
    (cd "$service_path" && npm install > /dev/null 2>&1 && npm run dev) &
    local pid=$!
    echo "✅ $service_name démarré (PID: $pid)"
    
    # Attendre un peu pour éviter les conflits de ports
    sleep 2
}

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install > /dev/null 2>&1

# Démarrer les services
start_service "Trigger API" "apps/trigger-api" "3001"
start_service "Strategy Router API" "apps/strategy-router-api" "3002"
start_service "Circle Executor API" "apps/circle-executor-api" "3003"

echo ""
echo "✅ Tous les services ont été démarrés !"
echo ""
echo "🔗 URLs des services:"
echo "  - Trigger API:        http://localhost:3001"
echo "  - Strategy Router:    http://localhost:3002"
echo "  - Circle Executor:    http://localhost:3003"
echo ""
echo "🧪 Scripts de test disponibles:"
echo "  - node scripts/test-full-flow.js"
echo "  - node apps/trigger-api/test/websocket-client.js"
echo ""
echo "⏹️  Pour arrêter tous les services: Ctrl+C"

# Attendre que l'utilisateur appuie sur Ctrl+C
trap 'echo ""; echo "🛑 Arrêt des services..."; kill $(jobs -p); exit 0' INT
wait 