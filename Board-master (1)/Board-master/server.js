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

// Add this endpoint for frontend compatibility
app.get('/api/games', (req, res) => {
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
        res.json(results);
    });
});

// --- Add search endpoint for games by name ---
app.get('/api/games/search', (req, res) => {
    const name = req.query.name;
    if (!name) {
        res.status(400).json({ error: 'Missing name parameter.' });
        return;
    }
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
        FROM Games
        WHERE game_name LIKE ?
    `;
    db.query(query, [`%${name}%`], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Get games by category using stored procedure
app.get('/games/category/:categories', (req, res) => {
    const category = req.params.categories;
    const query = `CALL GetGamesByCategory(?)`;
    db.query(query, [category], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // results[0] contains the actual result set from the procedure
        res.json(results[0]);
    });
});

// Get the current user's review for a game
app.get('/review/:gameId/:userId', (req, res) => {
    const { gameId, userId } = req.params;
    const query = 'SELECT * FROM Reviews WHERE game_id = ? AND user_id = ?';
    db.query(query, [gameId, userId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (results.length === 0) {
            res.json(null);
        } else {
            res.json(results[0]);
        }
    });
});

// Add a review using stored procedure (SafeAddReview)
app.post('/review', (req, res) => {
    const { game_id, user_id, score, review, like } = req.body;
    const query = 'CALL SafeAddReview(?, ?, ?, ?, ?)';

    db.query(query, [game_id, user_id, score, review, like], (err, result) => {
        if (err) {
            // Handle duplicate review error from trigger
            if (err.sqlState === '45000' && err.sqlMessage.includes('already reviewed')) {
                res.status(400).json({ error: 'You have already reviewed this game.' });
            } else if (err.sqlState === '45000' && err.sqlMessage.includes('✨ Cannot review a deleted game ✨')) {
                res.status(400).json({ error: 'Cannot review a deleted game.' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        res.json({ message: 'Review added successfully!' });
    });
});

// Edit a review (update)
app.put('/review/:gameId/:userId', (req, res) => {
    const { gameId, userId } = req.params;
    const { score, review, like } = req.body;
    const query = 'UPDATE Reviews SET score = ?, review = ?, `like` = ?, review_date = NOW() WHERE game_id = ? AND user_id = ?';
    db.query(query, [score, review, like, gameId, userId], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Review not found.' });
        } else {
            res.json({ message: 'Review updated successfully!' });
        }
    });
});

// Add a new game (admin only)
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

    // Check if user is admin
    db.query('SELECT is_admin FROM Users WHERE user_id = ?', [user_id], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Failed to check admin status.' });
            return;
        }
        if (!results.length || !results[0].is_admin) {
            res.status(403).json({ error: 'Only admins can add games.' });
            return;
        }

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
});

// Delete a game (admin only)
app.delete('/delete-game/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    const userId = req.headers['x-user-id'];

    if (!userId) {
        res.status(401).json({ error: 'User not authenticated.' });
        return;
    }

    db.query('SELECT is_admin FROM Users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Failed to check admin status.' });
            return;
        }
        if (!results.length || !results[0].is_admin) {
            res.status(403).json({ error: 'Only admins can delete games.' });
            return;
        }

        const deleteEditedQuery = `DELETE FROM Edited WHERE game_id = ?`;
        const deleteReviewsQuery = `DELETE FROM Reviews WHERE game_id = ?`;
        const deleteIsCategoryQuery = `DELETE FROM Is_Category WHERE game_id = ?`;
        const deleteListsQuery = `DELETE FROM Lists WHERE game_id = ?`;
        const deleteGameQuery = `DELETE FROM Games WHERE game_id = ?`;

        db.query(deleteEditedQuery, [gameId], (err) => {
            if (err) {
                res.status(500).json({ error: 'Failed to delete edited records.' });
                return;
            }
            db.query(deleteReviewsQuery, [gameId], (err) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to delete reviews.' });
                    return;
                }
                db.query(deleteIsCategoryQuery, [gameId], (err) => {
                    if (err) {
                        res.status(500).json({ error: 'Failed to delete categories.' });
                        return;
                    }
                    db.query(deleteListsQuery, [gameId], (err) => {
                        if (err) {
                            res.status(500).json({ error: 'Failed to delete lists.' });
                            return;
                        }
                        db.query(deleteGameQuery, [gameId], (err, results) => {
                            if (err) {
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
});

// Create a new user (no stored procedure)
app.post('/create-user', (req, res) => {
    const { username, email, password } = req.body;
    // is_admin is optional, default to false
    const is_admin = req.body.is_admin === true;

    const query = `
        INSERT INTO Users (username, email, password, account_creation, is_admin)
        VALUES (?, ?, ?, CURDATE(), ?)
    `;
    db.query(query, [username, email, password, is_admin], (err, results) => {
        if (err) {
            // Handle duplicate email error from trigger
            if (err.sqlState === '45000' && err.sqlMessage.includes('Duplicate email not allowed')) {
                res.status(400).json({ error: 'This email is already registered.' });
            } else if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'This email is already registered.' });
            } else {
                res.status(500).json({ error: err.sqlMessage || 'Failed to create user.' });
            }
            return;
        }
        res.json({ message: 'User created successfully!' });
    });
});

// Login a user
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = `SELECT user_id, username, is_admin FROM Users WHERE email = ? AND password = ?`;
    db.query(query, [email, password], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Failed to log in.' });
            return;
        }
        if (results.length === 0) {
            res.status(401).json({ error: 'Invalid email or password.' });
        } else {
            res.json({ message: 'Login successful!', user: results[0] });
        }
    });
});

// Get all reviews for a game (public)
app.get('/reviews/:gameId', (req, res) => {
    const { gameId } = req.params;
    const query = `
        SELECT r.*, u.username 
        FROM Reviews r
        JOIN Users u ON r.user_id = u.user_id
        WHERE r.game_id = ?
        ORDER BY r.review_date DESC
    `;
    db.query(query, [gameId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Delete a review (by author or admin)
app.delete('/review/:gameId/:userId', (req, res) => {
    const { gameId, userId } = req.params;
    const adminId = req.headers['x-user-id'];

    // Check if admin
    db.query('SELECT is_admin FROM Users WHERE user_id = ?', [adminId], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Failed to check admin status.' });
            return;
        }
        const isAdmin = results.length && results[0].is_admin;
        let query, params;
        if (isAdmin) {
            // Admin can delete any review for this game/user
            query = 'DELETE FROM Reviews WHERE game_id = ? AND user_id = ?';
            params = [gameId, userId];
        } else {
            // Only allow user to delete their own review
            if (adminId != userId) {
                res.status(403).json({ error: 'Not authorized to delete this review.' });
                return;
            }
            query = 'DELETE FROM Reviews WHERE game_id = ? AND user_id = ?';
            params = [gameId, userId];
        }
        db.query(query, params, (err, result) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Review not found or not authorized.' });
            } else {
                res.json({ message: 'Review deleted successfully!' });
            }
        });
    });
});

// Add a game to the user's list
app.post('/api/add-to-list', (req, res) => {
    const { gameId, listName } = req.body;
    const userId = req.headers['x-user-id'] || 1;

    if (!gameId || !listName) {
        res.status(400).json({ error: 'Game ID and List Name are required.' });
        return;
    }

    const query = `
        INSERT INTO Lists (user_id, game_id, list_name)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE list_name = VALUES(list_name)`;

    db.query(query, [userId, gameId, listName], (err, result) => {
        if (err) {
            console.error('Error adding game to list:', err);
            res.status(500).json({ error: 'Failed to add game to the list.' });
            return;
        }
        res.json({ message: 'Game added to your list successfully!' });
    });
});

// Create a new list with a game
app.post('/api/create-list', (req, res) => {
    const { listName, gameId } = req.body;
    const userId = req.headers['x-user-id'] || 1;

    if (!listName || !gameId) {
        res.status(400).json({ error: 'List name and Game ID are required.' });
        return;
    }

    const query = `
        INSERT INTO Lists (user_id, game_id, list_name)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE list_name = VALUES(list_name)`;

    db.query(query, [userId, gameId, listName], (err, result) => {
        if (err) {
            console.error('Error creating list:', err);
            res.status(500).json({ error: 'Failed to create the list.' });
            return;
        }
        res.json({ message: 'List created successfully!' });
    });
});

// Get user profile (for user page)
app.get('/api/user-profile', (req, res) => {
    const userId = req.headers['x-user-id'] || 1;

    if (!userId) {
        res.status(400).json({ error: 'User ID is required.' });
        return;
    }

    const query = `
        SELECT username AS name
        FROM users
        WHERE user_id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user profile:', err);
            res.status(500).json({ error: 'Failed to fetch user profile.' });
            return;
        }

        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: 'User not found.' });
        }
    });
});

