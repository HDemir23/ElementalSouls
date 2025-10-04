-- Elemental Souls Database Schema (imported from src/db/schema.sql)
-- This migration reproduces the existing SQL schema so Prisma migrations align
-- with the current database structure.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    token_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_address ON users(address);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('social', 'onchain', 'quest')),
    required_level SMALLINT NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('manual', 'auto', 'signature')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_level ON tasks(required_level);
CREATE INDEX idx_tasks_active ON tasks(is_active);

-- Task completions table
CREATE TABLE IF NOT EXISTS task_completions (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    token_id INTEGER NOT NULL,
    proof JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by VARCHAR(42),
    UNIQUE(user_address, task_id, token_id)
);

CREATE INDEX idx_completions_user ON task_completions(user_address);
CREATE INDEX idx_completions_status ON task_completions(status);
CREATE INDEX idx_completions_token ON task_completions(token_id);

-- Evolution history table (partitioned by month for scalability)
CREATE TABLE IF NOT EXISTS evolution_history (
    id SERIAL PRIMARY KEY,
    token_id INTEGER NOT NULL,
    from_level SMALLINT NOT NULL,
    to_level SMALLINT NOT NULL,
    metadata_uri TEXT NOT NULL,
    image_uri TEXT NOT NULL,
    tx_hash VARCHAR(66),
    evolved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evolution_token ON evolution_history(token_id);
CREATE INDEX idx_evolution_date ON evolution_history(evolved_at);

-- Pending signatures table
CREATE TABLE IF NOT EXISTS pending_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    token_id INTEGER NOT NULL,
    permit_hash VARCHAR(66) NOT NULL,
    signature TEXT NOT NULL,
    deadline BIGINT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pending_sigs_unused ON pending_signatures(is_used) WHERE is_used = false;
CREATE INDEX idx_pending_sigs_deadline ON pending_signatures(deadline);

-- NFT cache table (for faster lookups)
CREATE TABLE IF NOT EXISTS nft_cache (
    token_id INTEGER PRIMARY KEY,
    owner VARCHAR(42) NOT NULL,
    element SMALLINT NOT NULL,
    level SMALLINT NOT NULL,
    nonce INTEGER NOT NULL,
    metadata_uri TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nft_owner ON nft_cache(owner);
CREATE INDEX idx_nft_level ON nft_cache(level);

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE address = NEW.user_address;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_active
CREATE TRIGGER trigger_update_last_active
AFTER INSERT ON task_completions
FOR EACH ROW
EXECUTE FUNCTION update_last_active();