# Trade Stats Co-Pilot Agent

![Agent-101](./assets/trade_stats_co.png)

## Quick Links

- **Video Demo**: [Link to Video Demo]
- **Twitter/X Post**: [Link to Twitter/X Post]
- **Nosana Job ID**: [Link to Host Address]
- **Nosana Deployment Link**: [Link to Host Address]

## Agent Description and Purpose

The Trade Stats Co-Pilot is a friendly and supportive assistant designed to help users navigate the world of meme-coin trading on pump.fun. Its goal is to provide clear data and educational insights, not financial advice.

The agent helps users by:
- Setting up a user profile (name, public wallet address, trading goals).
- Fetching and tracking token balances from a user's wallet.
- Tracking specific tokens of interest.
- Providing real-time statistics for tokens.
- Analyzing and showing what Key Opinion Leaders (KOLs) are trading.
- Reminding users about trading risks and security best practices.

This project was built for the [Nosana Builders Challenge: Agent-101](https://earn.superteam.fun/agent-challenge).


## Example Usage

Once the agent is running, you can interact with it through the Mastra playground at `http://localhost:8080`.

1.  **Start a conversation:**
    -   **User:** "Hello"
    -   **Agent:** "Hello! I'm the Trade Stats Co-Pilot, your friendly assistant for navigating meme-coin trading on pump.fun. To get started, could you please tell me your name and public wallet address?"

2.  **Fetch wallet balances:**
    -   **User:** "My wallet address is `5c5243NRB...`"
    -   **Agent:** "Thanks! Would you like me to fetch your current token balances?"

3.  **Track a token:**
    -   **User:** "Please track this token for me: `CA...`"
    -   **Agent:** "I've started tracking the token with address `CA...`. I can provide you with its latest stats whenever you ask."

4.  **Get KOL insights:**
    -   **User:** "What are the top KOLs trading right now?"
    -   **Agent:** "I can fetch the latest data on tokens being traded by Key Opinion Leaders. This is for informational purposes only and not a trading recommendation. Should I proceed?"

5.  **Compare KOL tokens:**
    -   **User:** "How do the top two tokens traded by KOLs compare?"
    -   **Agent:** "Let me check. Token `ABC...` has increased by 15% in the last hour, while `XYZ...` has seen a 10% increase. Based on recent performance, `ABC...` is doing better. Remember, this is not financial advice."

## Setup Instructions

To get started with the agent locally, follow these steps. We recommend using [pnpm](https://pnpm.io/installation).

1.  **Clone the repository:**
    ```sh
    git clone <your-repo-url>
    cd agent-challenge
    ```

2.  **Install dependencies:**
    ```sh
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the `.env.example` file to a new file named `.env` and fill in the required values.
    ```sh
    cp .env.example .env
    ```
    See the [Environment Variables](#environment-variables) section for more details.

4.  **Run the development server:**
    This will start the Mastra playground on `http://localhost:8080`.
    ```sh
    pnpm run dev
    ```

5.  **Run a local LLM with Ollama (Optional):**
    The agent is configured to use a local Ollama instance by default.
    - [Install Ollama](https://ollama.com/download)
    - Pull the required model: `ollama pull qwen2.5:1.5b`
    - Start the Ollama service: `ollama serve`

## Environment Variables

The following environment variables are required. Create a `.env` file based on `.env.example`.

-   `DUNE_API_KEY`: Your API key for Dune Analytics. Required for fetching KOL trading data.
-   `MODEL_NAME_AT_ENDPOINT`: The name of the Ollama model to use (e.g., `qwen2.5:1.5b`).
-   `API_BASE_URL`: The base URL for the Ollama API (e.g., `http://127.0.0.1:11434/api`).

## Docker Build and Run Commands

You can build and run this agent as a Docker container.

1.  **Build the Docker image:**
    Replace `yourusername` with your Docker Hub username.
    ```sh
    docker build -t yourusername/agent-challenge:latest .
    ```

2.  **Run the container locally:**
    The agent will be accessible at `http://localhost:8080`.
    ```sh
    docker run -p 8080:8080 yourusername/agent-challenge:latest
    ```

3.  **Publish the image to Docker Hub:**
    ```sh
    docker login
    docker push yourusername/agent-challenge:latest
    ```