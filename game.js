const wordChain = document.getElementById('wordChain');
const wordForm = document.getElementById('wordForm');
const wordInput = document.getElementById('wordInput');
const scoreDisplay = document.getElementById('score');
const streakDisplay = document.getElementById('streak');
const timerDisplay = document.getElementById('timer');
const message = document.getElementById('message');
const waterFact = document.getElementById('waterFact');
const jugAnimation = document.getElementById('jugAnimation');
const dailyChallengeBtn = document.getElementById('dailyChallengeBtn');
const dailyLabel = document.getElementById('dailyLabel');
const multiplayerToggle = document.getElementById('multiplayerToggle');
const currentPlayerLabel = document.getElementById('currentPlayerLabel');
const shareBtn = document.getElementById('shareBtn');

const waterFacts = [
    "Every $40 brings clean water to one person.",
    "771 million people lack access to clean water.",
    "A dripping tap can waste over 3,000 gallons a year.",
    "Access to clean water improves education and health.",
    "Women and girls spend 200 million hours daily collecting water."
];

let chain = [];
let score = 0;
let streak = 0;
let timer = 60;
let turns = 0;
let maxTurns = 10;
let timerInterval = null;
let gameActive = false;
let isDaily = false;
let multiplayer = false;
let players = [];
let currentPlayerIdx = 0;
let playerScores = [];

const bestScoreDisplay = document.createElement('span');
bestScoreDisplay.id = 'bestScore';
bestScoreDisplay.style.marginLeft = 'auto';
document.querySelector('.game-info').appendChild(bestScoreDisplay);

function getRandomWord() {
    // Use Datamuse API for a random 4-6 letter word
    return fetch('https://api.datamuse.com/words?sp=????|?????|??????&max=1000')
        .then(res => res.json())
        .then(words => {
            const filtered = words.filter(w => /^[a-zA-Z]{4,6}$/.test(w.word));
            return filtered[Math.floor(Math.random() * filtered.length)].word.toLowerCase();
        });
}

function validateWord(word, lastLetter) {
    // Check if word is valid and starts with lastLetter
    if (!/^[a-zA-Z]{4,12}$/.test(word)) return Promise.resolve(false);
    if (lastLetter && word[0] !== lastLetter) return Promise.resolve(false);
    // Use Datamuse API to check if word exists
    return fetch(`https://api.datamuse.com/words?sp=${word}&max=1`)
        .then(res => res.json())
        .then(data => data.length > 0 && data[0].word.toLowerCase() === word.toLowerCase());
}

function getBestScore() {
    return Number(localStorage.getItem('waterChainBestScore') || 0);
}

function setBestScore(newScore) {
    localStorage.setItem('waterChainBestScore', newScore);
}

function getTodaySeed() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

