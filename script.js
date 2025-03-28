// Game configuration
var gameConfig = {
    theme: 'numbers',
    players: 4,
    gridSize: 4,
    currentPlayer: 0,
    moves: 0,
    startTime: null,
    timerInterval: null,
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    isLocked: false,
    playerScores: [],
    highScores: []
};

// DOM Elements
var setupScreen = document.getElementById('setupScreen');
var gameScreen = document.getElementById('gameScreen');
var gameBoard = document.getElementById('gameBoard');
var playersContainer = document.getElementById('playersContainer');
var moveCounter = document.getElementById('moveCounter');
var timer = document.getElementById('timer');
var progressBar = document.getElementById('progressBar');
var startGameBtn = document.getElementById('startGameBtn');
var restartBtn = document.getElementById('restartBtn');
var newGameBtn = document.getElementById('newGameBtn');
var themeOptions = document.querySelectorAll('[data-theme]');
var playerOptions = document.querySelectorAll('[data-players]');
var gridOptions = document.querySelectorAll('[data-grid]');
var victoryOverlay = document.getElementById('victoryOverlay');
var victoryMessage = document.getElementById('victoryMessage');
var victoryStats = document.getElementById('victoryStats');
var playAgainBtn = document.getElementById('playAgainBtn');
var newGameBtn2 = document.getElementById('newGameBtn2');

// Setup event listeners
for (var i = 0; i < themeOptions.length; i++) {
    themeOptions[i].addEventListener('click', function() {
        for (var j = 0; j < themeOptions.length; j++) {
            themeOptions[j].classList.remove('selected');
        }
        this.classList.add('selected');
        gameConfig.theme = this.dataset.theme;
    });
}

for (var i = 0; i < playerOptions.length; i++) {
    playerOptions[i].addEventListener('click', function() {
        for (var j = 0; j < playerOptions.length; j++) {
            playerOptions[j].classList.remove('selected');
        }
        this.classList.add('selected');
        gameConfig.players = parseInt(this.dataset.players);
    });
}

for (var i = 0; i < gridOptions.length; i++) {
    gridOptions[i].addEventListener('click', function() {
        for (var j = 0; j < gridOptions.length; j++) {
            gridOptions[j].classList.remove('selected');
        }
        this.classList.add('selected');
        gameConfig.gridSize = parseInt(this.dataset.grid);
    });
}

startGameBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
newGameBtn.addEventListener('click', showSetupScreen);
playAgainBtn.addEventListener('click', function() {
    hideVictoryScreen();
    restartGame();
});
newGameBtn2.addEventListener('click', function() {
    hideVictoryScreen();
    showSetupScreen();
});

// Try to load high scores from local storage
try {
    var savedScores = localStorage.getItem('memoryGameHighScores');
    if (savedScores) {
        gameConfig.highScores = JSON.parse(savedScores);
    }
} catch (e) {
    console.log('Could not load high scores');
}

// Game functions
function startGame() {
    // Initialize game state
    gameConfig.moves = 0;
    gameConfig.matchedPairs = 0;
    gameConfig.flippedCards = [];
    gameConfig.isLocked = false;
    gameConfig.currentPlayer = 0;
    
    // Initialize player scores array
    gameConfig.playerScores = [];
    for (var i = 0; i < gameConfig.players; i++) {
        gameConfig.playerScores.push(0);
    }
    
    gameConfig.totalPairs = (gameConfig.gridSize * gameConfig.gridSize) / 2;
    
    // Update UI
    moveCounter.textContent = '0';
    progressBar.style.width = '0%';
    
    // Transition between screens with animation
    setupScreen.classList.add('fadeOut');
    
    setTimeout(function() {
        setupScreen.classList.add('hidden');
        setupScreen.classList.remove('fadeOut');
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('fadeIn');
        
        // Create game board
        createGameBoard();
        
        // Create player indicators
        createPlayerIndicators();
        
        // Start timer
        startTimer();
        
        // Play start sound
        playSound('start');
        
        setTimeout(function() {
            gameScreen.classList.remove('fadeIn');
        }, 500);
    }, 500);
}

