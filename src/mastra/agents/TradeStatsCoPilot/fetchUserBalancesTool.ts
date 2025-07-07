import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { userDataStore } from "./userDataStore";

// Define balance info type
interface BalanceInfo {
  amount: string;
  uiAmount: number;
  slot: number;
  isFrozen: boolean;
}

// Function to fetch token data directly
const getTokenData = async (tokenAddress: string) => {
  try {
   const response = await fetch(`https://lite-api.jup.ag/ultra/v1/search?query=${tokenAddress}`);
   const data = await response.json();

   if (!response.ok || !data || !data[0]) {
     return null;
   }

   return data[0]; // Assuming the first item is the relevant token data

  } catch (_) {
    return null;
  }
}

// Function to fetch user balances and automatically track tokens
const fetchUserBalances = async (userAddress: string) => {
  try {
    const response = await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${userAddress}`);
    
    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch balances for address ${userAddress}`,
        userData: { trackedTokens: [] }
      };
    }

    const balances = await response.json() as Record<string, BalanceInfo>;
    
    // Get existing user data or create new
    const existingData = userDataStore.get(userAddress) || { trackedTokens: [] };
    
    // Track each token found in balances
    const trackedTokens = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const [tokenAddress, balanceInfo] of Object.entries(balances)) {
      try {
        // Check if token is already being tracked
        const existingToken = existingData.trackedTokens?.find(token => token.address === tokenAddress);
        
        if (existingToken) {
          // Update existing token with balance info - create new object to include balance
          const updatedToken = {
            ...existingToken,
            balance: balanceInfo.uiAmount
          };
          trackedTokens.push(updatedToken);
          processedCount++;
          continue;
        }

        // Fetch token data for new tokens
        let tokenData = null;
        let tokenName = tokenAddress;
        
        // Handle SOL specially
        if (tokenAddress === "SOL") {
          tokenData = {
            name: "Solana",
            stats1h: {
              priceChange: 0,
              holderChange: 0,
              liquidityChange: 0,
              buyVolume: 0,
              sellVolume: 0,
              buyOrganicVolume: 0,
              sellOrganicVolume: 0,
              numBuys: 0,
              numSells: 0,
              numTraders: 0,
              numNetBuyers: 0
            }
          };
          tokenName = "Solana";
        } else {
          tokenData = await getTokenData(tokenAddress);
          if (tokenData?.name) {
            tokenName = tokenData.name;
          }
        }

        // Create token entry with balance
        const newTokenData = {
          address: tokenAddress,
          name: tokenName,
          balance: balanceInfo.uiAmount,
          stats1h: tokenData?.stats1h || {
            priceChange: 0,
            holderChange: 0,
            liquidityChange: 0,
            buyVolume: 0,
            sellVolume: 0,
            buyOrganicVolume: 0,
            sellOrganicVolume: 0,
            numBuys: 0,
            numSells: 0,
            numTraders: 0,
            numNetBuyers: 0
          }
        };

        trackedTokens.push(newTokenData);
        processedCount++;
        
      } catch (error) {
        errorCount++;
        console.error(`Error processing token ${tokenAddress}:`, error);
      }
    }

    // Update user data store
    existingData.trackedTokens = trackedTokens;
    userDataStore.set(userAddress, existingData);

    return {
      success: true,
      message: `Successfully processed ${processedCount} tokens from your wallet balances${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
      userData: { trackedTokens }
    };

  } catch (error) {
    return {
      success: false,
      message: `Error fetching user balances: ${error instanceof Error ? error.message : 'Unknown error'}`,
      userData: { trackedTokens: [] }
    };
  }
};

export const fetchUserBalancesTool = createTool({
  id: "fetch-user-balances",
  description: "Fetch user's token balances and automatically track all held tokens with their balance amounts",
  inputSchema: z.object({
    userAddress: z.string().describe("User's wallet address")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    userData: z.object({
      trackedTokens: z.array(z.object({
        address: z.string(),
        name: z.string(),
        balance: z.number().optional(),
        stats1h: z.object({
          priceChange: z.number(),
          holderChange: z.number(),
          liquidityChange: z.number(),
          buyVolume: z.number(),
          sellVolume: z.number(),
          buyOrganicVolume: z.number(),
          sellOrganicVolume: z.number(),
          numBuys: z.number(),
          numSells: z.number(),
          numTraders: z.number(),
          numNetBuyers: z.number()
        })
      }))
    })
  }),
  execute: async ({ context }) => {
    return await fetchUserBalances(context.userAddress);
  },
});
