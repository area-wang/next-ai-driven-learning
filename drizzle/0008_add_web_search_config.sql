-- 添加联网搜索配置字段到 users 表
ALTER TABLE users ADD COLUMN search_result_count INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN search_language TEXT DEFAULT 'auto';
