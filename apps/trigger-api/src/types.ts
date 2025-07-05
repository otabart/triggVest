// Types pour la Trigger API - TriggVest

export interface TweetEvent {
  type: 'twitter';
  account: string;  // @username
  content: string;  // Contenu du tweet
  timestamp: string; // ISO date string
  id: string;       // Identifiant unique
}

export interface ConnectionEvent {
  type: 'connection';
  clientId: string;
  timestamp: string;
}

export type EventType = TweetEvent | ConnectionEvent;

export interface TweetRequest {
  account: string;
  content: string;
}

export interface DemoTweet {
  account: string;
  content: string;
}

export interface ApiStatus {
  status: 'active' | 'inactive';
  connectedClients: number;
  timestamp: string;
}

export interface TweetResponse {
  success: boolean;
  message: string;
  event: TweetEvent;
} 