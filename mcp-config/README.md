# 🛡️ Base MCP Configuration

This directory contains the configurations for connecting your AI assistant (Antigravity, Cursor, Claude Code) to **Base**.

## 🚀 Available Servers

1.  **Base Docs (`base-docs`)**: Real-time access to the latest Base documentation.
2.  **Base Onchain (`base-onchain`)**: Tools for wallet management, smart contract deployment, and on-chain interactions.

## 🛠️ Setup Instructions

### For Antigravity (Current AI)
I am already configured to help you! You can ask me to:
- "Check the Base docs for how to deploy an escrow contract."
- "What are the latest Base L2 gas fees?"

### For Cursor
1.  Open **Cursor Settings** (Cmd+Shift+J or Ctrl+Shift+J).
2.  Navigate to **MCP Servers**.
3.  Add a new server:
    - **Name**: `base-docs`
    - **Type**: `SSE`
    - **URL**: `https://docs.base.org/mcp`
4.  (Optional) Add `base-onchain`:
    - **Name**: `base-onchain`
    - **Type**: `command`
    - **Command**: `npx -y @base-org/base-mcp`

### For Claude Code
Run the setup script included in the root of this project:
```bash
./setup-mcp.sh
```
Or manually:
```bash
claude mcp add --transport http base-docs https://docs.base.org/mcp
claude mcp add @base-org/base-mcp
```

## 📄 Files
- `mcp.json`: Standard JSON configuration for MCP-compliant tools.
- `setup-mcp.sh`: Automation script for registration.
