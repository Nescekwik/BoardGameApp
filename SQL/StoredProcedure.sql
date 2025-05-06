-- Stored Procedures :
DELIMITER &&

CREATE PROCEDURE AddReview(IN gid INT, IN uid INT, IN score INT, IN rev TEXT, IN liked BOOLEAN)
BEGIN
    INSERT INTO Reviews(game_id, user_id, score, review, `like`)
    VALUES (gid, uid, score, rev, liked);
END;&&

DELIMITER &&
CREATE FUNCTION CountReviews(gid INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE count_reviews INT;
    SELECT COUNT(*) INTO count_reviews FROM Reviews WHERE game_id = gid;
    RETURN count_reviews;
END;&&

DELIMITER &&
CREATE PROCEDURE GetGamesByCategory(IN cat_name VARCHAR(255))
BEGIN
    SELECT G.game_name
    FROM Games G
    JOIN Is_Category IC ON G.game_id = IC.game_id
    JOIN Categories C ON C.category_id = IC.category_id
    WHERE C.category_name = cat_name;
END;&&

DELIMITER &&
CREATE PROCEDURE AddGameForEditor (
    IN p_game_name VARCHAR(255),
    IN p_release_date DATE,
    IN p_description VARCHAR(1000),
    IN p_url VARCHAR(500),
    IN p_min_player INT,
    IN p_max_player INT,
    IN p_min_playtime INT,
    IN p_max_playtime INT,
    IN p_age_min INT,
    IN p_rating INT,
    IN p_user_id INT
)
BEGIN
    DECLARE new_game_id INT;

    -- Insert the game
    INSERT INTO Games (
        game_name, release_date, description, url,
        min_player, max_player, min_playtime, max_playtime,
        age_min, rating
    ) VALUES (
        p_game_name, p_release_date, p_description, p_url,
        p_min_player, p_max_player, p_min_playtime, p_max_playtime,
        p_age_min, p_rating
    );

    -- Get the ID of the inserted game
    SET new_game_id = LAST_INSERT_ID();

    -- Link the game to the editor (user)
    INSERT INTO Edited (user_id, game_id)
    VALUES (p_user_id, new_game_id);

END;&&
DELIMITER ;
