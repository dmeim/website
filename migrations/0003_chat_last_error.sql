-- Persist last generation error for retry / rate-limit surfacing.
ALTER TABLE chats ADD COLUMN last_error TEXT;
