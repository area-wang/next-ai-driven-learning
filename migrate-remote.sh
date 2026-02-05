#!/bin/bash

# 迁移所有数据库脚本到远程 Cloudflare D1
# 使用方法: bash migrate-remote.sh

DATABASE_NAME="ai-learning-platform"
MIGRATION_DIR="./drizzle"

echo "🚀 开始迁移数据库到远程..."
echo "数据库名称: $DATABASE_NAME"
echo ""

# 获取所有 SQL 迁移文件（按顺序）
MIGRATION_FILES=(
  "0000_young_richard_fisk.sql"
  "0001_amusing_wallow.sql"
  "0002_chubby_quasar.sql"
  "0003_certain_invisible_woman.sql"
  "0004_amazing_patch.sql"
  "0005_fancy_thing.sql"
  "0006_add_config_mode.sql"
  "0007_add_config_mode_to_ai_models.sql"
  "0008_add_web_search_config.sql"
  "0009_add_tavily_api_key.sql"
)

# 执行每个迁移文件
for file in "${MIGRATION_FILES[@]}"; do
  filepath="$MIGRATION_DIR/$file"
  
  if [ -f "$filepath" ]; then
    echo "📝 执行迁移: $file"
    wrangler d1 execute $DATABASE_NAME --remote --file="$filepath"
    
    if [ $? -eq 0 ]; then
      echo "✅ $file 迁移成功"
    else
      echo "❌ $file 迁移失败"
      exit 1
    fi
    echo ""
  else
    echo "⚠️  文件不存在: $filepath"
    echo ""
  fi
done

echo "🎉 所有迁移已完成！"
