// Types partagés pour la Circle Executor API

export interface TweetEvent {
  type: 'twitter';
  account: string;
  content: string;
  timestamp: string;
  id: string;
}

export interface Action {
  type: 'convert_all' | 'close_position' | 'bridge_gasless';
  targetAsset: string;
  targetChain: string;
  amount?: string;
  sourceChain?: string;
}

export interface Job {
  strategyId: string;
  userId: string;
  strategyName: string;
  triggeredBy: TweetEvent;
  actions: Action[];
  timestamp: string;
  strategyPrivateKey?: string; // Clé privée de la stratégie pour les Smart Accounts
}

export interface ExecutionDetails {
  fromAsset?: string;
  toAsset?: string;
  amount?: string;
  targetChain?: string;
  txHash?: string;
}

export interface Execution {
  id: string;
  userId: string;
  action: Action;
  status: 'completed' | 'error' | 'pending';
  timestamp: string;
  details: ExecutionDetails;
  error?: string;
  errorCode?: ExecutionErrorCode;
  errorDetails?: ExecutionErrorDetails;
}

// =====================================
// TYPES D'ERREUR AMÉLIORÉS
// =====================================

export enum ExecutionErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
  GASLESS_NOT_SUPPORTED = 'GASLESS_NOT_SUPPORTED',
  PRIVATE_KEY_MISSING = 'PRIVATE_KEY_MISSING',
  ATTESTATION_FAILED = 'ATTESTATION_FAILED',
  BURN_FAILED = 'BURN_FAILED',
  MINT_FAILED = 'MINT_FAILED',
  SMART_ACCOUNT_ERROR = 'SMART_ACCOUNT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ExecutionErrorDetails {
  code: ExecutionErrorCode;
  message: string;
  details?: {
    currentBalance?: string;
    requiredAmount?: string;
    shortfall?: string;
    supportedChains?: string[];
    txHash?: string;
    attestationRetries?: number;
    smartAccountAddress?: string;
  };
  timestamp: string;
  actionType: string;
  userId: string;
}

export interface JobResponse {
  jobId: string;
  strategyId: string;
  userId: string;
  strategyName: string;
  triggeredBy: TweetEvent;
  executions: Execution[];
  status: 'completed' | 'error' | 'pending';
  timestamp: string;
  errorSummary?: {
    totalErrors: number;
    errorCodes: ExecutionErrorCode[];
    criticalErrors: boolean;
  };
}

export interface ClosePositionRequest {
  userId: string;
  targetAsset: string;
  targetChain: string;
}

export interface ClosePositionResponse {
  success: boolean;
  execution: Execution;
}

export interface ExecutionsResponse {
  executions: Execution[];
  count: number;
  errorStats?: {
    totalErrors: number;
    errorsByCode: Record<ExecutionErrorCode, number>;
    successRate: number;
  };
}

export interface ApiStatus {
  status: 'active' | 'inactive';
  executionsCount: number;
  timestamp: string;
  errorRate?: number;
  lastError?: {
    code: ExecutionErrorCode;
    timestamp: string;
    count: number;
  };
} 