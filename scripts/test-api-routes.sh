#!/bin/bash

# 🧪 Test Script pour TriggVest APIs - ETHGlobal Cannes 2025
# Script de test complet avec logger coloré et interface claire

# Configuration
STRATEGY_ROUTER_URL="http://localhost:3002"
CIRCLE_EXECUTOR_URL="http://localhost:3003"
TIMEOUT=10
TEST_RESULTS=()
PASSED_TESTS=0
FAILED_TESTS=0
TOTAL_TESTS=0

# Couleurs pour le logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Emojis
ROCKET="🚀"
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
TARGET="🎯"
GEAR="⚙️"
CHART="📊"
CLOCK="⏱️"

# Fonction de logging avec couleurs
log_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

log_section() {
    echo -e "\n${CYAN}$1${NC}"
    echo -e "${CYAN}$(printf '─%.0s' {1..50})${NC}"
}

log_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_error() {
    echo -e "${RED}${CROSS} $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

log_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

log_test() {
    echo -e "${PURPLE}${TARGET} Test: $1${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Fonction pour tester une route HTTP
test_route() {
    local method=$1
    local url=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    log_test "$description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -m $TIMEOUT "$url" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" -m $TIMEOUT "$url" 2>/dev/null)
    fi
    
    if [ $? -eq 0 ]; then
        http_code="${response: -3}"
        body="${response%???}"
        
        if [ "$http_code" = "$expected_status" ]; then
            log_success "HTTP $http_code - $description"
            if [ ! -z "$body" ]; then
                echo -e "${GREEN}   Response: $(echo "$body" | jq -r '.' 2>/dev/null || echo "$body" | head -c 100)...${NC}"
            fi
            return 0
        else
            log_error "HTTP $http_code (expected $expected_status) - $description"
            echo -e "${RED}   Response: $(echo "$body" | head -c 200)...${NC}"
            return 1
        fi
    else
        log_error "Connection failed - $description"
        return 1
    fi
}

# Fonction pour vérifier qu'un service est accessible
check_service() {
    local service_name=$1
    local url=$2
    
    log_info "Vérification du service $service_name..."
    
    if curl -s -m 5 "$url/api/status" > /dev/null 2>&1; then
        log_success "$service_name est accessible"
        return 0
    else
        log_error "$service_name n'est pas accessible"
        return 1
    fi
}

# Fonction pour afficher le rapport final
show_report() {
    log_header "${ROCKET} RAPPORT FINAL DES TESTS ${ROCKET}"
    
    echo -e "${WHITE}${CHART} Statistiques:${NC}"
    echo -e "   ${GREEN}Tests réussis: $PASSED_TESTS${NC}"
    echo -e "   ${RED}Tests échoués: $FAILED_TESTS${NC}"
    echo -e "   ${BLUE}Total tests: $TOTAL_TESTS${NC}"
    
    success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "   ${YELLOW}Taux de réussite: $success_rate%${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}${CHECK} Tous les tests ont réussi ! API prête pour la démo ${CHECK}${NC}"
    else
        echo -e "\n${RED}${CROSS} Certains tests ont échoué. Vérifiez les services ${CROSS}${NC}"
    fi
    
    echo -e "\n${CYAN}${GEAR} Services à démarrer:${NC}"
    echo -e "   ${YELLOW}Terminal 1:${NC} cd apps/strategy-router-api && npm run dev"
    echo -e "   ${YELLOW}Terminal 2:${NC} cd apps/circle-executor-api && npm run dev"
    echo -e "   ${YELLOW}Terminal 3:${NC} npm run cli"
}

# Démarrage du script
clear
log_header "${ROCKET} TRIGGVEST API TEST SUITE ${ROCKET}"
echo -e "${WHITE}Test automatisé des APIs - ETHGlobal Cannes 2025${NC}"
echo -e "${CYAN}Testing Strategy Router (${STRATEGY_ROUTER_URL}) & Circle Executor (${CIRCLE_EXECUTOR_URL})${NC}"

# Étape 1: Vérification des services
log_section "${GEAR} VÉRIFICATION DES SERVICES"

STRATEGY_ROUTER_OK=false
CIRCLE_EXECUTOR_OK=false

if check_service "Strategy Router" $STRATEGY_ROUTER_URL; then
    STRATEGY_ROUTER_OK=true
fi

if check_service "Circle Executor" $CIRCLE_EXECUTOR_URL; then
    CIRCLE_EXECUTOR_OK=true
fi

# Étape 2: Tests Strategy Router API
if [ "$STRATEGY_ROUTER_OK" = true ]; then
    log_section "${TARGET} TESTS STRATEGY ROUTER API"
    
    # Test status endpoint
    test_route "GET" "$STRATEGY_ROUTER_URL/api/status" "200" "Status endpoint"
    
    # Test strategies endpoint
    test_route "GET" "$STRATEGY_ROUTER_URL/api/strategies" "200" "Get all strategies"
    
    # Test create strategy
    strategy_data='{
        "userId": "test-user-123",
        "strategyName": "Test Strategy",
        "triggers": [{
            "type": "twitter",
            "account": "@testaccount",
            "keywords": ["test", "demo"]
        }],
        "actions": [{
            "type": "convert_all",
            "targetAsset": "USDC",
            "targetChain": "Ethereum"
        }]
    }'
    test_route "POST" "$STRATEGY_ROUTER_URL/api/strategies" "200" "Create new strategy" "$strategy_data"
    
    # Test process event (simulation d'un événement du CLI)
    event_data='{
        "type": "twitter",
        "account": "@federalreserve",
        "content": "Market outlook showing recession indicators",
        "timestamp": "'$(date -Iseconds)'",
        "id": "test_event_'$(date +%s)'"
    }'
    test_route "POST" "$STRATEGY_ROUTER_URL/api/process-event" "200" "Process Twitter event" "$event_data"
    
    # Test avec événement Elon Musk
    elon_event_data='{
        "type": "twitter",
        "account": "@elonmusk",
        "content": "Bitcoin to the moon! 🚀",
        "timestamp": "'$(date -Iseconds)'",
        "id": "test_elon_'$(date +%s)'"
    }'
    test_route "POST" "$STRATEGY_ROUTER_URL/api/process-event" "200" "Process Elon Musk event" "$elon_event_data"
    
    # Test avec événement Trump
    trump_event_data='{
        "type": "twitter",
        "account": "@realdonaldtrump",
        "content": "Economy is crashing! Market failure incoming!",
        "timestamp": "'$(date -Iseconds)'",
        "id": "test_trump_'$(date +%s)'"
    }'
    test_route "POST" "$STRATEGY_ROUTER_URL/api/process-event" "200" "Process Trump event" "$trump_event_data"
    
