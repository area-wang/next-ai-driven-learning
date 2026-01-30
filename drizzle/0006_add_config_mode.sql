-- 添加配置模式字段到用户表
-- 用于标识用户选择使用 OpenRouter 还是独立厂商配置

-- 创建配置模式枚举类型（SQLite 使用 TEXT CHECK）
-- 'openrouter': 使用 OpenRouter 统一配置
-- 'independent': 使用独立厂商配置

-- 添加配置模式字段
ALTER TABLE users ADD COLUMN config_mode TEXT DEFAULT 'openrouter' CHECK(config_mode IN ('openrouter', 'independent'));

-- 为 ai_providers 表添加选中的模型列表字段
ALTER TABLE ai_providers ADD COLUMN selected_models TEXT; -- JSON 数组，存储该厂商选中的模型 ID
