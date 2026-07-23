-- Track in-flight generation so clients can show status after navigate-away.
ALTER TABLE chats ADD COLUMN generating_at TEXT;
