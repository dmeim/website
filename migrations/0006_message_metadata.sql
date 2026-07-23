-- Persist generation usage/performance JSON on assistant messages.
ALTER TABLE messages ADD COLUMN metadata TEXT;
