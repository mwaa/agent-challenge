import { createTool } from "@mastra/core/tools";
import { z } from "zod";

interface TokenStats {
  priceChange: number,
  holderChange: number,
  liquidityChange: number,
  buyVolume: number,
  sellVolume: number,
  buyOrganicVolume: number,
  sellOrganicVolume: number,
  numBuys: number,
  numSells: number,
  numTraders: number,
  numNetBuyers: number
}

interface TokenPriceResponse {
    id:  string,
    name: string,
    symbol: string,
    twitter: string,
    website: string,
    dev: string,
    totalSupply: number,
    launchpad: string,
    holderCount: number,
    organicScoreLabel: string,
    mcap: number,
    usdPrice: number,
    liquidity: number,
    stats1h: TokenStats,
    stats6h: TokenStats,
    stats24h: TokenStats,
}

// Simple async function that conforms to input and output schema
const getTokenData = async (tokenAddress: string) => {
  try {
   const response = await fetch(`https://lite-api.jup.ag/ultra/v1/search?query=${tokenAddress}`);

   const data = await response.json();
   if (!response.ok || !data) {
     return {
       data: {} as TokenPriceResponse
     };
   }

   return {
      data: data[0] as TokenPriceResponse
   }
  } catch (_) {
    return {
      data: {} as TokenPriceResponse
    }
  }
}

// Define your tool using the `createTool`
export const getTokenDataTool = createTool({
  id: "get-token-data",
  description: "Fetch the current trade data of a token",
  inputSchema: z.object({
    tokenAddress: z.string().describe("Token address"),
  }),
  outputSchema: z.object({
    data: z.object({
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
      twitter: z.string(),
      website: z.string(),
      dev: z.string(),
      totalSupply: z.number(),
      launchpad: z.string(),
      holderCount: z.number(),
      organicScoreLabel: z.string(),
      mcap: z.number(),
      usdPrice: z.number(),
      liquidity: z.number(),
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
      }),
      stats6h: z.object({
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
      }),
      stats24h: z.object({
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
    }),
  }),
  execute: async ({ context }) => {
    return await getTokenData(context.tokenAddress);
  },
});