function createGameBoard() {
    // Clear existing board
    gameBoard.innerHTML = '';
    
    // Set grid template
    gameBoard.style.gridTemplateColumns = 'repeat(' + gameConfig.gridSize + ', 1fr)';
    
    // Create card pairs
    var pairs = [];
    var totalPairs = (gameConfig.gridSize * gameConfig.gridSize) / 2;
    
    for (var i = 1; i <= totalPairs; i++) {
        pairs.push(i, i); // Add each number twice for pairs
    }
    
    // Shuffle the pairs
    shuffleArray(pairs);
    
    // Create cards
    for (var i = 0; i < pairs.length; i++) {
        var value = pairs[i];
        var index = i;
        
        var card = document.createElement('div');
        card.className = 'card';
        card.dataset.value = value;
        card.dataset.index = index;
        
        var cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        
        var cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        
        // Set content based on theme
        if (gameConfig.theme === 'numbers') {
            cardBack.textContent = value;
        } else if (gameConfig.theme === 'icons') {
            // Use simple ASCII icons for compatibility
            var icons = ['♠', '♥', '♦', '♣', '★', '☺', '♪', '✓', '✗', '⚑', '⚐', '☎', '✉', '☀', '☁', '☂', '☃', '☼', '☾', '❄'];
            cardBack.textContent = icons[(value - 1) % icons.length];
        } else if (gameConfig.theme === 'colors') {
            // Use colors instead of text
            var colors = [
                '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
                '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', 
                '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', 
                '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40',
                '#8D6E63', '#78909C', '#26A69A', '#9CCC65'
            ];
            cardBack.textContent = '';
            cardBack.style.backgroundColor = colors[(value - 1) % colors.length];
        }
        
        card.appendChild(cardFront);
        card.appendChild(cardBack);
        
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
        
        // Add a small delay for each card to create a cascade effect
        (function(index) {
            setTimeout(function() {
                card.style.opacity = '1';
            }, index * 30);
        })(index);
    }
}

function createPlayerIndicators() {
    playersContainer.innerHTML = '';
    
    for (var i = 0; i < gameConfig.players; i++) {
        var player = document.createElement('div');
        player.className = 'player';
        player.id = 'player-' + i;
        if (i === gameConfig.currentPlayer) {
            player.classList.add('active');
        }
        
        player.innerHTML = 
            'Player ' + (i + 1) +
            '<span class="player-score">0</span>';
        
        playersContainer.appendChild(player);
    }
}

function flipCard() {
    // Prevent flipping if game is locked or card is already flipped/matched
    if (gameConfig.isLocked || 
        this.classList.contains('flipped') || 
        this.classList.contains('matched')) {
        return;
    }
    
    // Flip the card
    this.classList.add('flipped');
    gameConfig.flippedCards.push(this);
    
    // Play flip sound
    playSound('flip');
    
    // Check if two cards are flipped
    if (gameConfig.flippedCards.length === 2) {
        gameConfig.moves++;
        moveCounter.textContent = gameConfig.moves;
        gameConfig.isLocked = true;
        
        // Check for match
        var card1 = gameConfig.flippedCards[0];
        var card2 = gameConfig.flippedCards[1];
        
        if (card1.dataset.value === card2.dataset.value) {
            // Match found
            setTimeout(function() {
                card1.classList.add('matched');
                card2.classList.add('matched');
                gameConfig.flippedCards = [];
                gameConfig.isLocked = false;
                gameConfig.matchedPairs++;
                
                // Update progress bar
                updateProgressBar();
                
                // Update player score
                gameConfig.playerScores[gameConfig.currentPlayer]++;
                updatePlayerScores();
                
                // Play match sound
                playSound('match');
                
                // Check if game is complete
                if (gameConfig.matchedPairs === gameConfig.totalPairs) {
                    endGame();
                }
            }, 500);
        } else {
            // No match
            setTimeout(function() {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                gameConfig.flippedCards = [];
                gameConfig.isLocked = false;
                
                // Switch to next player
                if (gameConfig.players > 1) {
                    switchPlayer();
                }
            }, 1000);
        }
    }
}

function updateProgressBar() {
    var progress = (gameConfig.matchedPairs / gameConfig.totalPairs) * 100;
    progressBar.style.width = progress + '%';
}

