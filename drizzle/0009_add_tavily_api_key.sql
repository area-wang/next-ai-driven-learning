-- 添加 Tavily API Key 字段到 users 表
ALTER TABLE users ADD COLUMN tavily_api_key TEXT;
