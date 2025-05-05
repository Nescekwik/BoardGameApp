
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
	`password` VARCHAR(255) NOT NULL,
    account_creation DATE NOT NULL
);

CREATE TABLE Games (
    game_id INT PRIMARY KEY AUTO_INCREMENT,
    game_name VARCHAR(255) NOT NULL,
    release_date DATE,
    `description` VARCHAR(1000),
    url VARCHAR(500),
    min_player INT,
    max_player INT,
    min_playtime INT,
    max_playtime INT,
    age_min INT,
    rating DECIMAL(4,2) DEFAULT NULL
);

CREATE TABLE Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(255) NOT NULL,
    `description` VARCHAR(1000)
);

CREATE TABLE Editors (
    editor_id INT PRIMARY KEY AUTO_INCREMENT,
    editor_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    country VARCHAR(255),	
    website_url VARCHAR(500)
);

CREATE TABLE Reviews (
    reviews_id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT,
    user_id INT,
    score INT CHECK (score >= 0 AND score <= 10),
    review TEXT,
    `like` BOOLEAN,
    review_date DATE DEFAULT NOW(),
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Lists (
    user_id INT,
    game_id INT,
    PRIMARY KEY (user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    list_name VARCHAR(255)
);

CREATE TABLE Edited (
    user_id INT,
    game_id INT,
    PRIMARY KEY (user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (game_id) REFERENCES Games(game_id)
);

CREATE TABLE Is_Category (
    category_id INT,
    game_id INT,
    PRIMARY KEY (category_id, game_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id),
    FOREIGN KEY (game_id) REFERENCES Games(game_id)
);
