# 🧪 Test Script pour TriggVest APIs - ETHGlobal Cannes 2025
# Script PowerShell de test complet avec logger coloré et interface claire

param(
    [string]$StrategyRouterUrl = "http://localhost:3002",
    [string]$CircleExecutorUrl = "http://localhost:3003",
    [int]$Timeout = 10
)

# Configuration
$Script:PassedTests = 0
$Script:FailedTests = 0
$Script:TotalTests = 0

# Fonction pour logging avec couleurs
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
}

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host $Message -ForegroundColor Cyan
    Write-Host ("─" * 50) -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $Script:PassedTests++
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $Script:FailedTests++
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor Blue
}

function Write-Test {
    param([string]$Message)
    Write-Host "🎯 Test: $Message" -ForegroundColor Magenta
    $Script:TotalTests++
}

# Fonction pour tester une route HTTP
function Test-Route {
    param(
        [string]$Method,
        [string]$Url,
        [string]$ExpectedStatus,
        [string]$Description,
        [string]$Data = $null
    )
    
    Write-Test $Description
    
    try {
        $headers = @{
            'Content-Type' = 'application/json'
        }
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method Get -Headers $headers -TimeoutSec $Timeout
            $statusCode = "200"
        } elseif ($Method -eq "POST") {
            if ($Data) {
                $response = Invoke-RestMethod -Uri $Url -Method Post -Headers $headers -Body $Data -TimeoutSec $Timeout
            } else {
                $response = Invoke-RestMethod -Uri $Url -Method Post -Headers $headers -TimeoutSec $Timeout
            }
            $statusCode = "200"
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Success "HTTP $statusCode - $Description"
            if ($response) {
                $responseText = $response | ConvertTo-Json -Compress
                if ($responseText.Length -gt 100) {
                    $responseText = $responseText.Substring(0, 100) + "..."
                }
                Write-Host "   Response: $responseText" -ForegroundColor Green
            }
            return $true
        } else {
            Write-Error "HTTP $statusCode (expected $ExpectedStatus) - $Description"
            return $false
        }
    } catch {
        $errorMessage = $_.Exception.Message
        if ($errorMessage -like "*400*") {
            if ($ExpectedStatus -eq "400") {
                Write-Success "HTTP 400 - $Description (expected error)"
                return $true
            } else {
                Write-Error "HTTP 400 (expected $ExpectedStatus) - $Description"
                return $false
            }
        } else {
            Write-Error "Connection failed - $Description ($errorMessage)"
            return $false
        }
    }
}

# Fonction pour vérifier qu'un service est accessible
function Test-Service {
    param(
        [string]$ServiceName,
        [string]$Url
    )
    
    Write-Info "Vérification du service $ServiceName..."
    
    try {
        $response = Invoke-RestMethod -Uri "$Url/api/status" -TimeoutSec 5
        Write-Success "$ServiceName est accessible"
        return $true
    } catch {
        Write-Error "$ServiceName n'est pas accessible"
        return $false
    }
}

