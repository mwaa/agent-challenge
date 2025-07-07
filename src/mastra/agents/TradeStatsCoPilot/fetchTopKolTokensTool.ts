import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { DuneClient } from "@duneanalytics/client-sdk";
import { memory } from "./memoryConfig.js";

interface KolTradeData {
  amount_usd: number;
  buy_time: string;
  contract_with_chart: string;
  kol_with_link: string;
  token_with_chart: string;
}

interface TokenAnalysis {
  tokenAddress: string;
  tokenName: string;
  uniqueKolCount: number;
  totalVolumeUsd: number;
  latestBuyTime: string;
  kolList: string[];
}

interface TopKolTokensResult {
  topTokens: TokenAnalysis[];
  fetchTimestamp: string;
  totalTokensAnalyzed: number;
  totalUniqueKols: number;
}

// Helper function to extract token address from HTML link
const extractTokenAddress = (htmlLink: string): string => {
  const match = htmlLink.match(/\/t\/([A-Za-z0-9]+)\//);
  return match ? match[1] : "";
};

// Helper function to extract token name from HTML link
const extractTokenName = (htmlLink: string): string => {
  const match = htmlLink.match(/>([^<]+)<\/a>/);
  return match ? match[1] : "";
};

// Helper function to extract KOL name from HTML link
const extractKolName = (htmlLink: string): string => {
  const match = htmlLink.match(/>([^<]+)<\/a>/);
  return match ? match[1] : "";
};

// Simple async function that fetches and analyzes KOL token trading data
const fetchTopKolTokens = async (minVolumeUsd: number = 1000) => {
  try {
    // Initialize Dune client
    const apiKey = process.env.DUNE_API_KEY || "";
    const dune = new DuneClient(apiKey);
    
    // Fetch data from Dune Analytics
    console.log("Fetching data from Dune Analytics...");
    const queryResult = await dune.getLatestResult({ queryId: 4832844 });
    
    if (!queryResult?.result?.rows) {
      throw new Error("No data received from Dune Analytics");
    }

    const rows = queryResult.result.rows as unknown as KolTradeData[];
    console.log(`Received ${rows.length} trade records`);

    // Group trades by token address
    const tokenMap = new Map<string, {
      tokenName: string;
      trades: KolTradeData[];
      kols: Set<string>;
      totalVolume: number;
      latestBuyTime: Date;
    }>();

    for (const row of rows) {
      // Skip rows without required data
      if (!row.token_with_chart || !row.amount_usd || !row.buy_time) {
        continue;
      }

      const tokenAddress = extractTokenAddress(row.token_with_chart);
      const tokenName = extractTokenName(row.token_with_chart);
      const kolName = extractKolName(row.kol_with_link || "Unknown");
      
      if (!tokenAddress) continue;

      if (!tokenMap.has(tokenAddress)) {
        tokenMap.set(tokenAddress, {
          tokenName,
          trades: [],
          kols: new Set(),
          totalVolume: 0,
          latestBuyTime: new Date(0)
        });
      }

      const tokenData = tokenMap.get(tokenAddress);
      if (!tokenData) continue;
      tokenData.trades.push(row);
      tokenData.kols.add(kolName);
      tokenData.totalVolume += row.amount_usd;
      
      const buyTime = new Date(row.buy_time);
      if (buyTime > tokenData.latestBuyTime) {
        tokenData.latestBuyTime = buyTime;
      }
    }

    // Convert to analysis format and filter by minimum volume
    const tokenAnalyses: TokenAnalysis[] = Array.from(tokenMap.entries())
      .filter(([_, data]) => data.totalVolume >= minVolumeUsd)
      .map(([tokenAddress, data]) => ({
        tokenAddress,
        tokenName: data.tokenName,
        uniqueKolCount: data.kols.size,
        totalVolumeUsd: Math.round(data.totalVolume * 100) / 100,
        latestBuyTime: data.latestBuyTime.toISOString(),
        kolList: Array.from(data.kols)
      }))
      .sort((a, b) => b.totalVolumeUsd - a.totalVolumeUsd); // Sort by volume descending

    const result: TopKolTokensResult = {
      topTokens: tokenAnalyses,
      fetchTimestamp: new Date().toISOString(),
      totalTokensAnalyzed: tokenAnalyses.length,
      totalUniqueKols: new Set(rows.map(r => extractKolName(r.kol_with_link || ""))).size
    };

    // Store results in memory using createThread and then store as messages
    
    // Create a thread for this analysis
    const thread = await memory.createThread({
      resourceId: "system",
      title: `KOL Tokens Analysis - ${new Date().toISOString()}`,
      metadata: {
        type: "kol_tokens_analysis",
        timestamp: result.fetchTimestamp,
        tokenCount: result.totalTokensAnalyzed,
        kolCount: result.totalUniqueKols
      }
    });

    console.log(`Analysis complete: ${result.totalTokensAnalyzed} tokens analyzed`);
    console.log(`Top 5 tokens by volume: ${result.topTokens.slice(0, 5).map(t => `${t.tokenName} ($${t.totalVolumeUsd})`).join(", ")}`);

    return {
      success: true,
      data: result,
      message: `Successfully analyzed ${result.totalTokensAnalyzed} tokens with ${result.totalUniqueKols} unique KOLs. Analysis stored in memory thread: ${thread.id}`
    };

  } catch (error) {
    console.error("Error fetching KOL tokens data:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

export const fetchTopKolTokensTool = createTool({
  id: "fetch_top_kol_tokens",
  description: "Fetches and analyzes top tokens traded by KOLs from Dune Analytics, extracting token addresses, calculating statistics, and storing results in memory",
  inputSchema: z.object({
    minVolumeUsd: z.number().optional().default(1000).describe("Minimum total volume in USD to include a token in results (default: 100)")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      topTokens: z.array(z.object({
        tokenAddress: z.string(),
        tokenName: z.string(),
        uniqueKolCount: z.number(),
        totalVolumeUsd: z.number(),
        latestBuyTime: z.string(),
        kolList: z.array(z.string())
      })),
      fetchTimestamp: z.string(),
      totalTokensAnalyzed: z.number(),
      totalUniqueKols: z.number()
    }).nullable(),
    message: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await fetchTopKolTokens(context.minVolumeUsd);
  }
});
