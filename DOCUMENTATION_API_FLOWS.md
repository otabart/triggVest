# 📋 Documentation des Flux API - TriggVest

## Vue d'ensemble de l'architecture

TriggVest utilise une architecture microservices avec 3 APIs principales qui communiquent entre elles pour exécuter des stratégies de trading automatisées basées sur des événements.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Trigger API   │───▶│ Strategy Router  │───▶│ Circle Executor │
│   (Port 3001)   │    │ API (Port 3002)  │    │ API (Port 3003) │
│                 │    │                  │    │                 │
│ • CLI Interface │    │ • Gestion des    │    │ • Exécution     │
│ • Simulation    │    │   stratégies     │    │   gasless CCTP  │
│ • Événements    │    │ • Correspondance │    │ • Smart         │
│   Twitter       │    │ • Jobs routing   │    │   Accounts      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🎯 Scénario 1 : Création d'une Stratégie

### Description
Un utilisateur crée une nouvelle stratégie de trading automatisée qui sera déclenchée par des événements Twitter spécifiques.

### Flux technique détaillé

#### 1. Appel initial
**API appelée :** `Strategy Router API`
```http
POST http://localhost:3002/api/create-strategy
Content-Type: application/json

{
  "userWalletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "strategyName": "Bridge sur tweets bullish d'Elon",
  "triggers": [
    {
      "type": "twitter",
      "account": "@elonmusk",
      "keywords": ["bitcoin", "moon", "bullish"]
    }
  ],
  "actions": [
    {
      "type": "bridge_gasless",
      "targetAsset": "USDC",
      "targetChain": "Base",
      "amount": "10",
      "sourceChain": "Arbitrum"
    }
  ],
  "smartAccountChain": "base-sepolia"
}
```

#### 2. Traitement interne
Le Strategy Router effectue les opérations suivantes :

1. **Validation des données**
   - Vérification des champs requis
   - Limite de 2 triggers maximum
   - Validation des chaînes supportées

2. **Création de l'utilisateur** (si nécessaire)
   ```sql
   INSERT INTO users (walletAddress, username) VALUES (?, ?)
   ```

3. **Génération du wallet dédié**
   ```javascript
   const wallet = ethers.Wallet.createRandom();
   const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);
   ```

4. **Création de la stratégie**
   ```sql
   INSERT INTO strategies (userId, strategyName, generatedAddress, privateKey, ...)
   ```

5. **Création des triggers et actions**
   ```sql
   INSERT INTO triggers (strategyId, type, account, keywords) VALUES (?, ?, ?, ?)
   INSERT INTO actions (strategyId, type, targetAsset, targetChain) VALUES (?, ?, ?, ?)
   ```

6. **Création du Smart Account** (si spécifié)
   - Appel au Smart Account Manager
   - Déploiement via Circle Paymaster
   - Sauvegarde en base

#### 3. Réponse
```json
{
  "success": true,
  "strategy": {
    "id": "strategy_1704123456789",
    "strategyName": "Bridge sur tweets bullish d'Elon",
    "generatedAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
    "balance": "0",
    "triggers": [...],
    "actions": [...],
    "smartAccount": {
      "address": "0x9876543210fedcba9876543210fedcba98765432",
      "chain": "base-sepolia",
      "created": true
    }
  },
  "message": "Stratégie, wallet et smart account créés avec succès"
}
```

---

## 🐦 Scénario 2 : Déclenchement par Événement Twitter

### Description
Un événement Twitter est simulé via le CLI et déclenche l'exécution d'une ou plusieurs stratégies correspondantes.

### Flux technique détaillé

#### 1. Simulation de l'événement (Trigger API)
**Outil utilisé :** `Trigger CLI`
```bash
npm start
# Interface interactive pour sélectionner :
# - Compte : @elonmusk
# - Contenu : "Bitcoin to the moon! 🚀"
```

#### 2. Envoi de l'événement
**API appelée :** `Strategy Router API`
```http
POST http://localhost:3002/api/process-event
Content-Type: application/json

{
  "type": "twitter",
  "account": "@elonmusk",
  "content": "Bitcoin to the moon! 🚀",
  "timestamp": "2025-01-05T14:30:00.000Z",
  "id": "tweet_1704207000000"
}
```

#### 3. Traitement par Strategy Router