function switchPlayer() {
    // Remove active class from current player
    document.getElementById('player-' + gameConfig.currentPlayer).classList.remove('active');
    
    // Move to next player
    gameConfig.currentPlayer = (gameConfig.currentPlayer + 1) % gameConfig.players;
    
    // Add active class to new current player
    document.getElementById('player-' + gameConfig.currentPlayer).classList.add('active');
}

function updatePlayerScores() {
    for (var i = 0; i < gameConfig.players; i++) {
        var playerElement = document.getElementById('player-' + i);
        var scoreElement = playerElement.querySelector('.player-score');
        scoreElement.textContent = gameConfig.playerScores[i];
    }
}

function startTimer() {
    // Reset timer
    gameConfig.startTime = new Date();
    
    // Clear any existing interval
    if (gameConfig.timerInterval) {
        clearInterval(gameConfig.timerInterval);
    }
    
    // Start new interval
    gameConfig.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    var currentTime = new Date();
    var elapsedTime = Math.floor((currentTime - gameConfig.startTime) / 1000);
    var minutes = Math.floor(elapsedTime / 60).toString();
    if (minutes.length < 2) minutes = '0' + minutes;
    var seconds = (elapsedTime % 60).toString();
    if (seconds.length < 2) seconds = '0' + seconds;
    timer.textContent = minutes + ':' + seconds;
}

function endGame() {
    // Stop timer
    clearInterval(gameConfig.timerInterval);
    
    // Get final time
    var finalTime = timer.textContent;
    var timeParts = finalTime.split(':');
    var totalSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
    
    // Save score to high scores if single player
    if (gameConfig.players === 1) {
        var newScore = {
            moves: gameConfig.moves,
            time: totalSeconds,
            timeFormatted: finalTime,
            gridSize: gameConfig.gridSize,
            date: new Date().toLocaleDateString()
        };
        
        gameConfig.highScores.push(newScore);
        gameConfig.highScores.sort(function(a, b) {
            // Sort by grid size (descending), then moves (ascending), then time (ascending)
            if (a.gridSize !== b.gridSize) return b.gridSize - a.gridSize;
            if (a.moves !== b.moves) return a.moves - b.moves;
            return a.time - b.time;
        });
        
        // Keep only top 5 scores
        if (gameConfig.highScores.length > 5) {
            gameConfig.highScores = gameConfig.highScores.slice(0, 5);
        }
        
        // Save to local storage
        try {
            localStorage.setItem('memoryGameHighScores', JSON.stringify(gameConfig.highScores));
        } catch (e) {
            console.log('Could not save high scores');
        }
    }
    
    // Create enhanced victory effects
    createVictoryEffects();
    
    // Find winner (if multiplayer)
    var winnerMessage = '';
    var statsMessage = '';
    
    if (gameConfig.players > 1) {
        var maxScore = -1;
        var winners = [];
        
        for (var i = 0; i < gameConfig.players; i++) {
            if (gameConfig.playerScores[i] > maxScore) {
                maxScore = gameConfig.playerScores[i];
                winners = [i];
            } else if (gameConfig.playerScores[i] === maxScore) {
                winners.push(i);
            }
        }
        
        // Highlight winner(s) in the player indicators
        for (var i = 0; i < gameConfig.players; i++) {
            var playerElement = document.getElementById('player-' + i);
            playerElement.classList.remove('active');
            if (isInArray(winners, i)) {
                playerElement.classList.add('winner');
            }
        }
        
        if (winners.length === 1) {
            winnerMessage = 'اللاعب ' + (winners[0] + 1) + ' فاز!';
        } else {
            var winnersList = '';
            for (var k = 0; k < winners.length; k++) {
                if (k > 0) {
                    winnersList += ' و ';
                }
                winnersList += (winners[k] + 1);
            }
            winnerMessage = 'تعادل بين اللاعبين ' + winnersList + '!';
        }
        
        statsMessage = 'عدد الحركات: ' + gameConfig.moves + '<br>الوقت: ' + finalTime;
    } else {
        // Single player - show score and high score info
        var highScoreMessage = '';
        var relevantScores = [];
        for (var i = 0; i < gameConfig.highScores.length; i++) {
            if (gameConfig.highScores[i].gridSize === gameConfig.gridSize) {
                relevantScores.push(gameConfig.highScores[i]);
            }
        }
        
        if (relevantScores.length > 0) {
            var bestScore = relevantScores[0];
            if (gameConfig.moves <= bestScore.moves && totalSeconds <= bestScore.time) {
                highScoreMessage = '<br>نتيجة قياسية جديدة!';
            } else {
                highScoreMessage = '<br>أفضل نتيجة: ' + bestScore.moves + ' حركة في ' + bestScore.timeFormatted;
            }
        }
        
        winnerMessage = 'مبروك! لقد فزت!';
        statsMessage = 'عدد الحركات: ' + gameConfig.moves + '<br>الوقت: ' + finalTime + highScoreMessage;
    }
    
    // Show victory screen
    showVictoryScreen(winnerMessage, statsMessage);
    
    // Play win sound
    playSound('win');
}

