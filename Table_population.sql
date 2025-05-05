-- Insertion des utilisateurs
INSERT INTO Users (username, email, `password`, account_creation) VALUES
('gamer01', 'gamer01@example.com', 'pass1234', '2022-01-10'),
('boardfan', 'boardfan@example.com', 'securepass', '2021-11-23'),
('strategylover', 'strategylover@example.com', 'mypassword', '2023-02-15'),
('familyplayer', 'familyplayer@example.com', 'family123', '2024-01-01'),
('soloaddict', 'soloaddict@example.com', 'soloquest', '2020-06-18');

-- Insertion des jeux
INSERT INTO Games (game_name, release_date, `description`, url, min_player, max_player, min_playtime, max_playtime, age_min, rating) VALUES
('Catan', '1995-01-01', 'A strategy game about trading and building.', 'https://www.catan.com', 3, 4, 60, 120, 10, 8),
('Ticket to Ride', '2004-01-01', 'Railroad building game across the USA.', 'https://www.ticket2ridegame.com', 2, 5, 30, 60, 8, 9),
('Pandemic', '2008-01-01', 'A cooperative game to stop global diseases.', 'https://www.zmangames.com/en/games/pandemic/', 2, 4, 45, 60, 10, 9),
('Chess', '1500-01-01', 'Classic strategy game.', 'https://www.chess.com', 2, 2, 10, 120, 6, 10),
('Gloomhaven', '2017-01-01', 'Epic tactical combat in a persistent world.', 'https://www.cephalofair.com/gloomhaven', 1, 4, 90, 150, 14, 9);

-- Insertion des catégories
INSERT INTO Categories (category_name, `description`) VALUES
('Strategy', 'Games that focus on strategic planning.'),
('Family', 'Games suitable for family play.'),
('Cooperative', 'Players work together to achieve a goal.'),
('Classic', 'Games with long historical roots.'),
('Adventure', 'Games involving storylines and exploration.');

-- Insertion des éditeurs
INSERT INTO Editors (editor_name, logo_url, country, website_url) VALUES
('Kosmos', 'https://logos.com/kosmos.png', 'Germany', 'https://www.kosmos.de'),
('Days of Wonder', 'https://logos.com/dow.png', 'USA', 'https://www.daysofwonder.com'),
('Z-Man Games', 'https://logos.com/zmangames.png', 'USA', 'https://www.zmangames.com'),
('International Chess Federation', 'https://logos.com/fide.png', 'Worldwide', 'https://www.fide.com'),
('Cephalofair Games', 'https://logos.com/cephalofair.png', 'USA', 'https://www.cephalofair.com');

-- Insertion des reviews avec review_date
INSERT INTO Reviews (game_id, user_id, score, review, `like`, review_date) VALUES
(1, 1, 8, 'Love the trading mechanic!', true, '2025-04-20'),
(2, 2, 9, 'Very fun and easy to teach.', true, '2025-04-22'),
(3, 3, 10, 'Amazing team play experience.', true, '2025-04-25'),
(4, 4, 9, 'Classic and timeless.', true, '2025-05-01'),
(5, 5, 8, 'Deep and immersive campaign.', true, '2025-05-03');


-- Insertion des relations lists
INSERT INTO Lists (user_id, game_id, list_name) VALUES
(1, 1, 'Favorites'),
(1, 2, 'Wishlist'),
(2, 3, 'Family Night'),
(3, 4, 'Strategy Classics'),
(4, 5, 'Epic Campaigns');

-- Insertion des relations edited
INSERT INTO Edited (user_id, game_id) VALUES
(2, 1),
(3, 2),
(4, 3),
(5, 4),
(1, 5);

-- Insertion des relations is_category
INSERT INTO Is_Category (category_id, game_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);