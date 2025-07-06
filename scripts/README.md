# 🧪 Scripts de Test et Démonstration TriggVest

Scripts PowerShell complets pour tester et démontrer toutes les fonctionnalités de TriggVest.

## 📋 Scripts Disponibles

### 1. 🧪 **Test Automatisé des APIs** (`test-api-routes.ps1`)

Script PowerShell complet pour tester tous les endpoints des APIs avec logging coloré.

**Utilisation :**
```powershell
# Méthode 1 - PowerShell direct
.\scripts\test-api-routes.ps1

# Méthode 2 - Via npm
npm run test:api

# Méthode 3 - Via batch (plus simple)
.\scripts\run-tests.bat
```

**Fonctionnalités :**
- ✅ Test de tous les endpoints REST
- ✅ Vérification des services (santé check)
- ✅ Tests du workflow end-to-end
- ✅ Tests de performance (5 événements rapides)
- ✅ Tests d'erreur et validation
- ✅ Rapport final avec statistiques colorées

**Exemples de tests :**
```powershell
# Tests Strategy Router
GET  /api/status                    ✅ 200 OK
GET  /api/strategies                ✅ 200 OK
POST /api/strategies                ✅ 200 OK
POST /api/process-event             ✅ 200 OK

# Tests Circle Executor
GET  /api/status                    ✅ 200 OK
GET  /api/executions                ✅ 200 OK
POST /api/execute-job               ✅ 200 OK
POST /api/close-position            ✅ 200 OK
```

### 2. 🎬 **Démonstration Interactive** (`demo-complete.ps1`)

Script de démonstration complète avec scénarios réels pour ETHGlobal.

**Utilisation :**
```powershell
# Lancer la démonstration
.\scripts\demo-complete.ps1
```

**Scénarios inclus :**
1. **Stratégies Existantes** - Affichage des stratégies configurées
2. **Événement Fed** - Simulation tweet recession Federal Reserve
3. **Événement Elon** - Simulation tweet bullish Bitcoin
4. **Vérification Exécutions** - Contrôle des actions Circle
5. **Création Stratégie** - Nouvelle stratégie Vitalik Watch
6. **Test Nouvelle Stratégie** - Événement Ethereum/Layer2
7. **Positions Utilisateurs** - Vérification portfolio

**Interface interactive :**
```
🎬 DÉMONSTRATION TRIGGVEST
🏆 ETHGlobal Cannes 2025 - Circle Track

📍 ÉTAPE 1: STRATÉGIES EXISTANTES
   Affichage des stratégies configurées

💡 Stratégies disponibles:
   • FED Panic (User: user-alice)
     └─ Trigger: @federalreserve avec mots-clés: recession, crash, emergency
   • Crypto Euphoria (User: user-bob)
     └─ Trigger: @elonmusk avec mots-clés: bitcoin, moon, 🚀

Appuyez sur Entrée pour continuer...
```

### 3. 📊 **Fichier Batch Launcher** (`run-tests.bat`)

Launcher simple pour Windows qui exécute les tests PowerShell.

**Utilisation :**
```batch
# Double-clic sur le fichier ou via terminal
.\scripts\run-tests.bat
```

## 🚀 Prérequis

### Services Requis
Avant d'exécuter les scripts, assurez-vous que les services sont démarrés :

```bash
# Terminal 1 - Strategy Router
cd apps/strategy-router-api
npm run dev

# Terminal 2 - Circle Executor  
cd apps/circle-executor-api
npm run dev
```

### Vérification
Les scripts vérifient automatiquement que les services sont accessibles :
- Strategy Router : `http://localhost:3002/api/status`
- Circle Executor : `http://localhost:3003/api/status`

## 📈 Exemples d'Utilisation

### Test Rapide
```powershell
# Test rapide de toutes les APIs
npm run test:api

# Résultat attendu
✅ Tests réussis: 15
❌ Tests échoués: 0
📊 Taux de réussite: 100%
```

### Démonstration Complète
```powershell
# Démonstration interactive pour ETHGlobal
.\scripts\demo-complete.ps1

# Suivre les étapes interactives
# Parfait pour présenter le projet !
```

### Test d'un Endpoint Spécifique
```powershell
# Test manuel d'un endpoint
Invoke-RestMethod -Uri "http://localhost:3002/api/strategies" | ConvertTo-Json
```

## 🎯 Scénarios de Test