function isInArray(array, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === value) {
            return true;
        }
    }
    return false;
}

function showVictoryScreen(message, stats) {
    victoryMessage.innerHTML = message;
    victoryStats.innerHTML = stats;
    victoryOverlay.classList.add('show');
    
    // Add background flash animation
    victoryOverlay.style.animation = 'backgroundFlash 4s infinite';
    
    // Create fireworks
    createFireworks();
}

function hideVictoryScreen() {
    victoryOverlay.classList.remove('show');
    victoryOverlay.style.animation = '';
    
    // Remove any remaining fireworks
    var fireworks = document.querySelectorAll('.firework');
    for (var i = 0; i < fireworks.length; i++) {
        document.body.removeChild(fireworks[i]);
    }
}

function createVictoryEffects() {
    // Create enhanced confetti
    createEnhancedConfetti();
    
    // Make all matched cards do a victory dance
    var matchedCards = document.querySelectorAll('.card.matched');
    for (var i = 0; i < matchedCards.length; i++) {
        (function(card, index) {
            setTimeout(function() {
                card.style.animation = 'pulse 0.5s infinite alternate';
                
                // Create particle explosion from each card
                createParticleExplosion(card);
            }, index * 100);
        })(matchedCards[i], i);
    }
    
    // Flash the game board background
    gameBoard.style.animation = 'glow 1s infinite alternate';
}

function createEnhancedConfetti() {
    var confettiCount = 200;
    var colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700', '#ff9800'];
    
    for (var i = 0; i < confettiCount; i++) {
        var confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.opacity = Math.random().toString();
        confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
        
        // Random size
        var size = Math.random() * 15 + 5;
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        
        // Random shape
        var shapeType = Math.floor(Math.random() * 4);
        if (shapeType === 0) {
            confetti.style.borderRadius = '50%';
        } else if (shapeType === 1) {
            confetti.style.borderRadius = '0';
        } else if (shapeType === 2) {
            confetti.style.width = size / 2 + 'px';
            confetti.style.height = size + 'px';
            confetti.style.borderRadius = '0';
        } else {
            confetti.style.width = '0';
            confetti.style.height = '0';
            confetti.style.borderLeft = size/2 + 'px solid transparent';
            confetti.style.borderRight = size/2 + 'px solid transparent';
            confetti.style.borderBottom = size + 'px solid ' + colors[Math.floor(Math.random() * colors.length)];
            confetti.style.backgroundColor = 'transparent';
        }
        
        document.body.appendChild(confetti);
        
        // Animate falling with more varied paths
        var duration = Math.random() * 4 + 3;
        var delay = Math.random() * 3;
        var initialRotation = Math.random() * 360;
        var finalRotation = initialRotation + Math.random() * 720 - 360;
        
        // Use old-style animation with keyframes
        var keyframes = [
            { 
                transform: 'translate3d(0, 0, 0) rotate(' + initialRotation + 'deg)', 
                opacity: 1 
            },
            { 
                transform: 'translate3d(' + (Math.random() * 200 - 100) + 'px, ' + (Math.random() * 50) + 'px, 0) rotate(' + (initialRotation + Math.random() * 180 - 90) + 'deg)', 
                opacity: 1,
                offset: 0.3
            },
            { 
                transform: 'translate3d(' + (Math.random() * 400 - 200) + 'px, 100vh, 0) rotate(' + finalRotation + 'deg)', 
                opacity: 0 
            }
        ];
        
        // Apply animation using setTimeout for ES4 compatibility
        (function(confetti, duration, delay) {
            setTimeout(function() {
                confetti.style.transition = 'all ' + duration + 's cubic-bezier(0.215, 0.610, 0.355, 1.000)';
                confetti.style.transform = 'translate3d(' + (Math.random() * 400 - 200) + 'px, 100vh, 0) rotate(' + finalRotation + 'deg)';
                confetti.style.opacity = '0';
            }, delay * 1000);
            
            // Remove confetti after animation
            setTimeout(function() {
                if (document.body.contains(confetti)) {
                    document.body.removeChild(confetti);
                }
            }, (duration + delay) * 1000);
        })(confetti, duration, delay);
    }
}

