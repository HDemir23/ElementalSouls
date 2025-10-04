-- Seed data for tasks

-- Level 0 → 1 (Starter Tasks)
INSERT INTO tasks (id, name, description, category, required_level, points, verification_type, is_active) VALUES
('follow-twitter', 'Follow @ElementalSouls', 'Follow our official Twitter account and stay updated with the latest news', 'social', 0, 10, 'manual', true),
('join-discord', 'Join Discord Server', 'Join our community Discord server and introduce yourself', 'social', 0, 10, 'auto', true),
('complete-tutorial', 'Complete Tutorial', 'Learn how to evolve your elemental soul through our interactive tutorial', 'quest', 0, 20, 'auto', true);

-- Level 1 → 2
INSERT INTO tasks (id, name, description, category, required_level, points, verification_type, is_active) VALUES
('first-swap', 'Make Your First Swap', 'Perform your first token swap on MonadSwap DEX', 'onchain', 1, 30, 'auto', true),
('retweet-launch', 'Retweet Launch Post', 'Share our launch announcement with your followers', 'social', 1, 15, 'manual', true),
('add-liquidity-small', 'Provide Liquidity (Starter)', 'Add at least $10 worth of liquidity to any pool', 'onchain', 1, 25, 'auto', true),
('invite-friend', 'Invite a Friend', 'Share your referral link and get 1 friend to mint', 'quest', 1, 20, 'auto', true),
('explore-dapp', 'Explore a dApp', 'Interact with any dApp on Monad network', 'onchain', 1, 15, 'auto', true);

-- Level 2 → 3
INSERT INTO tasks (id, name, description, category, required_level, points, verification_type, is_active) VALUES
('provide-liquidity', 'Become a Liquidity Provider', 'Add at least $50 worth of liquidity to earn fees', 'onchain', 2, 50, 'auto', true),
('bridge-assets', 'Bridge from Ethereum', 'Bridge at least $10 from Ethereum to Monad', 'onchain', 2, 40, 'auto', true),
('create-content', 'Create Fan Art', 'Create and share fan art of your elemental soul', 'social', 2, 60, 'manual', true),
('daily-streak-3', '3-Day Login Streak', 'Login to the platform for 3 consecutive days', 'quest', 2, 30, 'auto', true),
('swap-volume-100', 'Trade $100 Volume', 'Perform swaps totaling at least $100 in volume', 'onchain', 2, 45, 'auto', true),
('join-voice-chat', 'Join Voice Chat', 'Participate in a community voice chat session', 'social', 2, 25, 'manual', true),
('like-posts', 'Engage on Social Media', 'Like and comment on 5 official posts', 'social', 2, 20, 'manual', true);

-- Level 3 → 4
INSERT INTO tasks (id, name, description, category, required_level, points, verification_type, is_active) VALUES
('governance-vote', 'Vote on Governance', 'Participate in a governance proposal vote', 'onchain', 3, 35, 'auto', true),
('stake-tokens', 'Stake MONAD', 'Stake at least 10 MONAD tokens', 'onchain', 3, 60, 'auto', true),
('refer-3-friends', 'Refer 3 Friends', 'Get 3 friends to mint their elemental souls', 'quest', 3, 75, 'auto', true),
('daily-streak-7', '7-Day Login Streak', 'Login for 7 consecutive days', 'quest', 3, 50, 'auto', true),
('create-video', 'Create Video Content', 'Create a video showcasing your elemental soul journey', 'social', 3, 80, 'manual', true),
('explore-5-dapps', 'dApp Explorer', 'Interact with 5 different dApps on Monad', 'onchain', 3, 55, 'auto', true),
('add-liquidity-medium', 'Liquidity Provider Pro', 'Add at least $200 worth of liquidity', 'onchain', 3, 70, 'auto', true),
('help-community', 'Community Helper', 'Help 5 new users in Discord support channel', 'social', 3, 40, 'manual', true),
('share-strategy', 'Share Evolution Strategy', 'Post your evolution strategy guide in the community', 'social', 3, 45, 'manual', true),
('nft-collector', 'NFT Collector', 'Collect at least 3 other NFTs on Monad', 'onchain', 3, 50, 'auto', true);

-- Level 4 → 5
INSERT INTO tasks (id, name, description, category, required_level, points, verification_type, is_active) VALUES
('provide-liquidity-large', 'Liquidity Whale', 'Add at least $500 worth of liquidity', 'onchain', 4, 100, 'auto', true),
('cross-chain-bridge', 'Cross-Chain Master', 'Bridge assets from 2 different chains to Monad', 'onchain', 4, 85, 'auto', true),
('trade-volume-1000', 'Trader', 'Perform swaps totaling $1000 in volume', 'onchain', 4, 90, 'auto', true),
('daily-streak-14', '14-Day Dedication', 'Login for 14 consecutive days', 'quest', 4, 75, 'auto', true),
('community-leader', 'Community Leader', 'Host a community event or AMA session', 'social', 4, 120, 'manual', true),
('create-guide', 'Guide Creator', 'Write a comprehensive guide for new users', 'social', 4, 80, 'manual', true),
('stake-large', 'Staking Champion', 'Stake at least 100 MONAD tokens', 'onchain', 4, 95, 'auto', true),
('refer-10-friends', 'Influencer', 'Refer 10 friends to the platform', 'quest', 4, 150, 'auto', true),
('participate-event', 'Event Participant', 'Participate in a special community event', 'quest', 4, 70, 'auto', true),
('governance-active', 'Governance Active', 'Vote on at least 3 governance proposals', 'onchain', 4, 65, 'auto', true),
('nft-trader', 'NFT Trader', 'Buy or sell NFTs for a total of $100 volume', 'onchain', 4, 75, 'auto', true),
('twitter-thread', 'Twitter Thread', 'Create an informative Twitter thread about Elemental Souls', 'social', 4, 60, 'manual', true);

-- Level 5+ (Advanced/Endgame content)
INSERT INTO tasks (id, name, description, category, required_level, points, verification_type, is_active) VALUES
('whale-liquidity', 'Liquidity Whale Elite', 'Add at least $2000 worth of liquidity', 'onchain', 5, 200, 'auto', true),
('trade-volume-5000', 'Trading Master', 'Perform swaps totaling $5000 in volume', 'onchain', 5, 180, 'auto', true),
('daily-streak-30', 'Monthly Dedication', 'Login for 30 consecutive days', 'quest', 5, 150, 'auto', true),
('create-artwork-collection', 'Artist', 'Create a collection of 5+ artworks', 'social', 5, 175, 'manual', true),
('protocol-integration', 'Protocol Partner', 'Use a partner protocol integration', 'onchain', 6, 160, 'auto', true),
('governance-proposal', 'Governance Proposer', 'Create a governance proposal', 'onchain', 6, 200, 'manual', true),
('community-moderator', 'Moderator', 'Become a community moderator', 'social', 7, 250, 'manual', true),
('max-level-helper', 'Mentor', 'Help 10 users reach level 5', 'social', 8, 300, 'manual', true),
('ultimate-challenge', 'Transcendence Trial', 'Complete the final secret challenge', 'quest', 9, 500, 'manual', true);

ON CONFLICT (id) DO NOTHING;
