#!/bin/bash

# 测试 DeepSeek API
echo "Testing DeepSeek API..."
echo ""

# 从 .dev.vars 读取 API Key
DEEPSEEK_API_KEY=$(grep DEEPSEEK_API_KEY .dev.vars | cut -d '=' -f2)

curl -X POST http://localhost:8788/api/test-deepseek \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"$DEEPSEEK_API_KEY\"}" \
  | jq .

echo ""
echo "Test completed!"