// Deterministic pseudo-random number generator (seeded)
function seededRandom(seed) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return () => {
        h += 0x6d2b79f5;
        let t = Math.imul(h ^ h >>> 15, 1 | h);
        t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function getDailyWord() {
    // Use Datamuse API, pick word based on today's seed
    return fetch('https://api.datamuse.com/words?sp=????|?????|??????&max=1000')
        .then(res => res.json())
        .then(words => {
            const filtered = words.filter(w => /^[a-zA-Z]{4,6}$/.test(w.word));
            const rand = seededRandom(getTodaySeed());
            return filtered[Math.floor(rand() * filtered.length)].word.toLowerCase();
        });
}

function getDailyBestScore() {
    return Number(localStorage.getItem('waterChainDailyBestScore_' + getTodaySeed()) || 0);
}

function setDailyBestScore(newScore) {
    localStorage.setItem('waterChainDailyBestScore_' + getTodaySeed(), newScore);
}

function updateDisplay() {
    wordChain.innerHTML = chain.map(w => `<span class="word">${w}</span>`).join(' ');
    scoreDisplay.textContent = `Score: ${score}`;
    streakDisplay.textContent = `Streak: ${streak}`;
    timerDisplay.textContent = `${timer}s`;
    jugAnimation.style.background = `linear-gradient(to top, #4fc3f7 ${Math.min(chain.length * 10, 100)}%, transparent ${100 - Math.min(chain.length * 10, 100)}%)`;
    if (isDaily) {
        bestScoreDisplay.textContent = `Daily Best: ${getDailyBestScore()}`;
    } else {
        bestScoreDisplay.textContent = `Best: ${getBestScore()}`;
    }
}

function showWaterFact() {
    waterFact.textContent = waterFacts[Math.floor(Math.random() * waterFacts.length)];
}

function endGame(reason) {
    gameActive = false;
    clearInterval(timerInterval);
    message.textContent = reason;
    showWaterFact();
    wordInput.disabled = true;
    if (isDaily) {
        if (score > getDailyBestScore()) {
            setDailyBestScore(score);
            updateDisplay();
            setTimeout(() => {
                message.textContent += " 🏆 New Daily Best!";
            }, 100);
        }
    } else {
        if (score > getBestScore()) {
            setBestScore(score);
            updateDisplay();
            setTimeout(() => {
                message.textContent += " 🏆 New Best Score!";
            }, 100);
        }
    }
    if (score > 0 && username) {
        submitScoreToLeaderboard(score).then(renderLeaderboard);
    } else {
        renderLeaderboard();
    }
    if (multiplayer) {
        let results = players.map((p, i) => `${p}: ${playerScores[i]}`).join('\n');
        setTimeout(() => {
            alert(`Game Over!\n\n${results}`);
        }, 200);
    }
}

function startGame(daily = false) {
    score = 0;
    streak = 0;
    timer = 60;
    turns = 0;
    chain = [];
    wordInput.disabled = false;
    message.textContent = '';
    waterFact.textContent = '';
    jugAnimation.style.background = `linear-gradient(to top, #4fc3f7 0%, transparent 100%)`;
    isDaily = daily;
    dailyLabel.style.display = daily ? 'inline' : 'none';
    let wordPromise = daily ? getDailyWord() : getRandomWord();
    wordPromise.then(word => {
        chain.push(word);
        updateDisplay();
        gameActive = true;
        wordInput.value = '';
        wordInput.focus();
        timerInterval = setInterval(() => {
            timer--;
            updateDisplay();
            if (timer <= 0) endGame("⏰ Time's up!");
        }, 1000);
    });
    if (multiplayer) {
        if (players.length < 2) promptPlayers();
        playerScores = Array(players.length).fill(0);
        currentPlayerIdx = 0;
    }
    updateCurrentPlayerDisplay();
}

function promptPlayers() {
    let num = prompt("How many players? (2-4)", "2");
    num = Math.max(2, Math.min(4, parseInt(num, 10) || 2));
    players = [];
    for (let i = 0; i < num; i++) {
        let name = prompt(`Enter name for Player ${i + 1}:`, `Player ${i + 1}`);
        players.push((name || `Player ${i + 1}`).substring(0, 16));
    }
    playerScores = Array(players.length).fill(0);
    currentPlayerIdx = 0;
}

function updateCurrentPlayerDisplay() {
    if (multiplayer) {
        currentPlayerLabel.style.display = 'inline';
        currentPlayerLabel.textContent = `Turn: ${players[currentPlayerIdx]}`;
    } else {
        currentPlayerLabel.style.display = 'none';
    }
}

function getShareMessage() {
    let msg = multiplayer && players.length > 1
        ? `We played The Water Chain Game!\n\n${players.map((p, i) => `${p}: ${playerScores[i]}`).join('\n')}`
        : `I scored ${score} in The Water Chain Game!`;
    return `${msg}\n#FlowForWater`;
}

shareBtn.addEventListener('click', () => {
    const text = getShareMessage();
    if (navigator.share) {
        navigator.share({
            title: "The Water Chain Game",
            text,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert("Share message copied to clipboard!");
        });
    }
});

wordForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!gameActive) return;
    const word = wordInput.value.trim().toLowerCase();
    const lastLetter = chain[chain.length - 1].slice(-1);
    if (chain.includes(word)) {
        message.textContent = "Word already used!";
        return;
    }
    validateWord(word, lastLetter).then(valid => {
        if (!valid) {
            message.textContent = "Invalid word!";
            streak = 0;
            updateDisplay();
            return;
        }
        chain.push(word);
        score += 10;
        streak += 1;
        turns += 1;
        if (multiplayer) {
            playerScores[currentPlayerIdx] += 10;
        }
        message.textContent = '';
        updateDisplay();
        wordInput.value = '';
        if (turns >= maxTurns) {
            endGame("🎉 Turn limit reached!");
        } else if (streak % 5 === 0) {
            showWaterFact();
        }
        if (multiplayer) {
            currentPlayerIdx = (currentPlayerIdx + 1) % players.length;
            updateCurrentPlayerDisplay();
            setTimeout(() => {
                alert(`Pass the device to ${players[currentPlayerIdx]}`);
            }, 100);
        }
    });
});

dailyChallengeBtn.addEventListener('click', () => {
    startGame(true);
});

// Firebase config (replace with your own config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    // ...other config...
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let username = localStorage.getItem('waterChainUsername') || '';

const usernameForm = document.getElementById('usernameForm');
const usernameInput = document.getElementById('usernameInput');
const leaderboardDiv = document.getElementById('leaderboard');

if (username) {
    usernameInput.value = username;
}

usernameForm.addEventListener('submit', e => {
    e.preventDefault();
    username = usernameInput.value.trim().substring(0, 16);
    localStorage.setItem('waterChainUsername', username);
    usernameInput.blur();
    renderLeaderboard();
});

function submitScoreToLeaderboard(score) {
    if (!username) return;
    return db.collection('leaderboard').add({
        username,
        score,
        date: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function fetchLeaderboard() {
    return db.collection('leaderboard')
        .orderBy('score', 'desc')
        .limit(10)
        .get()
        .then(snapshot => snapshot.docs.map(doc => doc.data()));
}

function renderLeaderboard() {
    leaderboardDiv.innerHTML = '<h2>🏆 Leaderboard</h2><div>Loading...</div>';
    fetchLeaderboard().then(scores => {
        if (!scores.length) {
            leaderboardDiv.innerHTML = '<h2>🏆 Leaderboard</h2><div>No scores yet.</div>';
            return;
        }
        const list = scores.map((s, i) =>
            `<li>${i + 1}. <strong>${s.username}</strong>: ${s.score}</li>`
        ).join('');
        leaderboardDiv.innerHTML = `<h2>🏆 Leaderboard</h2><ol class="leaderboard-list">${list}</ol>`;
    });
}

window.onload = () => {
    renderLeaderboard();
    startGame();
};