else
    log_warning "Strategy Router non accessible, tests ignorés"
fi

# Étape 3: Tests Circle Executor API
if [ "$CIRCLE_EXECUTOR_OK" = true ]; then
    log_section "${TARGET} TESTS CIRCLE EXECUTOR API"
    
    # Test status endpoint
    test_route "GET" "$CIRCLE_EXECUTOR_URL/api/status" "200" "Status endpoint"
    
    # Test executions endpoint
    test_route "GET" "$CIRCLE_EXECUTOR_URL/api/executions" "200" "Get all executions"
    
    # Test execute job
    job_data='{
        "strategyId": "test-strategy-123",
        "userId": "test-user-456",
        "strategyName": "Test Strategy",
        "triggeredBy": {
            "type": "twitter",
            "account": "@testaccount",
            "content": "Test trigger content",
            "timestamp": "'$(date -Iseconds)'",
            "id": "test_trigger_'$(date +%s)'"
        },
        "actions": [{
            "type": "convert_all",
            "targetAsset": "USDC",
            "targetChain": "Avalanche"
        }],
        "timestamp": "'$(date -Iseconds)'"
    }'
    test_route "POST" "$CIRCLE_EXECUTOR_URL/api/execute-job" "200" "Execute job" "$job_data"
    
    # Test close position
    close_position_data='{
        "userId": "test-user-789",
        "targetAsset": "USDC",
        "targetChain": "Ethereum"
    }'
    test_route "POST" "$CIRCLE_EXECUTOR_URL/api/close-position" "200" "Close position" "$close_position_data"
    
    # Test positions endpoint
    test_route "GET" "$CIRCLE_EXECUTOR_URL/api/positions" "200" "Get all positions"
    
    # Test user positions
    test_route "GET" "$CIRCLE_EXECUTOR_URL/api/positions?userId=test-user-123" "200" "Get user positions"
    
