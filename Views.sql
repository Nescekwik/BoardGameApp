CREATE VIEW Leaderboards AS
SELECT game_id, game_name, rating AS average_score
FROM Games
WHERE rating IS NOT NULL
ORDER BY rating DESC;

select * from Leaderboards;

CREATE VIEW MostReviewedThisMonth AS
SELECT g.game_id, g.game_name, COUNT(r.reviews_id) AS review_count, g.rating AS average_score
FROM Games g
JOIN Reviews r ON g.game_id = r.game_id
WHERE
    r.review IS NOT NULL
    AND MONTH(CURDATE()) = MONTH(r.review_date)
    AND YEAR(CURDATE()) = YEAR(r.review_date)
GROUP BY g.game_id, g.game_name, g.rating
ORDER BY review_count DESC;

select * from MostReviewedThisMonth;

CREATE VIEW UserActivity AS
SELECT u.user_id, u.username, COUNT(r.reviews_id) AS total_reviews, ROUND(AVG(r.score), 2) AS avg_score
FROM Users u
LEFT JOIN Reviews r ON u.user_id = r.user_id
GROUP BY u.user_id, u.username
ORDER BY total_reviews DESC;

select * from UserActivity;