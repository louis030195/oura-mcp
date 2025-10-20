# @louis030195/oura-mcp

Dead simple MCP (Model Context Protocol) server for Oura Ring. Get your sleep, readiness, and activity data directly from Claude, ChatGPT, or any LLM that supports MCP.

---

<div align="center">

### 💖 Support This Project

**If you find this MCP server useful, please consider supporting its development!**

[![Support via Stripe](https://img.shields.io/badge/Support-Stripe-635bff?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/5kQ14n1j3a347Q59a8gA803)

[**👉 Click here to support this project**](https://buy.stripe.com/5kQ14n1j3a347Q59a8gA803)

*Your support helps maintain and improve this tool. Thank you!* 🙏

</div>

---

## Features

- 😴 Sleep data (score, REM, deep, light sleep stages)
- ⚡ Readiness score (HRV, resting HR, body temperature)
- 🏃 Activity data (steps, calories, activity score)
- ❤️ Heart rate monitoring

## Installation

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "oura": {
      "command": "npx",
      "args": ["-y", "@louis030195/oura-mcp"],
      "env": {
        "OURA_API_KEY": "your-oura-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
# Install globally in user scope with API key
claude mcp add -s user oura npx -e OURA_API_KEY=your-oura-api-key -- -y @louis030195/oura-mcp
```

## Get Your Oura API Key

1. Go to [Oura Personal Access Tokens](https://cloud.ouraring.com/personal-access-tokens)
2. Click "Create New Personal Access Token"
3. Copy your token (starts with something like `4SKHEL...`)

## Usage

Once configured, you can use natural language to access your Oura data:

- "How did I sleep last night?"
- "Show me my sleep data for the past week"
- "What's my readiness score today?"
- "How many steps did I take yesterday?"
- "Show my heart rate data from last week"

## Tools

### `oura_sleep`
Get daily sleep data including sleep score, sleep stages (REM, deep, light), efficiency, and timing.

**Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

### `oura_readiness`
Get daily readiness score, HRV balance, resting heart rate, and body temperature deviation.

**Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

### `oura_activity`
Get daily activity data including steps, calories burned, and activity score.

**Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

### `oura_heartrate`
Get heart rate data over time.

**Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

## Development

```bash
# Clone the repo
git clone https://github.com/louis030195/oura-mcp.git
cd oura-mcp

# Install dependencies
npm install

# Build
npm run build

# Run locally
OURA_API_KEY=your-api-key npm start
```

## License

MIT

## Author

[Louis Beaumont](https://twitter.com/louis030195)
