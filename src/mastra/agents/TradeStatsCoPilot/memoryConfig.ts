import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

// Create memory instance for the agent
export const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:./memory.db", // Local SQLite database file
  }),
  options: {
    workingMemory: {
      enabled: true,
      template: `
      # User Profile
      - **Name**: 
      - **Public Wallet Address**:
      - **Trade Interests**: 
      - **Current Trade Goal**: 
      `,
    },
  },
});
