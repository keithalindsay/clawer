#!/bin/bash
# Test script for AI Team Dashboard APIs
# Run after database migration

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3000/api"
# Replace with a valid Clerk session token
AUTH_TOKEN="${CLERK_TOKEN:-your-clerk-session-token-here}"

echo -e "${BLUE}=== AI Team Dashboard API Tests ===${NC}\n"

# Test 1: Get current team
echo -e "${GREEN}1. GET /api/teams/current${NC}"
curl -s -X GET \
  "${API_BASE}/teams/current" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.' | head -20
echo -e "\n"

# Test 2: Get researcher thread (Scout)
echo -e "${GREEN}2. GET /api/agents/researcher/thread${NC}"
curl -s -X GET \
  "${API_BASE}/agents/researcher/thread" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.' | head -30
echo -e "\n"

# Test 3: Chat without agent (backward compat)
echo -e "${GREEN}3. POST /api/chat (no agentId - backward compatible)${NC}"
curl -s -X POST \
  "${API_BASE}/chat" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!"
  }' \
  | jq '.'
echo -e "\n"

# Test 4: Chat with agent
echo -e "${GREEN}4. POST /api/chat (with agentId=researcher)${NC}"
curl -s -X POST \
  "${API_BASE}/chat" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the best email marketing tools?",
    "agentId": "researcher"
  }' \
  | jq '.'
echo -e "\n"

# Test 5: Get different agent thread
echo -e "${GREEN}5. GET /api/agents/executor/thread${NC}"
curl -s -X GET \
  "${API_BASE}/agents/executor/thread" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.thread' | head -20
echo -e "\n"

# Test 6: Invalid agent (should 404)
echo -e "${GREEN}6. GET /api/agents/invalid-agent/thread (should error)${NC}"
curl -s -X GET \
  "${API_BASE}/agents/invalid-agent/thread" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo -e "\n"

echo -e "${BLUE}=== Tests Complete ===${NC}"
echo -e "\nTo use this script:"
echo -e "1. Export your Clerk token: ${RED}export CLERK_TOKEN='your-token'${NC}"
echo -e "2. Run: ${RED}bash TEST-AGENT-APIS.sh${NC}"
