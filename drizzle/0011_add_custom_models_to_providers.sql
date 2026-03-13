-- 添加自定义模型列表字段（用于"其他"厂商）
ALTER TABLE ai_providers ADD COLUMN custom_models TEXT;

-- 添加自定义厂商名称字段（用于"其他"厂商）
ALTER TABLE ai_providers ADD COLUMN custom_provider_name TEXT;
