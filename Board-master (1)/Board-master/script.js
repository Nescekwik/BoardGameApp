// Function to delete a game
function deleteGame(gameId, gameElement) {
    if (confirm('Are you sure you want to delete this game?')) {
        fetch(`http://localhost:3000/delete-game/${gameId}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Server response:', data); // Log the server response for debugging
                if (data.message === 'Game deleted successfully!') {
                    alert(data.message);
                    gameElement.remove(); // Remove the game element from the DOM
                } else {
                    alert('Unexpected response from the server.');
                }
            })
            .catch(error => {
                console.error('Error deleting game:', error);
                alert('An error occurred while deleting the game.');
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('categoryFilter');
    const gameList = document.getElementById('gameList');

    // Function to display games
    function displayGames(games) {
        const gameList = document.getElementById('gameList');
        gameList.innerHTML = ''; // Clear the game list

        games.forEach(game => {
            const gameElement = document.createElement('div');
            gameElement.classList.add('game');
            gameElement.innerHTML = `
                <div class="game-header">
                    ${game.game_name}
                    <button class="delete-button">❌</button>
                </div>
                <div class="game-description">${game.description.substring(0, 100)}...</div>
                <div class="game-details">
                    <p><strong>Release Date:</strong> ${game.release_date}</p>
                    <p><strong>Players:</strong> ${game.min_player} - ${game.max_player}</p>
                    <p><strong>Playtime:</strong> ${game.min_playtime} - ${game.max_playtime} mins</p>
                    <p><strong>Age:</strong> ${game.age_min}+</p>
                    <p><strong>Rating:</strong> ${game.rating}</p>
                    <a href="${game.url}" target="_blank">Visit game website</a>
                </div>
            `;

            // Add event listener to the delete button
            const deleteButton = gameElement.querySelector('.delete-button');
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent triggering the expand/collapse logic
                deleteGame(game.game_id, gameElement); // Pass gameElement to deleteGame
            });

            gameElement.addEventListener('click', () => {
                const expanded = document.querySelector('.game.expanded');
                if (expanded && expanded !== gameElement) {
                    expanded.classList.remove('expanded');
                }
                gameElement.classList.toggle('expanded');
            });

            gameList.appendChild(gameElement);
        });
    }

    // Function to fetch games from the backend and display them
    function fetchGames(filterCategory = 'all') {
        let url = 'http://localhost:3000/games';
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

        const formData = new FormData(addGameForm);
        const gameData = {
            game_name: formData.get('gameName'),
            release_date: formData.get('releaseDate'),
            description: formData.get('description'),
            url: formData.get('url'),
            min_player: parseInt(formData.get('minPlayer')),
            max_player: parseInt(formData.get('maxPlayer')),
            min_playtime: parseInt(formData.get('minPlaytime')),
            max_playtime: parseInt(formData.get('maxPlaytime')),
            age_min: parseInt(formData.get('ageMin')),
            rating: parseFloat(formData.get('rating')),
            user_id: 1 // Assuming user_id is 1 for now
        };

        fetch('http://localhost:3000/add-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameData)
        })
            .then((response) => response.json())
            .then((data) => {
                alert(data.message);
                addGameModal.style.display = 'none';
                fetchGames(); // Refresh the game list
            })
            .catch((error) => console.error('Error adding game:', error));
    });
});