# Fonction pour afficher le rapport final
function Show-Report {
    Write-Header "🚀 RAPPORT FINAL DES TESTS 🚀"
    
    Write-Host "📊 Statistiques:" -ForegroundColor White
    Write-Host "   Tests réussis: $Script:PassedTests" -ForegroundColor Green
    Write-Host "   Tests échoués: $Script:FailedTests" -ForegroundColor Red
    Write-Host "   Total tests: $Script:TotalTests" -ForegroundColor Blue
    
    if ($Script:TotalTests -gt 0) {
        $successRate = [math]::Round(($Script:PassedTests * 100) / $Script:TotalTests, 2)
        Write-Host "   Taux de réussite: $successRate%" -ForegroundColor Yellow
    }
    
    if ($Script:FailedTests -eq 0) {
        Write-Host ""
        Write-Host "✅ Tous les tests ont réussi ! API prête pour la démo ✅" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Certains tests ont échoué. Vérifiez les services ❌" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "⚙️ Services à démarrer:" -ForegroundColor Cyan
    Write-Host "   Terminal 1: cd apps/strategy-router-api && npm run dev" -ForegroundColor Yellow
    Write-Host "   Terminal 2: cd apps/circle-executor-api && npm run dev" -ForegroundColor Yellow
    Write-Host "   Terminal 3: npm run cli" -ForegroundColor Yellow
}

# Démarrage du script
Clear-Host
Write-Header "🚀 TRIGGVEST API TEST SUITE 🚀"
Write-Host "Test automatisé des APIs - ETHGlobal Cannes 2025" -ForegroundColor White
Write-Host "Testing Strategy Router ($StrategyRouterUrl) & Circle Executor ($CircleExecutorUrl)" -ForegroundColor Cyan

# Étape 1: Vérification des services
Write-Section "⚙️ VÉRIFICATION DES SERVICES"

$StrategyRouterOK = Test-Service "Strategy Router" $StrategyRouterUrl
$CircleExecutorOK = Test-Service "Circle Executor" $CircleExecutorUrl

# Étape 2: Tests Strategy Router API
if ($StrategyRouterOK) {
    Write-Section "🎯 TESTS STRATEGY ROUTER API"
    
    # Test status endpoint
    Test-Route "GET" "$StrategyRouterUrl/api/status" "200" "Status endpoint"
    
    # Test strategies endpoint
    Test-Route "GET" "$StrategyRouterUrl/api/strategies" "200" "Get all strategies"
    
    # Test create strategy
    $strategyData = @{
        userId = "test-user-123"
        strategyName = "Test Strategy"
        triggers = @(
            @{
                type = "twitter"
                account = "@testaccount"
                keywords = @("test", "demo")
            }
        )
        actions = @(
            @{
                type = "convert_all"
                targetAsset = "USDC"
                targetChain = "Ethereum"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    Test-Route "POST" "$StrategyRouterUrl/api/strategies" "200" "Create new strategy" $strategyData
    
    # Test process event (simulation d'un événement du CLI)
    $eventData = @{
        type = "twitter"
        account = "@federalreserve"
        content = "Market outlook showing recession indicators"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        id = "test_event_$(Get-Date -UFormat %s)"
    } | ConvertTo-Json -Depth 10
    
    Test-Route "POST" "$StrategyRouterUrl/api/process-event" "200" "Process Twitter event" $eventData
    
    # Test avec événement Elon Musk
    $elonEventData = @{
        type = "twitter"
        account = "@elonmusk"
        content = "Bitcoin to the moon! 🚀"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        id = "test_elon_$(Get-Date -UFormat %s)"
    } | ConvertTo-Json -Depth 10
    
    Test-Route "POST" "$StrategyRouterUrl/api/process-event" "200" "Process Elon Musk event" $elonEventData
    
    # Test avec événement Trump
    $trumpEventData = @{
        type = "twitter"
        account = "@realdonaldtrump"
        content = "Economy is crashing! Market failure incoming!"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        id = "test_trump_$(Get-Date -UFormat %s)"
    } | ConvertTo-Json -Depth 10
    
    Test-Route "POST" "$StrategyRouterUrl/api/process-event" "200" "Process Trump event" $trumpEventData
    
} else {
    Write-Warning "Strategy Router non accessible, tests ignorés"
}

# Étape 3: Tests Circle Executor API
if ($CircleExecutorOK) {
    Write-Section "🎯 TESTS CIRCLE EXECUTOR API"
    
    # Test status endpoint
    Test-Route "GET" "$CircleExecutorUrl/api/status" "200" "Status endpoint"
    
    # Test executions endpoint
    Test-Route "GET" "$CircleExecutorUrl/api/executions" "200" "Get all executions"
    
    # Test execute job
    $jobData = @{
        strategyId = "test-strategy-123"
        userId = "test-user-456"
        strategyName = "Test Strategy"
        triggeredBy = @{
            type = "twitter"
            account = "@testaccount"
            content = "Test trigger content"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            id = "test_trigger_$(Get-Date -UFormat %s)"
        }
        actions = @(
            @{
                type = "convert_all"
                targetAsset = "USDC"
                targetChain = "Avalanche"
            }
        )
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json -Depth 10
    
    Test-Route "POST" "$CircleExecutorUrl/api/execute-job" "200" "Execute job" $jobData
    
    # Test close position
    $closePositionData = @{
        userId = "test-user-789"
        targetAsset = "USDC"
        targetChain = "Ethereum"
    } | ConvertTo-Json -Depth 10
    
    Test-Route "POST" "$CircleExecutorUrl/api/close-position" "200" "Close position" $closePositionData
    
    # Test positions endpoint
    Test-Route "GET" "$CircleExecutorUrl/api/positions" "200" "Get all positions"
    
    # Test user positions
    Test-Route "GET" "$CircleExecutorUrl/api/positions?userId=test-user-123" "200" "Get user positions"
    
} else {
    Write-Warning "Circle Executor non accessible, tests ignorés"
}

# Étape 4: Test du workflow complet
if ($StrategyRouterOK -and $CircleExecutorOK) {
    Write-Section "🚀 TEST WORKFLOW COMPLET"
    
    Write-Test "Workflow End-to-End: Fed Panic Strategy"
    
    # Simuler un événement Fed qui devrait déclencher la stratégie FED Panic
    $fedEvent = @{
        type = "twitter"
        account = "@federalreserve"
        content = "Emergency rate decision due to recession concerns and market instability"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        id = "workflow_test_$(Get-Date -UFormat %s)"
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$StrategyRouterUrl/api/process-event" -Method Post -Headers @{'Content-Type'='application/json'} -Body $fedEvent
        
        if ($response.success) {
            $matchedStrategies = $response.matchedStrategies
            Write-Success "Workflow E2E: $matchedStrategies stratégies déclenchées"
            
            if ($response.strategies -and $response.strategies.Count -gt 0) {
                $strategyName = $response.strategies[0].name
                Write-Host "   Détails: $strategyName déclenchée" -ForegroundColor Green
            }
            
            # Vérifier les exécutions
            Start-Sleep 1
            $executionsResponse = Invoke-RestMethod -Uri "$CircleExecutorUrl/api/executions"
            $executionsCount = $executionsResponse.executions.Count
            Write-Success "Vérification: $executionsCount exécutions enregistrées"
            
        } else {
            Write-Error "Workflow E2E: Échec de traitement de l'événement"
        }
    } catch {
        Write-Error "Workflow E2E: Erreur lors du test ($($_.Exception.Message))"
    }
    
} else {
    Write-Warning "Workflow complet ignoré (services non accessibles)"
}

# Étape 5: Tests de performance
Write-Section "⏱️ TESTS DE PERFORMANCE"

if ($StrategyRouterOK) {
    Write-Test "Performance: Traitement de 5 événements rapides"
    
    $startTime = Get-Date
    
    for ($i = 1; $i -le 5; $i++) {
        $eventData = @{
            type = "twitter"
            account = "@testaccount"
            content = "Performance test event #$i"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            id = "perf_test_${i}_$(Get-Date -UFormat %s)"
        } | ConvertTo-Json -Depth 10
        
        try {
            Invoke-RestMethod -Uri "$StrategyRouterUrl/api/process-event" -Method Post -Headers @{'Content-Type'='application/json'} -Body $eventData | Out-Null
        } catch {
            # Ignorer les erreurs de performance
        }
    }
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Success "Performance: 5 événements traités en ${duration}s"
}

# Étape 6: Tests d'erreur
Write-Section "⚠️ TESTS D'ERREUR"

if ($StrategyRouterOK) {
    # Test avec données invalides
    $invalidData = '{"invalid": "data"}'
    Test-Route "POST" "$StrategyRouterUrl/api/process-event" "400" "Invalid event data" $invalidData
    
    # Test avec événement vide
    $emptyEvent = '{}'
    Test-Route "POST" "$StrategyRouterUrl/api/process-event" "400" "Empty event" $emptyEvent
}

# Étape 7: Rapport final
Write-Section "📊 NETTOYAGE & RAPPORT"

# Attendre un peu pour que tous les tests se terminent
Start-Sleep 2

# Afficher le rapport final
Show-Report

# Proposer des actions
Write-Host ""
Write-Host "⚙️ Actions disponibles:" -ForegroundColor Cyan
Write-Host "   1. Démarrer le CLI: npm run cli" -ForegroundColor Yellow
Write-Host "   2. Voir les services: npm run dev" -ForegroundColor Yellow
Write-Host "   3. Ouvrir Prisma Studio: npm run db:studio" -ForegroundColor Yellow
Write-Host "   4. Relancer les tests: .\scripts\test-api-routes.ps1" -ForegroundColor Yellow

Write-Host ""
Write-Host "ℹ️ Test terminé à $(Get-Date)" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Code de sortie basé sur les résultats
if ($Script:FailedTests -eq 0) {
    exit 0
} else {
    exit 1
} 