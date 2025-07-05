# 🧠 Triggvest — ETHGlobal Cannes 2025 (Circle Track)

## ✅ 🎯 Objectif : Circle + Triggvest

Créer une plateforme d'automatisation d'investissement réactif où les utilisateurs définissent des **triggers externes**  
(ex: tweet contenant `"recession"`) et des **actions automatiques**  
(ex: swap en USDC et bridge vers Avalanche avec Circle CCTP).

> **Architecture complète en TypeScript** avec CLI interactif, base de données Supabase et exécution automatisée.

---

## 🚀 Architecture CLI + Microservices + Database - **Full Stack**

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur
    participant CLI as 🎯 Trigger CLI
    participant SR as 🧭 Strategy Router
    participant DB as 🗄️ Supabase PostgreSQL
    participant CE as ⚡ Circle Executor
    
    U->>CLI: Choix interactif
    Note over CLI: Source, Compte, Contenu
    CLI->>SR: POST /api/process-event
    SR->>DB: Fetch user strategies
    DB-->>SR: Return matching strategies
    Note over SR: Pattern matching
    SR->>CE: POST /api/execute-job
    CE->>DB: Store execution results
    Note over CE: Actions Circle CCTP
    CE->>SR: Résultat d'exécution
    SR->>CLI: Réponse complète
    CLI->>U: Affichage résultats
```

### 📦 Services & Infrastructure

| Service | Port | Description | Stack |
|---------|------|-------------|-------|
| **Trigger CLI** | - | Interface interactive pour simuler événements | CLI + Inquirer + TypeScript |
| **Strategy Router** | 3002 | Matching des événements avec stratégies | Express + PostgreSQL + TypeScript |
| **Circle Executor** | 3003 | Exécution des actions DeFi via Circle SDK | Express + PostgreSQL + TypeScript |
| **Supabase** | 5432 | Base de données PostgreSQL + Auth + APIs | PostgreSQL + Dashboard |

---

## 🗄️ Base de Données Supabase

### Configuration
```bash
# Copier le fichier d'exemple et configurer vos valeurs
cp .env.example .env

# Variables requises dans .env :
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
WALLET_ENCRYPTION_KEY=your-super-secret-encryption-key-32-chars-min

