-- 为 ai_providers 表添加 message_format 字段
-- 用于"其他"厂商选择使用 OpenAI 还是 Anthropic 消息格式

ALTER TABLE ai_providers ADD COLUMN message_format TEXT DEFAULT 'openai';