// Get user lists with games grouped by list name
app.get('/api/user-lists', (req, res) => {
    const userId = req.headers['x-user-id'] || 1;
    const query = `
        SELECT l.list_name, g.game_id, g.game_name
        FROM Lists l
        LEFT JOIN Games g ON l.game_id = g.game_id
        WHERE l.user_id = ?
        ORDER BY l.list_name`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user lists:', err);
            res.status(500).json({ error: 'Failed to fetch user lists.' });
            return;
        }

        const lists = {};
        results.forEach(row => {
            if (!lists[row.list_name]) {
                lists[row.list_name] = [];
            }
            if (row.game_id) {
                lists[row.list_name].push({ game_id: row.game_id, game_name: row.game_name });
            }
        });

        const formattedLists = Object.keys(lists).map(listName => ({
            list_name: listName,
            games: lists[listName]
        }));

        res.json(formattedLists);
    });
});

// Remove a game from a user's list
app.post('/api/remove-from-list', (req, res) => {
    const { gameId, listName } = req.body;
    const userId = req.headers['x-user-id'] || 1;

    if (!gameId || !listName) {
        res.status(400).json({ error: 'Game ID and List Name are required.' });
        return;
    }

    const query = `
        DELETE FROM Lists
        WHERE user_id = ? AND game_id = ? AND list_name = ?`;

    db.query(query, [userId, gameId, listName], (err, result) => {
        if (err) {
            console.error('Error removing game from list:', err);
            res.status(500).json({ error: 'Failed to remove game from the list.' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Game not found in the list.' });
        } else {
            res.json({ message: 'Game removed from your list successfully!' });
        }
    });
});

// Leaderboard: Top 5 games by rating (using the Leaderboards view)
app.get('/api/leaderboard', (req, res) => {
    const query = `
        SELECT game_id, game_name, average_score
        FROM Leaderboards
        ORDER BY average_score DESC
        LIMIT 5
    `;
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Most Reviewed This Month: Top games by review count (using the MostReviewedThisMonth view)
app.get('/api/most-reviewed-this-month', (req, res) => {
    const query = `
        SELECT game_id, game_name, review_count, average_score
        FROM MostReviewedThisMonth
        ORDER BY review_count DESC
        LIMIT 5
    `;
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// User Activity: total reviews and avg score for current user (using the UserActivity view)
app.get('/api/user-activity', (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        res.status(400).json({ error: 'User ID is required.' });
        return;
    }
    const query = `
        SELECT total_reviews, avg_score
        FROM UserActivity
        WHERE user_id = ?
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.json({ total_reviews: 0, avg_score: null });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