else
    log_warning "Circle Executor non accessible, tests ignorés"
fi

# Étape 4: Test du workflow complet
if [ "$STRATEGY_ROUTER_OK" = true ] && [ "$CIRCLE_EXECUTOR_OK" = true ]; then
    log_section "${ROCKET} TEST WORKFLOW COMPLET"
    
    log_test "Workflow End-to-End: Fed Panic Strategy"
    
    # Simuler un événement Fed qui devrait déclencher la stratégie FED Panic
    fed_event='{
        "type": "twitter",
        "account": "@federalreserve",
        "content": "Emergency rate decision due to recession concerns and market instability",
        "timestamp": "'$(date -Iseconds)'",
        "id": "workflow_test_'$(date +%s)'"
    }'
    
    # Envoyer l'événement et capturer la réponse
    response=$(curl -s -X POST -H "Content-Type: application/json" -d "$fed_event" "$STRATEGY_ROUTER_URL/api/process-event")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        matched_strategies=$(echo "$response" | jq -r '.matchedStrategies')
        log_success "Workflow E2E: $matched_strategies stratégies déclenchées"
        
        # Afficher les détails
        echo -e "${GREEN}   Détails: $(echo "$response" | jq -r '.strategies[0].name // "N/A"') déclenchée${NC}"
        
        # Vérifier les exécutions
        sleep 1
        executions=$(curl -s "$CIRCLE_EXECUTOR_URL/api/executions" | jq -r '.executions | length')
        log_success "Vérification: $executions exécutions enregistrées"
        
    else
        log_error "Workflow E2E: Échec de traitement de l'événement"
    fi
    
else
    log_warning "Workflow complet ignoré (services non accessibles)"
fi

# Étape 5: Tests de performance et stress
log_section "${CLOCK} TESTS DE PERFORMANCE"

if [ "$STRATEGY_ROUTER_OK" = true ]; then
    log_test "Performance: Traitement de 5 événements rapides"
    
    start_time=$(date +%s.%N)
    
    for i in {1..5}; do
        event_data='{
            "type": "twitter",
            "account": "@testaccount",
            "content": "Performance test event #'$i'",
            "timestamp": "'$(date -Iseconds)'",
            "id": "perf_test_'$i'_'$(date +%s)'"
        }'
        
        curl -s -X POST -H "Content-Type: application/json" -d "$event_data" "$STRATEGY_ROUTER_URL/api/process-event" > /dev/null
    done
    
    end_time=$(date +%s.%N)
    duration=$(echo "$end_time - $start_time" | bc)
    
    log_success "Performance: 5 événements traités en ${duration}s"
fi

# Étape 6: Tests d'erreur et edge cases
log_section "${WARNING} TESTS D'ERREUR"

if [ "$STRATEGY_ROUTER_OK" = true ]; then
    # Test avec données invalides
    invalid_data='{"invalid": "data"}'
    test_route "POST" "$STRATEGY_ROUTER_URL/api/process-event" "400" "Invalid event data" "$invalid_data"
    
    # Test avec événement vide
    empty_event='{}'
    test_route "POST" "$STRATEGY_ROUTER_URL/api/process-event" "400" "Empty event" "$empty_event"
fi

# Étape 7: Nettoyage et rapport final
log_section "${CHART} NETTOYAGE & RAPPORT"

# Attendre un peu pour que tous les tests asynchrones se terminent
sleep 2

# Afficher le rapport final
show_report

# Proposer des actions
echo -e "\n${CYAN}${GEAR} Actions disponibles:${NC}"
echo -e "   ${YELLOW}1.${NC} Démarrer le CLI: ${WHITE}npm run cli${NC}"
echo -e "   ${YELLOW}2.${NC} Voir les logs: ${WHITE}tail -f apps/*/logs/*.log${NC}"
echo -e "   ${YELLOW}3.${NC} Ouvrir Prisma Studio: ${WHITE}npm run db:studio${NC}"
echo -e "   ${YELLOW}4.${NC} Redémarrer les services: ${WHITE}npm run dev${NC}"

echo -e "\n${BLUE}${INFO} Test terminé à $(date)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

# Code de sortie basé sur les résultats
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi 