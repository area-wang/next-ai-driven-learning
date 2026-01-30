#!/usr/bin/env node

/**
 * 迁移所有数据库脚本到远程 Cloudflare D1
 * 使用方法: node migrate-remote.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATABASE_NAME = 'ai-learning-platform';
const MIGRATION_DIR = './drizzle';

const MIGRATION_FILES = [
  '0000_young_richard_fisk.sql',
  '0001_amusing_wallow.sql',
  '0002_chubby_quasar.sql',
  '0003_certain_invisible_woman.sql',
  '0004_amazing_patch.sql',
  '0005_fancy_thing.sql',
  '0006_add_config_mode.sql',
  '0007_add_config_mode_to_ai_models.sql',
];

console.log('🚀 开始迁移数据库到远程...');
console.log(`数据库名称: ${DATABASE_NAME}`);
console.log('');

let successCount = 0;
let failCount = 0;

for (const file of MIGRATION_FILES) {
  const filepath = path.join(MIGRATION_DIR, file);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  文件不存在: ${filepath}`);
    console.log('');
    continue;
  }
  
  console.log(`📝 执行迁移: ${file}`);
  
  try {
    execSync(
      `wrangler d1 execute ${DATABASE_NAME} --remote --file="${filepath}"`,
      { stdio: 'inherit' }
    );
    console.log(`✅ ${file} 迁移成功`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${file} 迁移失败`);
    failCount++;
    // 继续执行其他迁移，不中断
  }
  
  console.log('');
}

console.log('📊 迁移统计:');
console.log(`   成功: ${successCount}`);
console.log(`   失败: ${failCount}`);
console.log(`   总计: ${MIGRATION_FILES.length}`);
console.log('');

if (failCount === 0) {
  console.log('🎉 所有迁移已完成！');
  process.exit(0);
} else {
  console.log('⚠️  部分迁移失败，请检查错误信息');
  process.exit(1);
}