### 1. **Événement Federal Reserve**
```json
{
  "type": "twitter",
  "account": "@federalreserve",
  "content": "🚨 URGENT: Rising recession indicators demand immediate monetary policy response. Market instability concerns growing.",
  "timestamp": "2025-01-27T15:30:00.000Z",
  "id": "demo_fed_123456"
}
```

**Résultat attendu :**
- ✅ Déclenche la stratégie "FED Panic" (user-alice)
- ✅ Action : convert_all → USDC/Avalanche
- ✅ Exécution enregistrée dans Circle Executor

### 2. **Événement Elon Musk**
```json
{
  "type": "twitter",
  "account": "@elonmusk",
  "content": "🚀 Bitcoin is digital gold! Just loaded up more BTC. Moon mission activated! 🌙💰",
  "timestamp": "2025-01-27T15:35:00.000Z",
  "id": "demo_elon_123456"
}
```

**Résultat attendu :**
- ✅ Déclenche la stratégie "Crypto Euphoria" (user-bob)
- ✅ Action : convert_all → BTC/Ethereum
- ✅ Exécution enregistrée avec détails

### 3. **Test d'Erreur**
```json
{
  "invalid": "data"
}
```

**Résultat attendu :**
- ❌ HTTP 400 Bad Request
- ❌ Erreur de validation attendue

## 📊 Rapports et Logs

### Rapport de Test
```
🚀 RAPPORT FINAL DES TESTS 🚀

📊 Statistiques:
   ✅ Tests réussis: 15
   ❌ Tests échoués: 0  
   📈 Total tests: 15
   🎯 Taux de réussite: 100%

✅ Tous les tests ont réussi ! API prête pour la démo ✅

⚙️ Services à démarrer:
   Terminal 1: cd apps/strategy-router-api && npm run dev
   Terminal 2: cd apps/circle-executor-api && npm run dev
   Terminal 3: npm run cli
```

### Logs d'Exécution
```
🎯 Test: Process Twitter event
✅ HTTP 200 - Process Twitter event
   Response: {"success":true,"matchedStrategies":1,"strategies":[{"id":"strategy-1","name":"FED Panic","userId":"user-alice"}]}

🎯 Test: Execute job
✅ HTTP 200 - Execute job
   Response: {"success":true,"jobId":"job_123456","status":"completed"}
```

## 🛠️ Personnalisation

### Modifier les URLs
```powershell
# Modifier les URLs par défaut
.\scripts\test-api-routes.ps1 -StrategyRouterUrl "http://localhost:3002" -CircleExecutorUrl "http://localhost:3003"
```

### Ajouter des Tests
```powershell
# Ajouter un nouveau test dans test-api-routes.ps1
Test-Route "GET" "$CircleExecutorUrl/api/new-endpoint" "200" "Test new endpoint"
```

### Créer des Scénarios Personnalisés
```powershell
# Créer un événement personnalisé
$customEvent = @{
    type = "twitter"
    account = "@custom_account"
    content = "Custom test content"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    id = "custom_test_$(Get-Date -UFormat %s)"
} | ConvertTo-Json -Depth 10

# Tester l'événement
Invoke-RestMethod -Uri "$StrategyRouterUrl/api/process-event" -Method Post -Headers @{'Content-Type'='application/json'} -Body $customEvent
```

## 🎮 Utilisation pour ETHGlobal

### Préparation Démo
```powershell
# 1. Vérifier que tout fonctionne
npm run test:api

# 2. Préparer la démonstration
.\scripts\demo-complete.ps1

# 3. Tester le CLI
npm run cli
```

### Présentation
1. **Montrer l'architecture** avec les tests automatisés
2. **Démontrer les scénarios** avec le script interactif
3. **Utiliser le CLI** pour créer des événements en live
4. **Expliquer Circle SDK** avec les exécutions simulées

## 💡 Conseils

### Debugging
```powershell
# Vérifier les services
curl http://localhost:3002/api/status
curl http://localhost:3003/api/status

# Voir les logs en temps réel
Get-Content -Path "apps/strategy-router-api/logs/app.log" -Wait
```

### Performance
```powershell
# Tester la performance avec plusieurs événements
for ($i = 1; $i -le 10; $i++) {
    # Envoyer événement
    # Mesurer le temps de réponse
}
```

## 📞 Support

- **Repository** : [GitHub TriggVest](https://github.com/your-repo)
- **Discord** : ETHGlobal Cannes 2025 - Circle Track
- **Documentation** : [README.md](../README.md)

---

**Made with ❤️ for ETHGlobal Cannes 2025 - Circle Track** 