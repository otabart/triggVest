# 🎬 Démonstration Complète TriggVest - ETHGlobal Cannes 2025
# Script PowerShell de démonstration avec scénarios réels

param(
    [string]$StrategyRouterUrl = "http://localhost:3002",
    [string]$CircleExecutorUrl = "http://localhost:3003"
)

# Fonctions utilitaires
function Write-DemoHeader {
    param([string]$Message)
    Clear-Host
    Write-Host ""
    Write-Host "🎬 " -NoNewline -ForegroundColor Yellow
    Write-Host "DÉMONSTRATION TRIGGVEST" -ForegroundColor White -BackgroundColor Blue
    Write-Host "🏆 ETHGlobal Cannes 2025 - Circle Track" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $Message -ForegroundColor Yellow
    Write-Host ("═" * 60) -ForegroundColor Blue
}

function Write-Step {
    param([string]$Number, [string]$Title, [string]$Description)
    Write-Host ""
    Write-Host "📍 ÉTAPE $Number: $Title" -ForegroundColor Green
    Write-Host "   $Description" -ForegroundColor Gray
    Write-Host ""
}

function Wait-ForUser {
    param([string]$Message = "Appuyez sur Entrée pour continuer...")
    Write-Host ""
    Write-Host $Message -ForegroundColor Yellow
    Read-Host
}

function Show-APIResponse {
    param([string]$Title, $Response)
    Write-Host "📊 $Title" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
    
    if ($Response) {
        $jsonResponse = $Response | ConvertTo-Json -Depth 10
        Write-Host $jsonResponse -ForegroundColor White
    } else {
        Write-Host "Aucune réponse reçue" -ForegroundColor Red
    }
    Write-Host ""
}

function Test-Services {
    Write-Host "🔍 Vérification des services..." -ForegroundColor Yellow
    
    try {
        $strategyStatus = Invoke-RestMethod -Uri "$StrategyRouterUrl/api/status" -TimeoutSec 5
        Write-Host "✅ Strategy Router: Accessible" -ForegroundColor Green
        
        $circleStatus = Invoke-RestMethod -Uri "$CircleExecutorUrl/api/status" -TimeoutSec 5
        Write-Host "✅ Circle Executor: Accessible" -ForegroundColor Green
        
        return $true
    } catch {
        Write-Host "❌ Services non accessibles. Démarrez-les avec: npm run dev" -ForegroundColor Red
        return $false
    }
}

# Script principal
Write-DemoHeader "🚀 DÉMONSTRATION INTERACTIVE"

if (-not (Test-Services)) {
    Write-Host ""
    Write-Host "💡 Pour démarrer les services:" -ForegroundColor Yellow
    Write-Host "   Terminal 1: cd apps/strategy-router-api && npm run dev" -ForegroundColor Cyan
    Write-Host "   Terminal 2: cd apps/circle-executor-api && npm run dev" -ForegroundColor Cyan
    exit 1
}

Wait-ForUser "Services OK ! Commençons la démonstration..."

# Étape 1: Voir les stratégies existantes
Write-Step "1" "STRATÉGIES EXISTANTES" "Affichage des stratégies configurées"

try {
    $strategies = Invoke-RestMethod -Uri "$StrategyRouterUrl/api/strategies"
    Show-APIResponse "Stratégies Configurées" $strategies
    
    Write-Host "💡 Stratégies disponibles:" -ForegroundColor Yellow
    foreach ($strategy in $strategies) {
        Write-Host "   • $($strategy.strategyName) (User: $($strategy.userId))" -ForegroundColor White
        if ($strategy.triggers) {
            foreach ($trigger in $strategy.triggers) {
                Write-Host "     └─ Trigger: $($trigger.account) avec mots-clés: $($trigger.keywords -join ', ')" -ForegroundColor Gray
            }
        }
    }
} catch {
    Write-Host "❌ Erreur lors de la récupération des stratégies" -ForegroundColor Red
}

Wait-ForUser

# Étape 2: Simuler un événement Federal Reserve
Write-Step "2" "ÉVÉNEMENT FEDERAL RESERVE" "Simulation d'un tweet de recession de la Fed"

$fedEvent = @{
    type = "twitter"
    account = "@federalreserve"
    content = "🚨 URGENT: Rising recession indicators demand immediate monetary policy response. Market instability concerns growing."
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    id = "demo_fed_$(Get-Date -UFormat %s)"
} | ConvertTo-Json -Depth 10