##### 3.1 Sauvegarde de l'événement
```sql
INSERT INTO events (type, account, content, metadata) 
VALUES ('twitter', '@elonmusk', 'Bitcoin to the moon! 🚀', '{"timestamp": "...", "id": "..."}')
```

##### 3.2 Récupération des stratégies actives
```sql
SELECT s.*, t.*, a.* FROM strategies s
JOIN triggers t ON s.id = t.strategyId
JOIN actions a ON s.id = a.strategyId
WHERE s.isActive = true
```

##### 3.3 Vérification des correspondances
```javascript
function matchesTrigger(event, trigger) {
  if (event.type !== trigger.type) return false;
  if (trigger.account && event.account !== trigger.account) return false;
  
  if (trigger.keywords && trigger.keywords.length > 0) {
    const content = event.content.toLowerCase();
    return trigger.keywords.some(keyword => 
      content.includes(keyword.toLowerCase())
    );
  }
  return true;
}
```

##### 3.4 Préparation des jobs pour Circle Executor
Pour chaque stratégie correspondante :

```javascript
const job = {
  strategyId: "strategy_1704123456789",
  userId: "user_1704123456789",
  strategyName: "Bridge sur tweets bullish d'Elon",
  triggeredBy: event,
  actions: [
    {
      type: "bridge_gasless",
      targetAsset: "USDC",
      targetChain: "Base",
      amount: "10",
      sourceChain: "Arbitrum"
    }
  ],
  timestamp: "2025-01-05T14:30:05.000Z",
  strategyPrivateKey: "decrypted_private_key"
}
```

#### 4. Exécution par Circle Executor
**API appelée :** `Circle Executor API`
```http
POST http://localhost:3003/api/execute-job
Content-Type: application/json

{job_data_from_above}
```

##### 4.1 Traitement du job par Circle Executor

**Phase 1 : Préparation chaîne source**
- Création du Smart Account service avec la clé privée
- Initialisation des clients Viem et Pimlico

**Phase 2 : Vérification du solde**
```javascript
const balanceCheck = await sourceSmartAccount.checkSufficientBalance("10", true);
if (!balanceCheck.sufficient) {
  throw new Error(`Solde insuffisant: ${balanceCheck.shortfall} USDC manquant`);
}
```

**Phase 3 : Burn USDC sur chaîne source**
```javascript
const burnAmount = parseUnits("10", 6); // 10 USDC
const burnTxHash = await sourceSmartAccount.burnUSDC(
  burnAmount,
  destinationChainId,
  smartAccountAddress,
  "fast"
);
```

**Phase 4 : Récupération de l'attestation Circle**
```javascript
// Polling avec retry sur l'API Circle
const attestation = await retrieveAttestation(burnTxHash, sourceChainId);
```

**Phase 5 : Préparation chaîne destination**
- Création du Smart Account service pour Base

**Phase 6 : Mint USDC sur chaîne destination**
```javascript
const mintTxHash = await destSmartAccount.mintUSDC(attestation);
```

##### 4.2 Réponse de Circle Executor
```json
{
  "jobId": "job_1704207005000",
  "strategyId": "strategy_1704123456789",
  "userId": "user_1704123456789",
  "strategyName": "Bridge sur tweets bullish d'Elon",
  "triggeredBy": {
    "type": "twitter",
    "account": "@elonmusk",
    "content": "Bitcoin to the moon! 🚀",
    "timestamp": "2025-01-05T14:30:00.000Z",
    "id": "tweet_1704207000000"
  },
  "executions": [
    {
      "id": "exec_1704207005123",
      "userId": "user_1704123456789",
      "action": {
        "type": "bridge_gasless",
        "targetAsset": "USDC",
        "targetChain": "Base",
        "amount": "10",
        "sourceChain": "Arbitrum"
      },
      "status": "completed",
      "timestamp": "2025-01-05T14:30:05.123Z",
      "details": {
        "fromAsset": "USDC",
        "toAsset": "USDC",
        "amount": "10",
        "targetChain": "11155420",
        "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
      }
    }
  ],
  "status": "completed",
  "timestamp": "2025-01-05T14:30:05.500Z"
}
```

#### 5. Sauvegarde de l'exécution
Le Strategy Router sauvegarde l'exécution :
```sql
INSERT INTO executions (userId, strategyId, eventId, actionId, status, txHash)
VALUES (?, ?, ?, ?, 'completed', '0xabc...')
```

