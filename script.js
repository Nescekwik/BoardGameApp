document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('categoryFilter');
    const gameList = document.getElementById('gameList');

    // Function to display games
    function displayGames(games) {
        gameList.innerHTML = ''; // Clear the game list
        games.forEach(game => {
            const gameElement = document.createElement('div');
            gameElement.classList.add('game');
            gameElement.innerHTML = `
                <div class="game-header">${game.game_name}</div>
                <div class="game-description">${game.description.substring(0, 100)}...</div>
                <div class="game-details">
                    <p><strong>Release Date:</strong> ${game.release_date}</p>
                    <p><strong>Players:</strong> ${game.min_player} - ${game.max_player}</p>
                    <p><strong>Playtime:</strong> ${game.min_playtime} - ${game.max_playtime} mins</p>
                    <p><strong>Age:</strong> ${game.age_min}+</p>
                    <p><strong>Rating:</strong> ${game.rating}</p>
                    <p>${game.description}</p>
                    <a href="${game.url}" target="_blank">Visit game website</a>
                </div>
            `;
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
});