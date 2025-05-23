// Function to delete a game
function deleteGame(gameId, gameElement) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.user_id) {
        alert('You must be logged in as an admin to delete games.');
        return;
    }
    if (confirm('Are you sure you want to delete this game?')) {
        fetch(`http://localhost:3000/delete-game/${gameId}`, {
            method: 'DELETE',
            headers: {
                'x-user-id': user.user_id
            }
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || `Server error: ${response.status}`); });
                }
                return response.json();
            })
            .then(data => {
                if (data.message === 'Game deleted successfully!') {
                    alert(data.message);
                    gameElement.remove();
                } else {
                    alert(data.error || 'Unexpected response from the server.');
                }
            })
            .catch(error => {
                alert(error.message);
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('categoryFilter');
    const gameList = document.getElementById('gameList');

    // Show/hide Add Game button and delete buttons based on admin status
    function updateAdminUI() {
        const user = JSON.parse(localStorage.getItem('user'));
        const addGameButton = document.getElementById('addGameButton');
        // Hide Add Game button if not admin
        if (user && user.is_admin) {
            addGameButton.style.display = 'inline-block';
        } else {
            addGameButton.style.display = 'none';
        }
    }

    // Review Modal Elements
    let currentReviewGameId = null;
    let isEditingReview = false;
    let reviewModal, reviewForm, reviewScore, reviewText, reviewLike, reviewSubmitBtn, reviewCloseBtn;

    function createReviewModal() {
        if (document.getElementById('reviewModal')) return; // Only create once
        reviewModal = document.createElement('div');
        reviewModal.id = 'reviewModal';
        reviewModal.className = 'modal';
        reviewModal.innerHTML = `
            <div class="modal-content">
                <span class="close" id="reviewCloseBtn">&times;</span>
                <h2 id="reviewModalTitle">Add/Edit Review</h2>
                <form id="reviewForm">
                    <label for="reviewScore">Score (0-10):</label>
                    <input type="number" id="reviewScore" name="score" min="0" max="10" required>
                    <label for="reviewText">Review:</label>
                    <textarea id="reviewText" name="review"></textarea>
                    <label>
                        <input type="checkbox" id="reviewLike" name="like">
                        Like
                    </label>
                    <button type="submit" id="reviewSubmitBtn">Submit</button>
                </form>
            </div>
        `;
        document.body.appendChild(reviewModal);

        reviewForm = document.getElementById('reviewForm');
        reviewScore = document.getElementById('reviewScore');
        reviewText = document.getElementById('reviewText');
        reviewLike = document.getElementById('reviewLike');
        reviewSubmitBtn = document.getElementById('reviewSubmitBtn');
        reviewCloseBtn = document.getElementById('reviewCloseBtn');

        reviewCloseBtn.onclick = () => { reviewModal.style.display = 'none'; };
        window.addEventListener('click', (event) => {
            if (event.target === reviewModal) reviewModal.style.display = 'none';
        });

        reviewForm.onsubmit = function(event) {
            event.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.user_id) {
                alert('You must be logged in to review.');
                return;
            }
            const reviewData = {
                game_id: currentReviewGameId,
                user_id: user.user_id,
                score: parseInt(reviewScore.value),
                review: reviewText.value,
                like: reviewLike.checked
            };
            if (isEditingReview) {
                fetch(`http://localhost:3000/review/${currentReviewGameId}/${user.user_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reviewData)
                })
                .then(res => res.json())
                .then(data => {
                    alert(data.message || data.error);
                    reviewModal.style.display = 'none';
                    fetchGames();
                });
            } else {
                fetch('http://localhost:3000/review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reviewData)
                })
                .then(res => res.json())
                .then(data => {
                    alert(data.message || data.error);
                    reviewModal.style.display = 'none';
                    fetchGames();
                });
            }
        };
    }

    // Function to display games
    function displayGames(games) {
        // Fix: If games is not an array, convert it to an array
        if (!Array.isArray(games)) {
            games = Object.values(games).filter(item => typeof item === 'object' && item !== null && 'game_id' in item);
        }
        const gameList = document.getElementById('gameList');
        gameList.innerHTML = ''; // Clear the game list
        const user = JSON.parse(localStorage.getItem('user'));
        const isAdmin = user && user.is_admin;

        // Debug: log the games array
        console.log('Games to display:', games);

        games.forEach(game => {
            const desc = (game.description || '').substring(0, 100);
            const user = JSON.parse(localStorage.getItem('user'));

            const gameElement = document.createElement('div');
            gameElement.classList.add('game');

            // Game content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'game-content';

            // Admin "Delete Last Review" button
            let adminDeleteLastReviewBtn = '';
            if (user && user.is_admin) {
                adminDeleteLastReviewBtn = `<button class="admin-delete-last-review-button" data-gameid="${game.game_id}" style="margin-left:8px;background:#ff9800;color:#fff;border:none;border-radius:5px;padding:8px 12px;font-size:0.9rem;cursor:pointer;">Delete Last Review</button>`;
            }

            // Header row
            contentDiv.innerHTML = `
                <div class="game-header">
                    ${game.game_name}
                    ${user && user.is_admin ? '<button class="delete-button">❌</button>' : ''}
                    ${adminDeleteLastReviewBtn}
                </div>
                <div class="game-description">${desc}${game.description && game.description.length > 100 ? '...' : ''}</div>
                <div class="game-info-row">
                    <div class="game-info-block">👥 ${game.min_player} - ${game.max_player} players</div>
                    <div class="game-info-block">🎂 ${game.age_min}+</div>
                    <div class="game-info-block">⏱️ ${game.min_playtime || '?'} - ${game.max_playtime || '?'} min</div>
                </div>
                <div class="game-meta">
                    <div><span class="game-meta-label">Release:</span> ${game.release_date || 'N/A'}</div>
                    <div><span class="game-meta-label">Rating:</span> ${game.rating || 'N/A'}</div>
                </div>
            `;

            // Details (expandable)
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'game-details';
            // --- Revert to website link ---
            detailsDiv.innerHTML = game.url
                ? `<a href="${game.url}" target="_blank">Visit game website</a>`
                : '';

            // User review info and button (only for non-admins)
            let reviewInfoDiv = '';
            if (user && user.user_id && !user.is_admin) {
                reviewInfoDiv = `<div class="user-review-info" id="user-review-info-${game.game_id}">Loading your review...</div>
                <button class="review-button" data-gameid="${game.game_id}">Review</button>
                <button class="delete-review-button" data-gameid="${game.game_id}" style="display:none;margin-left:8px;background:#f44336;color:#fff;border:none;border-radius:5px;padding:8px 12px;font-size:0.9rem;cursor:pointer;">Delete Review</button>`;
            }
            contentDiv.innerHTML += reviewInfoDiv;

            // Public reviews section
            const publicReviewsDiv = document.createElement('div');
            publicReviewsDiv.className = 'public-reviews';
            publicReviewsDiv.id = `public-reviews-${game.game_id}`;
            publicReviewsDiv.innerHTML = ''; // Start empty

            // Compose card
            gameElement.appendChild(contentDiv);
            gameElement.appendChild(detailsDiv);
            gameElement.appendChild(publicReviewsDiv);

            // Expand/collapse logic
            gameElement.addEventListener('click', (event) => {
                // Only expand/collapse if not clicking on a button inside the card
                if (
                    event.target.classList.contains('review-button') ||
                    event.target.classList.contains('delete-button') ||
                    event.target.classList.contains('delete-review-button') ||
                    event.target.classList.contains('admin-delete-last-review-button')
                ) {
                    return;
                }
                const expanded = document.querySelector('.game.expanded');
                if (expanded && expanded !== gameElement) {
                    expanded.classList.remove('expanded');
                    // Hide reviews of previously expanded game
                    const prevReviews = expanded.querySelector('.public-reviews');
                    if (prevReviews) prevReviews.innerHTML = '';
                }
                const isNowExpanded = !gameElement.classList.contains('expanded');
                gameElement.classList.toggle('expanded');
                if (isNowExpanded) {
                    // Fetch and display all public reviews for this game
                    publicReviewsDiv.innerHTML = '<em>Loading reviews...</em>';
                    fetch(`http://localhost:3000/reviews/${game.game_id}`)
                        .then(res => res.json())
                        .then(reviews => {
                            if (!reviews || reviews.length === 0) {
                                publicReviewsDiv.innerHTML = '<em>No reviews yet.</em>';
                            } else {
                                publicReviewsDiv.innerHTML = `
                                    <div><strong>Reviews:</strong></div>
                                    <ul>
                                        ${reviews.map(r => `
                                            <li>
                                                <a href="user.html?user_id=${r.user_id}" class="review-username-link" data-userid="${r.user_id}" style="color:#388e3c;font-weight:bold;text-decoration:underline;cursor:pointer;">
                                                    ${r.username}
                                                </a>
                                                <span style="color:#888;">(${r.review_date ? r.review_date.substring(0,10) : ''})</span>
                                                <br>
                                                Score: ${r.score}, ${r.like ? 'Liked' : 'Not Liked'}
                                                <br>
                                                ${r.review ? r.review : ''}
                                            </li>
                                        `).join('')}
                                    </ul>
                                `;
                                // Add event listeners to username links to prevent event bubbling
                                publicReviewsDiv.querySelectorAll('.review-username-link').forEach(link => {
                                    link.addEventListener('click', function(e) {
                                        e.stopPropagation();
                                        // Allow default navigation
                                    });
                                });
                            }
                        });
                } else {
                    // Hide reviews when collapsed
                    publicReviewsDiv.innerHTML = '';
                }
            });

            // Delete button
            if (user && user.is_admin) {
                const deleteButton = contentDiv.querySelector('.delete-button');
                if (deleteButton) {
                    deleteButton.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent expand/collapse
                        deleteGame(game.game_id, gameElement);
                    });
                }
            }

            // Admin "Delete Last Review" button logic
            if (user && user.is_admin) {
                const adminDeleteBtn = contentDiv.querySelector('.admin-delete-last-review-button');
                if (adminDeleteBtn) {
                    adminDeleteBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        if (confirm('Are you sure you want to delete the last review for this game?')) {
                            fetch(`http://localhost:3000/reviews/${game.game_id}`, {
                                method: 'GET'
                            })
                            .then(res => res.json())
                            .then(reviews => {
                                if (!reviews || reviews.length === 0) {
                                    alert('No reviews to delete.');
                                    return;
                                }
                                const lastReview = reviews[0]; // reviews are ordered DESC by date
                                fetch(`http://localhost:3000/review/${game.game_id}/${lastReview.user_id}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'x-user-id': user.user_id // admin id
                                    }
                                })
                                .then(res => res.json())
                                .then(data => {
                                    alert(data.message || data.error);
                                    fetchGames();
                                });
                            });
                        }
                    });
                }
            }

            // Review button logic (only for non-admins)
            if (user && user.user_id && !user.is_admin) {
                const reviewBtn = contentDiv.querySelector('.review-button');
                if (reviewBtn) {
                    reviewBtn.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent expand/collapse
                        openReviewModal(game.game_id);
                    });
                }
                // Delete review button logic
                const deleteReviewBtn = contentDiv.querySelector('.delete-review-button');
                if (deleteReviewBtn) {
                    deleteReviewBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        if (confirm('Are you sure you want to delete this review?')) {
                            fetch(`http://localhost:3000/review/${game.game_id}/${user.user_id}`, {
                                method: 'DELETE',
                                headers: {
                                    'x-user-id': user.user_id // Always send current user id for admin check
                                }
                            })
                            .then(res => res.json())
                            .then(data => {
                                alert(data.message || data.error);
                                fetchGames();
                            });
                        }
                    });
                }
                // Fetch and display user's review for this game
                fetch(`http://localhost:3000/review/${game.game_id}/${user.user_id}`)
                    .then(res => res.json())
                    .then(review => {
                        const infoDiv = document.getElementById(`user-review-info-${game.game_id}`);
                        const deleteBtn = contentDiv.querySelector('.delete-review-button');
                        if (infoDiv) {
                            if (!review) {
                                infoDiv.textContent = 'You have not reviewed this game.';
                                if (deleteBtn) deleteBtn.style.display = 'none';
                            } else {
                                infoDiv.innerHTML = `
                                    <strong>Your Review:</strong> 
                                    Score: ${review.score}, 
                                    ${review.like ? 'Liked' : 'Not Liked'}<br>
                                    ${review.review ? review.review : ''}
                                `;
                                if (deleteBtn) deleteBtn.style.display = 'inline-block';
                            }
                        }
                    });
            }

            gameList.appendChild(gameElement);
        });
    }

    // Function to fetch games from the backend and display them
    function fetchGames(filterCategory = 'all') {
        let url = 'http://localhost:3000/api/games';
        if (filterCategory !== 'all') {
            url = `http://localhost:3000/games/category/${filterCategory}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(games => {
                displayGames(games);
            })
            .catch(error => console.error('Error fetching games:', error));
    }

    // Fetch all games initially
    fetchGames();

    // Event listener for category filter change
    categoryFilter.addEventListener('change', (event) => {
        const selectedCategory = event.target.value;
        fetchGames(selectedCategory);
    });

    // Modal Logic
    const addGameButton = document.getElementById('addGameButton');
    const addGameModal = document.getElementById('addGameModal');
    const closeModal = document.querySelector('.close');
    const addGameForm = document.getElementById('addGameForm');

    addGameButton.addEventListener('click', () => {
        addGameModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        addGameModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === addGameModal) {
            addGameModal.style.display = 'none';
        }
    });

    // Handle Form Submission
    addGameForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.user_id || !user.is_admin) {
            alert('You must be logged in as an admin to add games.');
            return;
        }

        const formData = new FormData(addGameForm);
        const gameData = {
            game_name: formData.get('gameName'),
            release_date: formData.get('releaseDate') || null,
            description: formData.get('description') || null,
            url: formData.get('url') || null,
            min_player: formData.get('minPlayer') ? parseInt(formData.get('minPlayer')) : null,
            max_player: formData.get('maxPlayer') ? parseInt(formData.get('maxPlayer')) : null,
            min_playtime: formData.get('minPlaytime') ? parseInt(formData.get('minPlaytime')) : null,
            max_playtime: formData.get('maxPlaytime') ? parseInt(formData.get('maxPlaytime')) : null,
            age_min: formData.get('ageMin') ? parseInt(formData.get('ageMin')) : null,
            rating: formData.get('rating') ? parseFloat(formData.get('rating')) : null,
            user_id: user.user_id // Use the logged-in admin's ID
        };

        fetch('http://localhost:3000/add-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameData)
        })
            .then((response) => response.json())
            .then((data) => {
                alert(data.message || data.error);
                addGameModal.style.display = 'none';
                fetchGames(); // Refresh the game list
            })
            .catch((error) => {
                alert('Error adding game: ' + error);
            });
    });

    // User Button Dropdown Logic
    const userButton = document.getElementById('userButton');
    const userDropdown = document.getElementById('userDropdown');
    const connectBtn = document.getElementById('connectBtn');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');

    // Show username if logged in
    function updateUserMenu() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.username) {
            userButton.textContent = user.username;
            connectBtn.style.display = 'none';
            createAccountBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';
        } else {
            userButton.textContent = 'User';
            connectBtn.style.display = 'block';
            createAccountBtn.style.display = 'block';
            disconnectBtn.style.display = 'none';
        }
        updateAdminUI();
    }

    userButton.addEventListener('click', (event) => {
        event.stopPropagation();
        userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', (event) => {
        if (!userButton.contains(event.target) && !userDropdown.contains(event.target)) {
            userDropdown.style.display = 'none';
        }
    });

    disconnectBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        updateUserMenu();
        userDropdown.style.display = 'none';
        // Reload the page to clear all user/admin UI and data
        window.location.reload();
    });

    function openReviewModal(gameId) {
        createReviewModal();
        const user = JSON.parse(localStorage.getItem('user'));
        currentReviewGameId = gameId;
        isEditingReview = false;
        // Reset form
        reviewScore.value = '';
        reviewText.value = '';
        reviewLike.checked = false;
        document.getElementById('reviewModalTitle').textContent = 'Add Review';
        // Check if user already has a review
        fetch(`http://localhost:3000/review/${gameId}/${user.user_id}`)
            .then(res => res.json())
            .then(review => {
                if (review) {
                    isEditingReview = true;
                    document.getElementById('reviewModalTitle').textContent = 'Edit Review';
                    reviewScore.value = review.score;
                    reviewText.value = review.review || '';
                    reviewLike.checked = !!review.like;
                }
                reviewModal.style.display = 'block';
            });
    }

    // Fetch and display leaderboard
    function fetchLeaderboard() {
        fetch('http://localhost:3000/api/leaderboard')
            .then(res => res.json())
            .then(data => {
                const leaderboardList = document.getElementById('leaderboardList');
                if (!leaderboardList) return;
                leaderboardList.innerHTML = '';
                if (Array.isArray(data) && data.length > 0) {
                    data.forEach((game, idx) => {
                        const li = document.createElement('li');
                        // Add top1/top2/top3 class for styling
                        if (idx === 0) li.classList.add('top1');
                        if (idx === 1) li.classList.add('top2');
                        if (idx === 2) li.classList.add('top3');
                        // Use emoji medals for top 3, numbers for others
                        let badge = '';
                        if (idx === 0) badge = '<span class="rank-badge" title="1st Place">🥇</span>';
                        else if (idx === 1) badge = '<span class="rank-badge" title="2nd Place">🥈</span>';
                        else if (idx === 2) badge = '<span class="rank-badge" title="3rd Place">🥉</span>';
                        else badge = `<span class="rank-badge" style="background:#e0e0e0;color:#388e3c;">${idx + 1}</span>`;
                        li.innerHTML = `
                            ${badge}
                            <span class="game-name">${game.game_name}</span>
                            <span class="game-rating">★ ${game.average_score}</span>
                        `;
                        leaderboardList.appendChild(li);
                    });
                } else {
                    leaderboardList.innerHTML = '<li>No games found.</li>';
                }
            });
    }
    fetchLeaderboard();

    // --- Hot Games This Month ---
    function fetchHotGames() {
        fetch('http://localhost:3000/api/most-reviewed-this-month')
            .then(res => res.json())
            .then(data => {
                const hotGamesList = document.getElementById('hotGamesList');
                if (!hotGamesList) return;
                hotGamesList.innerHTML = '';
                if (Array.isArray(data) && data.length > 0) {
                    data.slice(0, 5).forEach((game, idx) => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <span style="font-weight:600;color:#222;">${game.game_name}</span>
                            <span style="color:#4CAF50;font-weight:bold;margin-left:8px;">${game.review_count} reviews</span>
                        `;
                        hotGamesList.appendChild(li);
                    });
                } else {
                    hotGamesList.innerHTML = '<li>No hot games this month.</li>';
                }
            });
    }
    fetchHotGames();

    // --- Most Reviewed This Month ---
    function fetchMostReviewed() {
        fetch('http://localhost:3000/api/most-reviewed-this-month')
            .then(res => res.json())
            .then (data => {
                const mostReviewedList = document.getElementById('mostReviewedList');
                if (!mostReviewedList) return;
                mostReviewedList.innerHTML = '';
                if (Array.isArray(data) && data.length > 0) {
                    data.slice(0, 5).forEach((game, idx) => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <span style="font-weight:600;color:#222;">${game.game_name}</span>
                            <span style="color:#4CAF50;font-weight:bold;margin-left:8px;">${game.review_count} reviews</span>
                        `;
                        mostReviewedList.appendChild(li);
                    });
                } else {
                    mostReviewedList.innerHTML = '<li>No reviews this month.</li>';
                }
            });
    }
    fetchMostReviewed();

    // --- Search functionality ---
    const gameSearchInput = document.getElementById('gameSearchInput');
    const gameSearchButton = document.getElementById('gameSearchButton');

    function fetchGamesByName(name) {
        fetch(`http://localhost:3000/api/games/search?name=${encodeURIComponent(name)}`)
            .then(response => response.json())
            .then(games => {
                displayGames(games);
            })
            .catch(error => console.error('Error searching games:', error));
    }

    gameSearchButton.addEventListener('click', () => {
        const name = gameSearchInput.value.trim();
        if (name.length === 0) {
            fetchGames(); // Show all if empty
        } else {
            fetchGamesByName(name);
        }
    });

    gameSearchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            gameSearchButton.click();
        }
    });

    updateUserMenu();
});