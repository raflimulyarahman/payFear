#!/bin/bash

# setup-mcp.sh - Automated registration for Base MCP servers

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛡️ Starting Base MCP Setup...${NC}"

# Check for Claude Code
if command -v claude &> /dev/null; then
    echo -e "${GREEN}✅ Claude Code detected. Adding servers...${NC}"
    
    # Add Base Docs
    echo "Adding Base Docs MCP..."
    claude mcp add --transport http base-docs https://docs.base.org/mcp
    
    # Add Base Onchain
    echo "Adding Base Onchain MCP..."
    claude mcp add @base-org/base-mcp
else
    echo -e "⚠️ ${BLUE}Claude Code CLI not found.${NC}"
fi

echo -e "\n${BLUE}📍 Manual Configuration (Cursor/Claude Desktop):${NC}"
echo -e "Use the following URL for Documentation:"
echo -e "${GREEN}https://docs.base.org/mcp${NC}"
echo -e "\nUse the following command for Onchain tools:"
echo -e "${GREEN}npx -y @base-org/base-mcp${NC}"

echo -e "\n${GREEN}✨ Setup instructions complete.${NC}"
