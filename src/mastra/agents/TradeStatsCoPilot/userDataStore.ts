// Shared in-memory storage for user data
// In production, this would be a database
interface TokenData {
  address: string;
  name: string;
  stats1h: {
    priceChange: number;
    holderChange: number;
    liquidityChange: number;
    buyVolume: number;
    sellVolume: number;
    buyOrganicVolume: number;
    sellOrganicVolume: number;
    numBuys: number;
    numSells: number;
    numTraders: number;
    numNetBuyers: number;
  };
}

export const userDataStore = new Map<string, {
  trackedTokens?: TokenData[];
}>();