#### 6. Réponse finale au CLI
```json
{
  "success": true,
  "event": {...},
  "matchedStrategies": 1,
  "strategies": [
    {
      "id": "strategy_1704123456789",
      "name": "Bridge sur tweets bullish d'Elon",
      "userId": "user_1704123456789",
      "generatedWallet": "0xabcdef..."
    }
  ],
  "users": [
    {
      "userId": "user_1704123456789",
      "walletAddress": "0x1234567890abcdef...",
      "username": "User_12345678",
      "strategyName": "Bridge sur tweets bullish d'Elon",
      "generatedWallet": "0xabcdef..."
    }
  ],
  "jobResults": [
    {
      "jobId": "job_1704207005000",
      "status": "completed",
      "executions": [...]
    }
  ],
  "timestamp": "2025-01-05T14:30:05.600Z"
}
```

---

## 📊 Scénario 3 : Consultation des Données

### Description
Différentes façons de consulter l'état des stratégies, exécutions et Smart Accounts.

### 3.1 Lister les stratégies d'un utilisateur
**API appelée :** `Strategy Router API`
```http
GET http://localhost:3002/api/user-strategies/0x1234567890abcdef1234567890abcdef12345678
```

**Traitement :**
```sql
SELECT s.id, s.strategyName, s.generatedAddress, s.balance, s.isActive,
       COUNT(t.id) as triggersCount, COUNT(a.id) as actionsCount
FROM strategies s
LEFT JOIN triggers t ON s.id = t.strategyId
LEFT JOIN actions a ON s.id = a.strategyId
JOIN users u ON s.userId = u.id
WHERE u.walletAddress = ?
GROUP BY s.id
```

### 3.2 Consulter l'historique des exécutions
**API appelée :** `Circle Executor API`
```http
GET http://localhost:3003/api/executions?userId=user_1704123456789
```

**Données retournées :**
```json
{
  "executions": [
    {
      "id": "exec_1704207005123",
      "userId": "user_1704123456789",
      "action": {...},
      "status": "completed",
      "timestamp": "2025-01-05T14:30:05.123Z",
      "details": {
        "txHash": "0xabcdef...",
        "amount": "10",
        "targetChain": "Base"
      }
    }
  ],
  "count": 1
}
```

### 3.3 Vérifier le statut des APIs
**APIs appelées :**
```http
GET http://localhost:3001/api/status  # Trigger API (si applicable)
GET http://localhost:3002/api/status  # Strategy Router API
GET http://localhost:3003/api/status  # Circle Executor API
```

---

## 🔧 Scénario 4 : Gestion des Smart Accounts

### Description
Création et gestion des Smart Accounts pour l'exécution gasless.

### 4.1 Obtenir les chaînes supportées
**API appelée :** `Strategy Router API`
```http
GET http://localhost:3002/api/supported-chains
```

**Réponse :**
```json
{
  "success": true,
  "supportedChains": [
    "eth-sepolia",
    "arb-sepolia", 
    "base-sepolia",
    "op-sepolia",
    "polygon-amoy"
  ],
  "total": 5
}
```

### 4.2 Consulter un Smart Account
**API appelée :** `Strategy Router API`
```http
GET http://localhost:3002/api/smart-account/strategy_1704123456789
```

**Traitement :**
```sql
SELECT smartAccountAddress, smartAccountOwner, smartAccountChain, 
       smartAccountFactory, smartAccountCreated, smartAccountBalance
FROM strategies 
WHERE id = ? AND smartAccountCreated = true
```

**Réponse :**
```json
{
  "success": true,
  "smartAccount": {
    "address": "0x9876543210fedcba9876543210fedcba98765432",
    "owner": "0xabcdef1234567890abcdef1234567890abcdef12",
    "chain": "base-sepolia",
    "factory": "0x9406Cc6185a346906296840746125a0E44976454",
    "created": true,
    "balance": "0"
  }
}
```

---

## 🚨 Scénario 5 : Gestion des Erreurs

### Description
Gestion des différents types d'erreurs qui peuvent survenir.

### 5.1 Solde insuffisant
**Flux :**
1. Événement déclenché → Strategy Router → Circle Executor
2. Circle Executor vérifie le solde USDC
3. Solde insuffisant détecté