# Dashboard Supabase : https://supabase.com/dashboard/project/YOUR_PROJECT_ID
```

### Schema de Base de Données - Structure Fusionnée ✨

```sql
-- 👤 Table des utilisateurs
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🎯 Table des stratégies avec wallets intégrés (FUSIONNÉE)
CREATE TABLE strategies (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    strategy_name TEXT NOT NULL,
    
    -- 🔐 Wallet généré intégré dans la stratégie
    generated_address TEXT UNIQUE NOT NULL, -- Adresse Ethereum du wallet généré
    private_key TEXT NOT NULL,              -- Clé privée chiffrée (AES-256-CBC)
    balance DECIMAL DEFAULT 0,              -- Balance du wallet en Wei
    
    -- Statut
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ⚡ Table des triggers (MAX 2 par stratégie)
CREATE TABLE triggers (
    id TEXT PRIMARY KEY,
    strategy_id TEXT REFERENCES strategies(id) ON DELETE CASCADE,
    type TEXT NOT NULL,                     -- 'twitter', 'price', 'news'
    account TEXT,                          -- @username pour Twitter
    keywords TEXT[],                       -- Array de mots-clés
    conditions JSONB,                      -- Conditions complexes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔄 Table des actions
CREATE TABLE actions (
    id TEXT PRIMARY KEY,
    strategy_id TEXT REFERENCES strategies(id) ON DELETE CASCADE,
    type TEXT NOT NULL,                    -- 'convert_all', 'close_position', 'bridge'
    target_asset TEXT NOT NULL,           -- 'USDC', 'BTC', 'ETH'
    target_chain TEXT NOT NULL,           -- 'Ethereum', 'Avalanche', 'Polygon'
    parameters JSONB,                     -- Paramètres spécifiques
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📊 Table des événements
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,                   -- 'twitter', 'price', 'news'
    account TEXT,                         -- @username pour Twitter
    content TEXT NOT NULL,                -- Contenu de l'événement
    metadata JSONB,                       -- Métadonnées additionnelles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🚀 Table des exécutions
CREATE TABLE executions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    strategy_id TEXT REFERENCES strategies(id),
    event_id TEXT REFERENCES events(id),
    action_id TEXT REFERENCES actions(id),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    tx_hash TEXT,                           -- Hash de la transaction
    from_asset TEXT,                        -- Asset source
    to_asset TEXT,                          -- Asset destination
    amount DECIMAL,                         -- Montant tradé
    gas_used DECIMAL,                       -- Gas consommé
    error_message TEXT,                     -- Message d'erreur si échec
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 💰 Table des positions
CREATE TABLE positions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    asset TEXT NOT NULL,                   -- 'USDC', 'BTC', 'ETH'
    chain TEXT NOT NULL,                   -- 'Ethereum', 'Avalanche', 'Polygon'
    amount DECIMAL NOT NULL,               -- Quantité possédée
    value_usd DECIMAL,                     -- Valeur en USD
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, asset, chain)
);
```

### 🔐 Sécurité des Wallets

```typescript
// Chiffrement des clés privées avec AES-256-CBC
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'TriggVest2025ETHGlobal';

// Chaque stratégie génère automatiquement :
interface StrategyWallet {
  generatedAddress: string;  // 0x742d35Cc6644C30532e6391A35e7c785d0E7a123
  privateKey: string;        // Clé chiffrée stockée en base
  balance: number;           // Balance en Wei
}
```

### 📊 Relations entre Tables

```mermaid
erDiagram
    users ||--o{ strategies : "crée"
    strategies ||--o{ triggers : "max 2"
    strategies ||--o{ actions : "contient"
    strategies ||--o{ executions : "déclenche"
    users ||--o{ positions : "possède"
    events ||--o{ executions : "déclenche"
    actions ||--o{ executions : "exécute"
    
    users {
        string id PK
        string wallet_address UK "MetaMask"
        string username
        string email
    }
    
    strategies {
        string id PK
        string user_id FK
        string strategy_name
        string generated_address UK "Wallet généré"
        string private_key "Chiffré AES-256"
        decimal balance "Wei"
        boolean is_active
    }
    
    triggers {
        string id PK
        string strategy_id FK
        string type "twitter|price|news"
        string account "@username"
        string[] keywords
    }
    
    actions {
        string id PK
        string strategy_id FK
        string type "convert_all|bridge"
        string target_asset "USDC|BTC|ETH"
        string target_chain "Ethereum|Avalanche"
    }
```

### 🔑 Indexes pour Performance

```sql
-- Index sur les stratégies actives
CREATE INDEX idx_strategies_active ON strategies(user_id, is_active);

-- Index sur les triggers par type
CREATE INDEX idx_triggers_type ON triggers(type, account);

-- Index sur les exécutions par statut
CREATE INDEX idx_executions_status ON executions(status, created_at);

-- Index sur les positions par utilisateur
CREATE INDEX idx_positions_user ON positions(user_id, asset, chain);

-- Index sur les événements par type et date
CREATE INDEX idx_events_type_date ON events(type, created_at);
```

### 💾 Données de Test (Seed)

```typescript
// 4 stratégies de test avec wallets générés automatiquement :

const strategies = [
  {
    name: "Trump Bitcoin Strategy",
    user: "0x742d35Cc6644C30532e6391A35e7c785d0E7a123",
    triggers: [
      { account: "@realdonaldtrump", keywords: ["bitcoin", "crypto", "BTC"] },
      { account: "@federalreserve", keywords: ["rates", "policy", "economy"] }
    ],
    actions: [
      { type: "convert_all", targetAsset: "BTC", targetChain: "Ethereum" }
    ]
  },
  {
    name: "Elon Musk Signal", 
    user: "0x742d35Cc6644C30532e6391A35e7c785d0E7a123",
    triggers: [
      { account: "@elonmusk", keywords: ["dogecoin", "tesla", "mars"] }
    ],
    actions: [
      { type: "convert_all", targetAsset: "DOGE", targetChain: "Ethereum" },
      { type: "bridge", targetAsset: "USDC", targetChain: "Polygon" }
    ]
  },
  {
    name: "Coinbase Listing Alert",
    user: "0x8ba1f109551bD432803012645Hac136c39dc456", 
    triggers: [
      { account: "@coinbase", keywords: ["listing", "support", "asset"] },
      { account: "@binance", keywords: ["new", "token", "launch"] }
    ],
    actions: [
      { type: "convert_all", targetAsset: "ETH", targetChain: "Ethereum" }
    ]
  },
  {
    name: "Vitalik Research Insights",
    user: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    triggers: [
      { account: "@vitalikbuterin", keywords: ["ethereum", "research", "scaling"] }
    ],
    actions: [
      { type: "convert_all", targetAsset: "ETH", targetChain: "Ethereum" },
      { type: "bridge", targetAsset: "ETH", targetChain: "Avalanche" }
    ]
  }
];
```

### 📋 Résumé des Tables

| Table | Description | Champs Clés | Relations |
|-------|-------------|-------------|-----------|
| **users** | Utilisateurs avec wallets MetaMask | `wallet_address` (unique) | → strategies, positions |
| **strategies** | Stratégies avec wallets intégrés | `generated_address`, `private_key` (chiffré) | → triggers (max 2), actions |
| **triggers** | Déclencheurs d'événements | `account`, `keywords[]` | ← strategies |
| **actions** | Actions à exécuter | `target_asset`, `target_chain` | ← strategies |
| **events** | Événements capturés | `type`, `account`, `content` | → executions |
| **executions** | Historique des exécutions | `status`, `tx_hash` | ← users, strategies, events, actions |
| **positions** | Positions crypto des utilisateurs | `asset`, `chain`, `amount` | ← users |

### 🔄 API Routes Disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/create-strategy` | Créer stratégie avec wallet (max 2 triggers) |
| `GET` | `/api/user-strategies/:walletAddress` | Lister stratégies d'un utilisateur |
| `POST` | `/api/process-event` | Traiter événement depuis CLI |
| `GET` | `/api/strategies` | Lister toutes les stratégies actives |
| `GET` | `/api/status` | Statut de l'API et nombre de stratégies |

---

## 🛠️ Démarrage Rapide

### 1. Installation & Setup
```bash
# Cloner le repo
git clone <votre-repo>
cd triggvest

# Installer toutes les dépendances
npm run install:all

# Configurer les variables d'environnement
cp .env.example .env
# ⚠️  Modifier .env avec vos vraies valeurs (Supabase, Circle API, etc.)

# Configurer la base de données
npm run db:setup
```

### 2. Configuration Environnement
```bash
# Variables essentielles à configurer dans .env :

# 🗄️  Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres

# 🔐 Sécurité des wallets 
WALLET_ENCRYPTION_KEY=your-super-secret-encryption-key-32-chars-min

# 🔗 Circle SDK (optionnel pour développement)
CIRCLE_API_KEY=your-circle-api-key
CIRCLE_ENVIRONMENT=sandbox
```

### 3. Configuration Base de Données
```bash
# Créer les tables (à implementer avec Prisma)
npm run db:migrate

# Seeder les données de test
npm run db:seed
```

### 4. Démarrage des Services
```bash
# 🚀 Démarrer tous les services
npm run dev

# Services individuels
npm run dev:router     # 🧭 Strategy Router (Port 3002)  
npm run dev:circle     # ⚡ Circle Executor (Port 3003)
npm run cli            # 🎯 Trigger CLI
```

### 5. Tests avec Base de Données
```bash
# Tests end-to-end avec DB
npm run test:e2e

# Tests unitaires
npm run test:unit
```