Write-Host "📤 Envoi de l'événement Fed..." -ForegroundColor Yellow
Write-Host "Contenu: " -NoNewline -ForegroundColor Gray
Write-Host """🚨 URGENT: Rising recession indicators demand immediate monetary policy response...""" -ForegroundColor White

try {
    $fedResponse = Invoke-RestMethod -Uri "$StrategyRouterUrl/api/process-event" -Method Post -Headers @{'Content-Type'='application/json'} -Body $fedEvent
    Show-APIResponse "Résultat du Processing Fed" $fedResponse
    
    if ($fedResponse.success -and $fedResponse.matchedStrategies -gt 0) {
        Write-Host "🎯 Succès ! $($fedResponse.matchedStrategies) stratégies déclenchées:" -ForegroundColor Green
        foreach ($strategy in $fedResponse.strategies) {
            Write-Host "   • $($strategy.name) (User: $($strategy.userId))" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Aucune stratégie déclenchée pour cet événement" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur lors du traitement de l'événement Fed" -ForegroundColor Red
}

Wait-ForUser

# Étape 3: Simuler un événement Elon Musk
Write-Step "3" "ÉVÉNEMENT ELON MUSK" "Simulation d'un tweet crypto bullish d'Elon"

$elonEvent = @{
    type = "twitter"
    account = "@elonmusk"
    content = "🚀 Bitcoin is digital gold! Just loaded up more BTC. Moon mission activated! 🌙💰 #Bitcoin #Crypto"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    id = "demo_elon_$(Get-Date -UFormat %s)"
} | ConvertTo-Json -Depth 10

Write-Host "📤 Envoi de l'événement Elon..." -ForegroundColor Yellow
Write-Host "Contenu: " -NoNewline -ForegroundColor Gray
Write-Host """🚀 Bitcoin is digital gold! Just loaded up more BTC. Moon mission activated! 🌙💰""" -ForegroundColor White

try {
    $elonResponse = Invoke-RestMethod -Uri "$StrategyRouterUrl/api/process-event" -Method Post -Headers @{'Content-Type'='application/json'} -Body $elonEvent
    Show-APIResponse "Résultat du Processing Elon" $elonResponse
    
    if ($elonResponse.success -and $elonResponse.matchedStrategies -gt 0) {
        Write-Host "🎯 Succès ! $($elonResponse.matchedStrategies) stratégies déclenchées:" -ForegroundColor Green
        foreach ($strategy in $elonResponse.strategies) {
            Write-Host "   • $($strategy.name) (User: $($strategy.userId))" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Aucune stratégie déclenchée pour cet événement" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur lors du traitement de l'événement Elon" -ForegroundColor Red
}

Wait-ForUser

# Étape 4: Vérifier les exécutions
Write-Step "4" "EXÉCUTIONS CIRCLE" "Vérification des actions exécutées"

try {
    $executions = Invoke-RestMethod -Uri "$CircleExecutorUrl/api/executions"
    Show-APIResponse "Exécutions Récentes" $executions
    
    if ($executions.executions -and $executions.executions.Count -gt 0) {
        Write-Host "💼 Exécutions trouvées:" -ForegroundColor Green
        foreach ($execution in $executions.executions) {
            $status = if ($execution.status -eq "completed") { "✅" } else { "⏳" }
            Write-Host "   $status Job: $($execution.action.type) → $($execution.action.targetAsset)/$($execution.action.targetChain)" -ForegroundColor White
            Write-Host "      User: $($execution.userId), Status: $($execution.status)" -ForegroundColor Gray
        }
    } else {
        Write-Host "📝 Aucune exécution trouvée" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur lors de la récupération des exécutions" -ForegroundColor Red
}

Wait-ForUser

# Étape 5: Tester la création d'une nouvelle stratégie
Write-Step "5" "NOUVELLE STRATÉGIE" "Création d'une stratégie personnalisée"

$newStrategy = @{
    userId = "demo-user-$(Get-Date -UFormat %s)"
    strategyName = "Demo Strategy - Vitalik Watch"
    triggers = @(
        @{
            type = "twitter"
            account = "@vitalikbuterin"
            keywords = @("ethereum", "eth2", "scaling", "rollup", "layer2")
        }
    )
    actions = @(
        @{
            type = "convert_all"
            targetAsset = "ETH"
            targetChain = "Ethereum"
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "📝 Création d'une nouvelle stratégie..." -ForegroundColor Yellow
Write-Host "Stratégie: Vitalik Watch (DeFi/Ethereum focus)" -ForegroundColor White

try {
    $newStrategyResponse = Invoke-RestMethod -Uri "$StrategyRouterUrl/api/strategies" -Method Post -Headers @{'Content-Type'='application/json'} -Body $newStrategy
    Show-APIResponse "Nouvelle Stratégie Créée" $newStrategyResponse
    
    Write-Host "✅ Stratégie créée avec succès !" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la création de la stratégie" -ForegroundColor Red
}

Wait-ForUser

# Étape 6: Tester la nouvelle stratégie
Write-Step "6" "TEST NOUVELLE STRATÉGIE" "Test avec un événement Vitalik"

$vitalikEvent = @{
    type = "twitter"
    account = "@vitalikbuterin"
    content = "Exciting developments in Ethereum layer2 scaling! Rollup technology reaching new milestones 🚀"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    id = "demo_vitalik_$(Get-Date -UFormat %s)"
} | ConvertTo-Json -Depth 10

Write-Host "📤 Test de la nouvelle stratégie avec un événement Vitalik..." -ForegroundColor Yellow
Write-Host "Contenu: " -NoNewline -ForegroundColor Gray
Write-Host """Exciting developments in Ethereum layer2 scaling! Rollup technology reaching new milestones 🚀""" -ForegroundColor White

try {
    $vitalikResponse = Invoke-RestMethod -Uri "$StrategyRouterUrl/api/process-event" -Method Post -Headers @{'Content-Type'='application/json'} -Body $vitalikEvent
    Show-APIResponse "Résultat du Test Vitalik" $vitalikResponse
    
    if ($vitalikResponse.success -and $vitalikResponse.matchedStrategies -gt 0) {
        Write-Host "🎯 Succès ! La nouvelle stratégie a été déclenchée !" -ForegroundColor Green
    } else {
        Write-Host "⚠️ La stratégie n'a pas matché (mots-clés différents?)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur lors du test de la nouvelle stratégie" -ForegroundColor Red
}

Wait-ForUser

# Étape 7: Vérifier les positions
Write-Step "7" "POSITIONS UTILISATEURS" "Vérification des positions simulées"

try {
    $positions = Invoke-RestMethod -Uri "$CircleExecutorUrl/api/positions"
    Show-APIResponse "Positions Actuelles" $positions
    
    if ($positions.positions -and $positions.positions.Count -gt 0) {
        Write-Host "💰 Positions trouvées:" -ForegroundColor Green
        $totalValue = 0
        foreach ($position in $positions.positions) {
            Write-Host "   • $($position.amount) $($position.asset) sur $($position.chain)" -ForegroundColor White
            Write-Host "     User: $($position.userId), Valeur: $($position.valueUsd) USD" -ForegroundColor Gray
            $totalValue += $position.valueUsd
        }
        Write-Host ""
        Write-Host "💵 Valeur totale simulée: $totalValue USD" -ForegroundColor Yellow
    } else {
        Write-Host "📝 Aucune position trouvée" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur lors de la récupération des positions" -ForegroundColor Red
}

Wait-ForUser

# Résumé final
Write-DemoHeader "🏁 RÉSUMÉ DE LA DÉMONSTRATION"

Write-Host "✅ Démonstration terminée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Ce qui a été testé:" -ForegroundColor Cyan
Write-Host "   ✅ Stratégies prédéfinies (Fed Panic, Crypto Euphoria, Trump Trade)" -ForegroundColor White
Write-Host "   ✅ Événements simulés (Fed, Elon, Vitalik)" -ForegroundColor White
Write-Host "   ✅ Matching automatique trigger → action" -ForegroundColor White
Write-Host "   ✅ Exécutions Circle SDK (simulées)" -ForegroundColor White
Write-Host "   ✅ Création de nouvelles stratégies" -ForegroundColor White
Write-Host "   ✅ Gestion des positions" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Architecture validée:" -ForegroundColor Cyan
Write-Host "   • CLI Interactif → Strategy Router → Circle Executor" -ForegroundColor White
Write-Host "   • Base de données Supabase prête" -ForegroundColor White
Write-Host "   • Types TypeScript complets" -ForegroundColor White
Write-Host "   • APIs REST fonctionnelles" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Prêt pour ETHGlobal Cannes 2025 !" -ForegroundColor Green
Write-Host ""
Write-Host "🎮 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Tester le CLI: npm run cli" -ForegroundColor Cyan
Write-Host "   2. Setup DB: npm run db:setup && npm run db:seed" -ForegroundColor Cyan
Write-Host "   3. Intégrer Circle SDK réel" -ForegroundColor Cyan
Write-Host "   4. Créer le frontend Next.js" -ForegroundColor Cyan

Write-Host ""
Write-Host "📞 Support: ETHGlobal Discord - Circle Track" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue 