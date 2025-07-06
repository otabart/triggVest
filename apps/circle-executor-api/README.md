# 🌉 Circle Executor API - Bridge CCTP

API pour exécuter des bridges USDC cross-chain gasless entre Arbitrum et Base en utilisant le protocole CCTP (Cross-Chain Transfer Protocol) de Circle.

## 📋 Fonctionnalités

- 🔥 **Bridge USDC gasless** : Transfert d'USDC d'Arbitrum vers Base sans frais de gas
- 🏦 **Smart Accounts** : Utilisation de wallets custodial avec Smart Accounts
- 🔐 **Sécurisé** : Clés privées chiffrées et gestion sécurisée des wallets
- ⚡ **Rapide** : Transferts en ~3-5 minutes avec attestations Circle
- 🌐 **Production-ready** : Basé sur les SDK officiels Circle

## 🚀 Installation

```bash
cd apps/circle-executor-api
npm install
```

## ⚙️ Configuration

1. **Copiez le fichier d'environnement :**
```bash
cp .env.example .env
```

2. **Configurez votre clé privée :**
```bash
# Dans .env
PRIVATE_KEY=your_private_key_here
```

3. **Obtenez des USDC de test :**
- Rendez-vous sur https://faucet.circle.com
- Connectez votre wallet
- Demandez des USDC sur Arbitrum Sepolia

## 🔧 Utilisation

### 1. Démarrer l'API

```bash
npm run dev
```

L'API sera disponible sur `http://localhost:3003`

### 2. Tester le bridge CCTP

**Vérifier les soldes :**
```bash
npm run test:cctp -- --check-balances
```

**Effectuer un bridge :**
```bash
npm run test:cctp -- --bridge
```

### 3. Utiliser l'API REST

**Exécuter un job de bridge :**
```bash
curl -X POST http://localhost:3003/api/execute-job \
  -H "Content-Type: application/json" \
  -d '{
    "strategyId": "strategy_123",
    "userId": "user_456",
    "strategyName": "Bridge USDC to Base",
    "triggeredBy": {
      "type": "manual",
      "content": "Bridge manuel"
    },
    "actions": [
      {
        "type": "bridge_gasless",
        "sourceChain": "Arbitrum",
        "targetChain": "Base",
        "amount": "10"
      }
    ],
    "strategyPrivateKey": "your_strategy_private_key"
  }'
```

## 📊 Endpoints API

### POST `/api/execute-job`
Execute un job de bridge CCTP

**Body :**
```json
{
  "strategyId": "string",
  "userId": "string", 
  "strategyName": "string",
  "triggeredBy": {
    "type": "manual",
    "content": "string"
  },
  "actions": [
    {
      "type": "bridge_gasless",
      "sourceChain": "Arbitrum",
      "targetChain": "Base", 
      "amount": "10"
    }
  ],
  "strategyPrivateKey": "string"
}
```

### GET `/api/executions`
Récupère l'historique des exécutions

**Query params :**
- `userId`: Filtrer par utilisateur (optionnel)

### GET `/api/status`
Statut de l'API

## 🌉 Architecture CCTP

### Flow de bridge :

1. **Burn** : Burn USDC sur la chaîne source (Arbitrum)
2. **Attestation** : Récupération de l'attestation Circle
3. **Mint** : Mint USDC sur la chaîne destination (Base)

### Smart Accounts :

- **Wallet custodial** : Clé privée stockée de manière sécurisée
- **Smart Account** : Wallet abstraction pour transactions gasless
- **Circle Paymaster** : Sponsor des frais de gas

## 🔐 Sécurité

- ✅ Clés privées chiffrées avec `WALLET_ENCRYPTION_KEY`
- ✅ Validation des montants et soldes
- ✅ Gestion d'erreurs robuste
- ✅ Logs détaillés pour monitoring

## 📋 Chaînes supportées

| Chaîne | ID | USDC Address |
|--------|-----|-------------|
| Arbitrum Sepolia | 421614 | 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d |
| Base Sepolia | 84532 | 0x036CbD53842c5426634e7929541eC2318f3dCF7e |

## 🔄 Exemple d'utilisation dans TriggVest

```javascript
// Quand un utilisateur crée une stratégie
const strategy = {
  name: "Acheter ETH sur Base",
  targetChain: "Base",
  targetAsset: "ETH",
  triggerConditions: ["price_above_2000"]
};

// Un wallet custodial + Smart Account sont créés
const wallet = await createCustodialWallet(userId);
const smartAccount = await createSmartAccount(wallet.privateKey);

// L'utilisateur alimente le Smart Account sur Arbitrum
await fundSmartAccount(smartAccount.address, "100", "ARB_SEPOLIA");

// Quand la stratégie est déclenchée
const job = {
  actions: [
    {
      type: "bridge_gasless",
      sourceChain: "Arbitrum", 
      targetChain: "Base",
      amount: "50"
    },
    {
      type: "convert_all",
      fromAsset: "USDC",
      toAsset: "ETH",
      targetChain: "Base"
    }
  ]
};

// Exécution via Circle Executor API
const result = await executeJob(job);
```

## 🛠️ Développement

### Structure du projet :

```
apps/circle-executor-api/
├── src/
│   ├── index.ts              # API principale
│   ├── types.ts              # Types TypeScript
│   └── lib/
│       └── smart-account-service.ts  # Service Smart Account
├── scripts/
│   └── test-cctp-bridge.ts   # Script de test
├── .env.example              # Variables d'environnement
└── README.md                 # Documentation
```

### Développement local :

```bash
# Démarrer en mode développement
npm run dev

# Tester le bridge
npm run test:cctp -- --bridge

# Construire pour production
npm run build
npm start
```

## 🔍 Monitoring

L'API fournit des logs détaillés :

```
🔧 Initializing Smart Account for chain 421614...
✅ Smart Account initialized: 0x1234...
💰 Solde USDC sur Arbitrum: 100.0 USDC
🔥 Burning 10.0 USDC on chain 421614...
✅ Burn transaction hash: 0xabc...
🔍 Récupération de l'attestation pour tx: 0xabc...
✅ Attestation récupérée avec succès
🪙 Minting USDC on chain 84532...
✅ Mint transaction hash: 0xdef...
🎉 Bridge CCTP terminé avec succès!
```

## 📚 Resources

- [Circle CCTP Documentation](https://developers.circle.com/stablecoins/cctp)
- [Circle Paymaster](https://developers.circle.com/w3s/paymaster)
- [Arbitrum Sepolia Faucet](https://faucet.arbitrum.io/)
- [Base Sepolia Faucet](https://faucet.base.org/)
- [Circle USDC Faucet](https://faucet.circle.com/)

## 🤝 Support

Pour toute question ou problème :

1. Vérifiez les logs de l'API
2. Assurez-vous d'avoir suffisamment d'USDC sur Arbitrum
3. Vérifiez que votre clé privée est correctement configurée
4. Consultez la documentation Circle CCTP

---

*Cette implémentation est basée sur l'exemple cctp-v2-web-app et utilise les SDK officiels Circle.* 