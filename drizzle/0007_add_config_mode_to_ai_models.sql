-- 为 ai_models 表添加 config_mode 字段
ALTER TABLE ai_models ADD COLUMN config_mode TEXT DEFAULT 'openrouter';

-- 更新现有记录的 config_mode
-- 如果 modelId 包含 '/'，则为 openrouter 模式
-- 否则为 independent 模式
UPDATE ai_models 
SET config_mode = CASE 
  WHEN model_id LIKE '%/%' THEN 'openrouter'
  ELSE 'independent'
END;
