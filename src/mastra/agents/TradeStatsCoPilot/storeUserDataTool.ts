import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { userDataStore } from "./userDataStore";

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

const storeData = async (userAddress: string, tokenAddress: string, action: "addToken" | "removeToken") => {
    // Get existing user data or create new
    const existingData = userDataStore.get(userAddress) || { trackedTokens: [] };

    try {
      switch (action) {
        case "addToken": {
          if (!existingData.trackedTokens) {
            existingData.trackedTokens = [];
          }
          
          // Check if token is already being tracked
          const existingToken = existingData.trackedTokens.find(token => token.address === tokenAddress);
          if (existingToken) {
            return {
              success: true,
              message: `Token ${tokenAddress} is already being tracked`,
              userData: { trackedTokens: existingData.trackedTokens }
            };
          }
          
          // Fetch token data
          const tokenDataResult = await getTokenData(tokenAddress);

          console.log("\nwe got here", tokenDataResult.id);
          
          if (!tokenDataResult || !tokenDataResult.id) {
            return {
              success: false,
              message: `Failed to fetch data for token ${tokenAddress}`,
              userData: { trackedTokens: existingData.trackedTokens || [] }
            };
          }
          
          // Store token with address, name, and stats1h
          const tokenData = {
            address: tokenAddress,
            name: tokenDataResult.name,
            stats1h: tokenDataResult.stats1h
          };
          
          existingData.trackedTokens.push(tokenData);
          userDataStore.set(userAddress, existingData);
          
          return {
            success: true,
            message: `Token ${tokenDataResult.name} (${tokenAddress}) has been added to tracking list`,
            userData: { trackedTokens: existingData.trackedTokens }
          };
        }
          
        case "removeToken": {
          if (existingData.trackedTokens) {
            const index = existingData.trackedTokens.findIndex(token => token.address === tokenAddress);
            if (index > -1) {
              const removedToken = existingData.trackedTokens[index];
              existingData.trackedTokens.splice(index, 1);
              userDataStore.set(userAddress, existingData);
              return {
                success: true,
                message: `Token ${removedToken.name} (${tokenAddress}) has been removed from tracking list`,
                userData: { trackedTokens: existingData.trackedTokens }
              };
            }
          }
          return {
            success: true,
            message: `Token ${tokenAddress} was not in tracking list`,
            userData: { trackedTokens: existingData.trackedTokens || [] }
          };
        }
          
        default:
          return {
            success: false,
            message: "Invalid action specified",
            userData: { trackedTokens: existingData.trackedTokens || [] }
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error storing user data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        userData: { trackedTokens: existingData.trackedTokens || [] }
      };
    }
}

export const storeUserDataTool = createTool({
  id: "store-user-data",
  description: "Store tracked token data (address, name, and stats1h) in memory",
  inputSchema: z.object({
    userAddress: z.string().describe("User's wallet address or unique identifier"),
    tokenAddress: z.string().describe("Token address to add to tracking list"),
    action: z.enum(["addToken", "removeToken"]).describe("Action to perform")
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
    return await storeData(context.userAddress, context.tokenAddress, context.action);
  },
});
