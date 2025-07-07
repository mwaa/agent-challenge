import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { memory } from "./memoryConfig.js";

// Simple async function that retrieves KOL token analysis from memory
const getKolTokensAnalysis = async (limit: number = 10) => {
  try {
    // Get all threads created by the system for KOL analysis
    const threads = await memory.getThreadsByResourceId({ resourceId: "system" });
    
    if (!threads || threads.length === 0) {
      return {
        success: false,
        data: null,
        message: "No KOL tokens analysis found in memory. Use fetchTopKolTokensTool first to analyze data."
      };
    }

    // Filter threads that contain KOL analysis and sort by most recent
    const kolAnalysisThreads = threads
      .filter(thread => thread.metadata?.type === "kol_tokens_analysis")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (kolAnalysisThreads.length === 0) {
      return {
        success: false,
        data: null,
        message: "No KOL tokens analysis found. Use fetchTopKolTokensTool first to analyze data."
      };
    }

    // Get the most recent analysis thread
    const latestThread = kolAnalysisThreads[0];
    
    if (!latestThread.id) {
      return {
        success: false,
        data: null,
        message: "Latest analysis thread does not have a valid ID."
      };
    }

    // Extract analysis data from thread metadata and title
    const analysisInfo = {
      threadId: latestThread.id,
      title: latestThread.title || null,
      timestamp: latestThread.metadata?.timestamp as string | undefined,
      tokenCount: latestThread.metadata?.tokenCount as number | undefined,
      kolCount: latestThread.metadata?.kolCount as number | undefined,
      createdAt: latestThread.createdAt,
      availableAnalyses: kolAnalysisThreads.length
    };

    return {
      success: true,
      data: {
        latestAnalysis: analysisInfo,
        totalAnalyses: kolAnalysisThreads.length,
        allAnalyses: kolAnalysisThreads.slice(0, limit).map(thread => ({
          threadId: thread.id || "",
          title: thread.title || null,
          timestamp: thread.metadata?.timestamp as string | undefined,
          tokenCount: thread.metadata?.tokenCount as number | undefined,
          kolCount: thread.metadata?.kolCount as number | undefined,
          createdAt: thread.createdAt
        }))
      },
      message: `Found ${kolAnalysisThreads.length} KOL token analyses. Latest analysis contains ${analysisInfo.tokenCount} tokens and ${analysisInfo.kolCount} KOLs.`
    };

  } catch (error) {
    console.error("Error retrieving KOL tokens analysis:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

export const getKolTokensAnalysisTool = createTool({
  id: "get_kol_tokens_analysis",
  description: "Retrieves previously stored KOL tokens analysis data from memory",
  inputSchema: z.object({
    limit: z.number().optional().default(10).describe("Maximum number of analysis records to return (default: 10)")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      latestAnalysis: z.object({
        threadId: z.string(),
        title: z.string().nullable(),
        timestamp: z.string().optional(),
        tokenCount: z.number().optional(),
        kolCount: z.number().optional(),
        createdAt: z.date(),
        availableAnalyses: z.number()
      }),
      totalAnalyses: z.number(),
      allAnalyses: z.array(z.object({
        threadId: z.string(),
        title: z.string().nullable(),
        timestamp: z.string().optional(),
        tokenCount: z.number().optional(),
        kolCount: z.number().optional(),
        createdAt: z.date()
      }))
    }).nullable(),
    message: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await getKolTokensAnalysis(context.limit);
  }
});
