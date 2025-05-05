-- Triggers
DELIMITER $$

CREATE TRIGGER update_game_rating_after_review
AFTER INSERT ON Reviews
FOR EACH ROW
BEGIN
    UPDATE Games
    SET rating = (
        SELECT ROUND(AVG(score), 2)
        FROM Reviews
        WHERE game_id = NEW.game_id
    )
    WHERE game_id = NEW.game_id;
END$$

DELIMITER //

CREATE TRIGGER trg_before_game_insert
BEFORE INSERT ON Games
FOR EACH ROW
BEGIN
    IF NEW.description IS NULL THEN
        SET NEW.description = 'No description provided.';
    END IF;
END;
//

CREATE TRIGGER trg_prevent_duplicate_email
BEFORE INSERT ON Users
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Users WHERE email = NEW.email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate email not allowed';
    END IF;
END;
//

DELIMITER //

CREATE TRIGGER trg_prevent_duplicate_review
BEFORE INSERT ON Reviews
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM Reviews
        WHERE game_id = NEW.game_id AND user_id = NEW.user_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User has already reviewed this game';
    END IF;
END;

//
DELIMITER ;
