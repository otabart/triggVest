export interface Token {
  symbol: string;
  name: string;
  logo: string;
  addresses: {
    arbitrum: string;
    base: string;
  };
  decimals: number;
}

export const SUPPORTED_TOKENS: Token[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    logo: "💰",
    addresses: {
      arbitrum: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // USDC on Arbitrum Sepolia
      base: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
    },
    decimals: 6,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    logo: "🔷",
    addresses: {
      arbitrum: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73", // WETH on Arbitrum Sepolia
      base: "0x4200000000000000000000000000000000000006", // WETH on Base Sepolia
    },
    decimals: 18,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    logo: "💚",
    addresses: {
      arbitrum: "0xf7F8B7Bb35C9C6D0fD80D1C1e5E6A48b1c1c5e9e", // USDT on Arbitrum Sepolia (example)
      base: "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2", // USDT on Base Sepolia (example)
    },
    decimals: 6,
  },
  {
    symbol: "ARB",
    name: "Arbitrum Token",
    logo: "🔵",
    addresses: {
      arbitrum: "0xD50b8c8D7d1d4b7aF58a6e7f1e6F4b9e1B2c8e3f", // ARB on Arbitrum Sepolia (example)
      base: "0x0000000000000000000000000000000000000000", // Not available on Base
    },
    decimals: 18,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    logo: "🟠",
    addresses: {
      arbitrum: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // WBTC on Arbitrum Sepolia
      base: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC on Base Sepolia (example)
    },
    decimals: 8,
  },
];

// Fonction pour obtenir un token par son symbole
export function getTokenBySymbol(symbol: string): Token | undefined {
  return SUPPORTED_TOKENS.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
}

// Fonction pour obtenir l'adresse d'un token sur une chaîne spécifique
export function getTokenAddress(symbol: string, chain: 'arbitrum' | 'base'): string | undefined {
  const token = getTokenBySymbol(symbol);
  if (!token) return undefined;
  
  const address = token.addresses[chain];
  return address !== "0x0000000000000000000000000000000000000000" ? address : undefined;
}

// Fonction pour obtenir les tokens disponibles sur une chaîne
export function getTokensForChain(chain: 'arbitrum' | 'base'): Token[] {
  return SUPPORTED_TOKENS.filter(token => 
    token.addresses[chain] !== "0x0000000000000000000000000000000000000000"
  );
} 