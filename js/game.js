const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shootButton = document.getElementById('shootButton');
const resetButton = document.getElementById('resetButton');
const scoreDisplay = document.getElementById('score');
const feedbackDisplay = document.getElementById('feedback');

let score = 0;
let ball = {
    x: 50,
    y: 250,
    radius: 15,
    vx: 0,
    vy: 0,
    shooting: false,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0
};
const hoop = {
    x: (400 - 60) / 2, // Center: (400 - 60) / 2 = 170
    y: 50,
    width: 60,
    height: 10,
    rimRadius: 15
};

// Load images
const ballImg = new Image();
ballImg.src = 'assets/ball.png';
let ballImageLoaded = false;
ballImg.onload = () => { ballImageLoaded = true; };
ballImg.onerror = () => {
    console.error('Failed to load assets/ball.png');
    feedbackDisplay.textContent = 'Error: Basketball image not found!';
};

const hoopImg = new Image();
hoopImg.src = 'assets/hoop.png';
let hoopImageLoaded = false;
hoopImg.onload = () => { hoopImageLoaded = true; };
hoopImg.onerror = () => {
    console.error('Failed to load assets/hoop.png');
    feedbackDisplay.textContent = 'Error: Hoop image not found!';
};

// Draw basketball
function drawBall() {
    if (ballImageLoaded) {
        ctx.drawImage(ballImg, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
    } else {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6200';
        ctx.fill();
    }
}

// Draw hoop
function drawHoop() {
    if (hoopImageLoaded) {
        ctx.drawImage(hoopImg, hoop.x - 10, hoop.y - 40, 80, 80);
    } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(hoop.x - 10, hoop.y - 40, 80, 50);
        const gradient = ctx.createLinearGradient(hoop.x, hoop.y, hoop.x + hoop.width, hoop.y);
        gradient.addColorStop(0, '#ff4500');
        gradient.addColorStop(1, '#cc3700');
        ctx.fillStyle = gradient;
        ctx.fillRect(hoop.x, hoop.y, hoop.width, hoop.height);
        ctx.beginPath();
        ctx.arc(hoop.x + hoop.width / 2, hoop.y + hoop.height + hoop.rimRadius, hoop.rimRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff4500';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(hoop.x + (i * hoop.width) / 7, hoop.y + hoop.height);
            ctx.lineTo(hoop.x + hoop.width / 2, hoop.y + hoop.height + hoop.rimRadius * 2);
            ctx.stroke();
        }
    }
}

// Main draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawHoop();
    drawBall();

    if (ball.shooting) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += 0.3;
        if (ball.y <= hoop.y + hoop.height + hoop.rimRadius &&
            ball.x >= hoop.x && ball.x <= hoop.x + hoop.width) {
            if (Math.random() < 0.7) {
                score++;
                scoreDisplay.textContent = `Score: ${score}`;
                feedbackDisplay.textContent = 'Nice Shot!';
            } else {
                feedbackDisplay.textContent = 'Missed!';
            }
            resetBall();
        }
        if (ball.y > canvas.height || ball.x > canvas.width || ball.x < 0) {
            feedbackDisplay.textContent = 'Missed!';
            resetBall();
        }
    }

    requestAnimationFrame(draw);
}

// Reset ball to random x on y=250
function resetBall() {
    ball.x = 20 + Math.random() * (400 - 40); // x: 20 to 380
    ball.y = 250; // Fixed row
    ball.vx = 0;
    ball.vy = 0;
    ball.shooting = false;
    ball.dragging = false;
}

// Reset game
function resetGame() {
    score = 0;
    scoreDisplay.textContent = 'Score: 0';
    feedbackDisplay.textContent = '';
    resetBall();
}

// Shoot via button toward hoop
function shootBall() {
    if (!ball.shooting && !ball.dragging) {
        ball.shooting = true;
        const dx = (hoop.x + hoop.width / 2) - ball.x; // Distance to hoop center
        const dy = (hoop.y + hoop.height) - ball.y;
        const distance = Math.hypot(dx, dy);
        const speed = 10 + Math.random() * 2; // Random speed
        ball.vx = (dx / distance) * speed; // Normalize and scale
        ball.vy = (dy / distance) * speed - 2; // Adjust upward
        feedbackDisplay.textContent = '';
    }
}

// Drag-to-shoot
canvas.addEventListener('mousedown', (e) => {
    if (!ball.shooting) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        if (Math.hypot(mouseX - ball.x, mouseY - ball.y) < ball.radius) {
            ball.dragging = true;
            ball.dragStartX = mouseX;
            ball.dragStartY = mouseY;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (ball.dragging) {
        const rect = canvas.getBoundingClientRect();
        ball.x = e.clientX - rect.left;
        ball.y = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (ball.dragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        ball.shooting = true;
        ball.dragging = false;
        ball.vx = (mouseX - ball.dragStartX) * 0.05;
        ball.vy = (mouseY - ball.dragStartY) * 0.05;
        feedbackDisplay.textContent = '';
    }
});

shootButton.addEventListener('click', shootBall);
resetButton.addEventListener('click', resetGame);

// Initialize ball position
resetBall();
draw();