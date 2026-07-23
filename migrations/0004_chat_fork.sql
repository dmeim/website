-- Optional lineage for forked / edit-branched chats.
ALTER TABLE chats ADD COLUMN forked_from_chat_id TEXT;
ALTER TABLE chats ADD COLUMN forked_from_message_id TEXT;
