-- Transaction: Safely add a review only if the game still exists at the moment of insertion

DELIMITER $$

CREATE PROCEDURE SafeAddReview(
    IN p_game_id INT,
    IN p_user_id INT,
    IN p_score INT,
    IN p_review TEXT,
    IN p_like BOOLEAN
)
BEGIN
    DECLARE game_exists INT DEFAULT 0;

    START TRANSACTION;

    -- Lock the game row for update and check if it exists
    SELECT COUNT(*) INTO game_exists FROM Games WHERE game_id = p_game_id FOR UPDATE;

    IF game_exists = 0 THEN
        -- Game does not exist, rollback and signal error
        ROLLBACK;
        -- =========================
        --  ✨ Cannot review a deleted game ✨
        -- =========================
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '✨ Cannot review a deleted game ✨';
    ELSE
        -- Insert the review (duplicate check handled by trigger)
        INSERT INTO Reviews (game_id, user_id, score, review, `like`, review_date)
        VALUES (p_game_id, p_user_id, p_score, p_review, p_like, NOW());
        COMMIT;
    END IF;
END$$

DELIMITER ;
