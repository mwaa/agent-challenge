import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { userDataStore } from "./userDataStore";

export const getUserDataTool = createTool({
  id: "get-user-data",
  description: "Retrieve stored user data including tracked token data",
  inputSchema: z.object({
    userId: z.string().describe("Unique identifier for the user")
  }),
  outputSchema: z.object({
    success: z.boolean(),
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
      })),
      hasData: z.boolean()
    })
  }),
  execute: async ({ context }) => {
    const { userId } = context;
    
    try {
      const userData = userDataStore.get(userId);
      
      if (!userData) {
        return {
          success: true,
          userData: {
            hasData: false,
            trackedTokens: []
          }
        };
      }
      
      return {
        success: true,
        userData: {
          trackedTokens: userData.trackedTokens || [],
          hasData: !!(userData.trackedTokens && userData.trackedTokens.length > 0)
        }
      };
    } catch {
      return {
        success: false,
        userData: {
          hasData: false,
          trackedTokens: []
        }
      };
    }
  },
});
