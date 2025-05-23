-- Indexes
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_games_rating ON Games(rating);
CREATE INDEX idx_reviews_user_game ON Reviews(user_id, game_id);
CREATE INDEX idx_reviews_game_score ON Reviews(game_id, score);
CREATE INDEX idx_game_name ON Games(game_id, game_name);


