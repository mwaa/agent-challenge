import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { TradeStatsCoPilotAgent } from "./agents/TradeStatsCoPilot/tradeStatsCoPilotAgent"; // Build your agent here

export const mastra = new Mastra({
	agents: { tradeStatsCoPilot: TradeStatsCoPilotAgent },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
});