function createParticleExplosion(element) {
    var rect = element.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    
    var particleCount = 20;
    var colors = ['#ffd700', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'];
    
    for (var i = 0; i < particleCount; i++) {
        var particle = document.createElement('div');
        particle.className = 'confetti';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';
        particle.style.position = 'fixed';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.opacity = '1';
        
        document.body.appendChild(particle);
        
        var angle = Math.random() * Math.PI * 2;
        var distance = Math.random() * 100 + 50;
        var duration = Math.random() * 1 + 0.5;
        
        var destX = centerX + Math.cos(angle) * distance;
        var destY = centerY + Math.sin(angle) * distance;
        
        // Apply animation using setTimeout for ES4 compatibility
        (function(particle, destX, centerX, destY, centerY, duration) {
            setTimeout(function() {
                particle.style.transition = 'all ' + duration + 's cubic-bezier(0.215, 0.610, 0.355, 1.000)';
                particle.style.transform = 'translate(' + (destX - centerX) + 'px, ' + (destY - centerY) + 'px) scale(0)';
                particle.style.opacity = '0';
            }, 10);
            
            // Remove particle after animation
            setTimeout(function() {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                }
            }, duration * 1000);
        })(particle, destX, centerX, destY, centerY, duration);
    }
}

function createFireworks() {
    var fireworksInterval = setInterval(function() {
        if (!victoryOverlay.classList.contains('show')) {
            clearInterval(fireworksInterval);
            return;
        }
        
        var startX = Math.random() * window.innerWidth;
        var startY = window.innerHeight;
        var endX = startX + (Math.random() * 200 - 100);
        var endY = Math.random() * window.innerHeight * 0.5;
        
        // Create rocket
        var rocket = document.createElement('div');
        rocket.className = 'firework';
        rocket.style.left = startX + 'px';
        rocket.style.top = startY + 'px';
        rocket.style.backgroundColor = '#fff';
        document.body.appendChild(rocket);
        
        // Animate rocket using setTimeout for ES4 compatibility
        setTimeout(function() {
            rocket.style.transition = 'all 1s cubic-bezier(0.215, 0.610, 0.355, 1.000)';
            rocket.style.transform = 'translate(' + (endX - startX) + 'px, ' + (endY - startY) + 'px)';
            rocket.style.opacity = '0.8';
        }, 10);
        
        // Create explosion after rocket reaches top
        setTimeout(function() {
            if (document.body.contains(rocket)) {
                document.body.removeChild(rocket);
            }
            
            // Create explosion particles
            var colors = ['#ff0000', '#ffd700', '#00ff00', '#0000ff', '#ff00ff', '#ffffff'];
            var particleCount = 30;
            
            for (var i = 0; i < particleCount; i++) {
                var particle = document.createElement('div');
                particle.className = 'firework';
                particle.style.left = endX + 'px';
                particle.style.top = endY + 'px';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                particle.style.width = '4px';
                particle.style.height = '4px';
                document.body.appendChild(particle);
                
                var angle = Math.random() * Math.PI * 2;
                var distance = Math.random() * 100 + 50;
                var duration = Math.random() * 1 + 0.5;
                
                // Apply animation using setTimeout for ES4 compatibility
                (function(particle, angle, distance, duration) {
                    setTimeout(function() {
                        particle.style.transition = 'all ' + duration + 's cubic-bezier(0.215, 0.610, 0.355, 1.000)';
                        particle.style.transform = 'translate(' + (Math.cos(angle) * distance) + 'px, ' + (Math.sin(angle) * distance) + 'px) scale(0)';
                        particle.style.opacity = '0';
                    }, 10);
                    
                    // Remove particle after animation
                    setTimeout(function() {
                        if (document.body.contains(particle)) {
                            document.body.removeChild(particle);
                        }
                    }, duration * 1000);
                })(particle, angle, distance, duration);
            }
            
            // Play explosion sound
            playSound('explosion');
            
        }, 1000);
        
    }, 2000); // Launch a new firework every 2 seconds
}

