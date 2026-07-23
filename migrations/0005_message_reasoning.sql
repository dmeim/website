-- Persist model chain-of-thought / reasoning alongside assistant replies.
ALTER TABLE messages ADD COLUMN reasoning TEXT;
