import init, { greet, Game, create_game, update_game, get_game_data } from './pkg/pong_game.js';

let gameState = null;
let canvas = null;
let ctx = null;
let lastFrameTime = 0;

async function run() {
    try {
        // Initialize WASM
        await init();
        console.log('WASM loaded successfully');
        
        // Get canvas
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        // Test basic function
        greet('World');
        
        // Create game state
        gameState = create_game();
        console.log('Game state created');
        
        // Test serialization
        const serializedState = get_game_data(gameState);
        console.log('Serialized state:', serializedState);
        
        // Update page
        document.getElementById('output').innerHTML = `
            <p>✅ WASM module loaded successfully</p>
            <p>Game data: ${serializedState}</p>
        `;
        
        // Start game loop
        requestAnimationFrame(gameLoop);
        
    } catch (error) {
        console.error('Failed to load WASM:', error);
        document.getElementById('output').innerHTML = `
            <p>❌ Failed to load WASM: ${error}</p>
        `;
    }
}

function gameLoop(currentTime) {
    // Calculate delta time in seconds
    const deltaTime = lastFrameTime === 0 ? 0.016 : (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    
    // Update game state
    if (gameState) {
        update_game(gameState, deltaTime);
        render();
    }
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get game data
    const ball = gameState.ball;
    const paddle1 = gameState.paddle1;
    const paddle2 = gameState.paddle2;
    const score = gameState.score;
    
    // Draw paddles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw center line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw score
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${score.player1} : ${score.player2}`, canvas.width / 2, 30);
}

run();