function restartGame() {
    // Reset game state but keep configuration
    gameConfig.moves = 0;
    gameConfig.matchedPairs = 0;
    gameConfig.flippedCards = [];
    gameConfig.isLocked = false;
    gameConfig.currentPlayer = 0;
    
    // Initialize player scores array
    gameConfig.playerScores = [];
    for (var i = 0; i < gameConfig.players; i++) {
        gameConfig.playerScores.push(0);
    }
    
    // Update UI
    moveCounter.textContent = '0';
    progressBar.style.width = '0%';
    
    // Remove any animations
    gameBoard.style.animation = '';
    
    // Create new game board
    createGameBoard();
    
    // Reset player indicators
    createPlayerIndicators();
    
    // Restart timer
    startTimer();
    
    // Play start sound
    playSound('start');
}

function showSetupScreen() {
    // Stop timer
    clearInterval(gameConfig.timerInterval);
    
    // Transition between screens with animation
    gameScreen.classList.add('fadeOut');
    setTimeout(function() {
        gameScreen.classList.add('hidden');
        gameScreen.classList.remove('fadeOut');
        setupScreen.classList.remove('hidden');
        setupScreen.classList.add('fadeIn');
        
        setTimeout(function() {
            setupScreen.classList.remove('fadeIn');
        }, 500);
    }, 500);
}

// Utility functions
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function playSound(type) {
    // Simple sound effects using AudioContext
    try {
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'flip') {
            oscillator.type = 'sine';
            oscillator.frequency.value = 300;
            gainNode.gain.value = 0.1;
            oscillator.start();
            setTimeout(function() { 
                oscillator.stop(); 
            }, 150);
        } else if (type === 'match') {
            oscillator.type = 'sine';
            oscillator.frequency.value = 500;
            gainNode.gain.value = 0.1;
            oscillator.start();
            setTimeout(function() {
                oscillator.frequency.value = 700;
                setTimeout(function() { 
                    oscillator.stop(); 
                }, 150);
            }, 150);
        } else if (type === 'win') {
            oscillator.type = 'sine';
            oscillator.frequency.value = 400;
            gainNode.gain.value = 0.1;
            oscillator.start();
            setTimeout(function() {
                oscillator.frequency.value = 600;
                setTimeout(function() {
                    oscillator.frequency.value = 800;
                    oscillator.type = 'triangle';
                    setTimeout(function() {
                        oscillator.frequency.value = 1000;
                        setTimeout(function() {
                            oscillator.frequency.value = 1200;
                            setTimeout(function() { 
                                oscillator.stop(); 
                            }, 200);
                        }, 200);
                    }, 200);
                }, 200);
            }, 200);
        } else if (type === 'explosion') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 100;
            gainNode.gain.value = 0.1;
            oscillator.start();
            
            // Create explosion sound effect
            var now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            oscillator.frequency.setValueAtTime(100, now);
            oscillator.frequency.exponentialRampToValueAtTime(20, now + 0.5);
            
            setTimeout(function() { 
                oscillator.stop(); 
            }, 500);
        } else if (type === 'start') {
            oscillator.type = 'sine';
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0.1;
            oscillator.start();
            setTimeout(function() {
                oscillator.frequency.value = 400;
                setTimeout(function() { 
                    oscillator.stop(); 
                }, 150);
            }, 150);
        }
    } catch (e) {
        // Silently fail if audio is not supported
        console.log('Audio not supported');
    }
}

// Add touch support for mobile devices
document.addEventListener('DOMContentLoaded', function() {
    // Increase touch target size on mobile
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        var style = document.createElement('style');
        style.innerHTML = 
            '.card, button, .option-btn {' +
            '    cursor: pointer;' +
            '    -webkit-tap-highlight-color: rgba(0,0,0,0);' +
            '}' +
            '.card {' +
            '    min-width: 60px;' +
            '    min-height: 60px;' +
            '}';
        document.head.appendChild(style);
    }
});

// Prevent zooming on double tap for iOS
var lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    var now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);