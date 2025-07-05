// Types partagés pour la Circle Executor API

export interface TweetEvent {
  type: 'twitter';
  account: string;
  content: string;
  timestamp: string;
  id: string;
}

export interface Action {
  type: 'convert_all' | 'close_position';
  targetAsset: string;
  targetChain: string;
}

export interface Job {
  strategyId: string;
  userId: string;
  strategyName: string;
  triggeredBy: TweetEvent;
  actions: Action[];
  timestamp: string;
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
}

export interface ApiStatus {
  status: 'active' | 'inactive';
  executionsCount: number;
  timestamp: string;
} 