**Réponse d'erreur :**
```json
{
  "jobId": "job_1704207005000",
  "status": "error",
  "executions": [
    {
      "id": "exec_1704207005123",
      "status": "error",
      "error": "❌ Solde insuffisant: 5.0 USDC disponible, 12.0 USDC requis. Manque 7.0 USDC."
    }
  ]
}
```

### 5.2 Chaîne non supportée
**API appelée :** `Strategy Router API` (création de stratégie)
**Erreur :**
```json
{
  "success": false,
  "error": "Chaîne polygon-mainnet non supportée. Chaînes supportées: eth-sepolia, arb-sepolia, base-sepolia"
}
```

### 5.3 Limite de triggers dépassée
**API appelée :** `Strategy Router API` (création de stratégie)
**Erreur :**
```json
{
  "success": false,
  "error": "Limite de triggers dépassée",
  "message": "Maximum 2 triggers autorisés par stratégie"
}
```

---

## 📈 Métriques et Monitoring

### APIs de statut disponibles

#### Strategy Router Status
```http
GET http://localhost:3002/api/status
```
```json
{
  "status": "active",
  "connectedToTriggerApi": true,
  "strategiesCount": 15,
  "timestamp": "2025-01-05T14:30:00.000Z"
}
```

#### Circle Executor Status
```http
GET http://localhost:3003/api/status
```
```json
{
  "status": "active",
  "executionsCount": 42,
  "timestamp": "2025-01-05T14:30:00.000Z"
}
```

---

## 🔄 Résumé des Flux de Données

### Flux principal d'exécution
```
1. [CLI] Trigger API → simulate event
2. [HTTP] Trigger API → Strategy Router → /api/process-event
3. [DB] Strategy Router → save event + find matching strategies
4. [HTTP] Strategy Router → Circle Executor → /api/execute-job
5. [BLOCKCHAIN] Circle Executor → Smart Account → CCTP Bridge
6. [DB] Strategy Router ← Circle Executor ← execution results
7. [HTTP] Trigger API ← Strategy Router ← final response
8. [CLI] Display results to user
```

### APIs et leurs responsabilités

| API | Port | Responsabilités principales |
|-----|------|----------------------------|
| **Trigger API** | CLI | • Interface utilisateur<br>• Simulation d'événements<br>• Tests et démo |
| **Strategy Router** | 3002 | • Gestion des stratégies<br>• Correspondance événements/triggers<br>• Routage des jobs<br>• Gestion des wallets |
| **Circle Executor** | 3003 | • Exécution gasless CCTP<br>• Smart Accounts<br>• Interactions blockchain<br>• Historique des exécutions |

### Base de données (PostgreSQL + Prisma)
- **users** : Utilisateurs et leurs wallets principaux
- **strategies** : Stratégies avec wallets générés et Smart Accounts
- **triggers** : Conditions de déclenchement (Twitter, etc.)
- **actions** : Actions à exécuter (bridge, swap, etc.)
- **events** : Événements reçus
- **executions** : Historique des exécutions

---

## 💡 Conseils d'utilisation

### Pour les développeurs
1. **Démarrage local :**
   ```bash
   # Terminal 1 - Strategy Router
   cd apps/strategy-router-api && npm run dev
   
   # Terminal 2 - Circle Executor  
   cd apps/circle-executor-api && npm run dev
   
   # Terminal 3 - CLI Tests
   cd apps/trigger-api && npm start
   ```

2. **Variables d'environnement requises :**
   - `DATABASE_URL` : Connexion PostgreSQL
   - `WALLET_ENCRYPTION_KEY` : Clé de chiffrement des wallets
   - Circle Paymaster addresses et bundler URLs

3. **Tests et debugging :**
   - Utilisez le Trigger CLI pour simuler des événements
   - Consultez les logs détaillés dans chaque API
   - Vérifiez les statuts via `/api/status`

### Pour les utilisateurs finaux
1. **Créer une stratégie :** Interface web → Strategy Router API
2. **Monitoring :** Dashboard → Circle Executor API pour l'historique
3. **Gestion des fonds :** Transférer USDC vers les wallets générés
4. **Smart Accounts :** Utilisent Circle Paymaster pour les frais gas

---

*Cette documentation couvre tous les scénarios principaux de TriggVest. Pour plus de détails techniques, consultez le code source de chaque API.* 