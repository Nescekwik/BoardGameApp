const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Your MySQL username
    password: 'Maxchart1!', // Your MySQL password
    database: 'boardgames_db'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Handle root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get all games from the database
app.get('/games', (req, res) => {
    const query = `
        SELECT 
            game_id, 
            game_name, 
            DATE_FORMAT(release_date, '%Y-%m-%d') AS release_date, 
            description, 
            url, 
            min_player, 
            max_player, 
            min_playtime, 
            max_playtime, 
            age_min, 
            rating 
        FROM Games`;
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (results.length === 0) {
            res.json([{ 
                game_id: 1, 
                game_name: "Sample Game", 
                release_date: "2025-01-01", 
                description: "This is a sample game description.", 
                url: "https://example.com", 
                min_player: 2, 
                max_player: 4, 
                min_playtime: 30, 
                max_playtime: 60, 
                age_min: 8, 
                rating: 5 
            }]);
        } else {
            res.json(results);
        }
    });
});

// Get games by category
app.get('/games/category/:categories', (req, res) => {
    const category = req.params.categories;
    const query = `
        SELECT * FROM Games 
        JOIN Is_Category ON Games.game_id = Is_Category.game_id
        JOIN Categories ON Is_Category.category_id = Categories.category_id
        WHERE Categories.category_name = ?`;
    
    db.query(query, [category], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Add a review
app.post('/review', (req, res) => {
    const { game_id, user_id, score, review, like } = req.body;
    const query = 'INSERT INTO Reviews (game_id, user_id, score, review, `like`) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [game_id, user_id, score, review, like], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Review added successfully!' });
    });
});

// Add a new game
app.post('/add-game', (req, res) => {
    const {
        game_name,
        release_date,
        description,
        url,
        min_player,
        max_player,
        min_playtime,
        max_playtime,
        age_min,
        rating,
        user_id
    } = req.body;

    const query = `CALL AddGameForEditor(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(
        query,
        [
            game_name,
            release_date,
            description,
            url,
            min_player,
            max_player,
            min_playtime,
            max_playtime,
            age_min,
            rating,
            user_id
        ],
        (err, results) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Game added successfully!' });
        }
    );
});

// Delete a game
app.delete('/delete-game/:gameId', (req, res) => {
    const gameId = req.params.gameId;

    // Delete related records in dependent tables
    const deleteEditedQuery = `DELETE FROM Edited WHERE game_id = ?`;
    const deleteReviewsQuery = `DELETE FROM Reviews WHERE game_id = ?`;
    const deleteIsCategoryQuery = `DELETE FROM Is_Category WHERE game_id = ?`;
    const deleteListsQuery = `DELETE FROM Lists WHERE game_id = ?`;
    const deleteGameQuery = `DELETE FROM Games WHERE game_id = ?`;

    // Execute the queries sequentially
    db.query(deleteEditedQuery, [gameId], (err) => {
        if (err) {
            console.error('Error deleting edited records:', err);
            res.status(500).json({ error: 'Failed to delete edited records.' });
            return;
        }

        db.query(deleteReviewsQuery, [gameId], (err) => {
            if (err) {
                console.error('Error deleting reviews:', err);
                res.status(500).json({ error: 'Failed to delete reviews.' });
                return;
            }

            db.query(deleteIsCategoryQuery, [gameId], (err) => {
                if (err) {
                    console.error('Error deleting categories:', err);
                    res.status(500).json({ error: 'Failed to delete categories.' });
                    return;
                }

                db.query(deleteListsQuery, [gameId], (err) => {
                    if (err) {
                        console.error('Error deleting lists:', err);
                        res.status(500).json({ error: 'Failed to delete lists.' });
                        return;
                    }

                    // Finally, delete the game itself
                    db.query(deleteGameQuery, [gameId], (err, results) => {
                        if (err) {
                            console.error('Error deleting game:', err);
                            res.status(500).json({ error: 'Failed to delete the game.' });
                            return;
                        }
                        if (results.affectedRows === 0) {
                            res.status(404).json({ message: 'Game not found.' });
                        } else {
                            res.json({ message: 'Game deleted successfully!' });
                        }
                    });
                });
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
