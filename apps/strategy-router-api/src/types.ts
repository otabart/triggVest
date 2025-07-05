// Types partagés pour la Strategy Router API

export interface TweetEvent {
  type: 'twitter';
  account: string;
  content: string;
  timestamp: string;
  id: string;
}

export interface ConnectionEvent {
  type: 'connection';
  message: string;
  timestamp: string;
}

export type EventType = TweetEvent | ConnectionEvent;

export interface Trigger {
  type: string;
  account?: string;
  keywords?: string[];
}

export interface Action {
  type: string;
  targetAsset: string;
  targetChain: string;
  amount?: string;
  sourceChain?: string;
}

export interface Strategy {
  id: string;
  userId: string;
  strategyName: string;
  triggers: Trigger[];
  actions: Action[];
}

export interface Job {
  strategyId: string;
  userId: string;
  strategyName: string;
  triggeredBy: TweetEvent;
  actions: Action[];
  timestamp: string;
  strategyPrivateKey?: string;
}

export interface JobResponse {
  jobId: string;
  strategyId: string;
  userId: string;
  strategyName: string;
  triggeredBy: TweetEvent;
  executions: any[];
  status: string;
  timestamp: string;
  txHash?: string;
}

export interface ApiStatus {
  status: 'active' | 'inactive' | 'error';
  connectedToTriggerApi: boolean;
  strategiesCount: number;
  timestamp: string;
} 