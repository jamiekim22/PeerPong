import init, { greet, Game, create_game, update_game, get_game_data, move_paddle1, move_paddle2 } from './pkg/pong_game.js';

let gameState = null;
let canvas = null;
let ctx = null;
let lastFrameTime = 0;

async function run() {
    try {
        await init();
        console.log('WASM loaded successfully');
        
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        greet('World'); // Test basic function
        
        gameState = create_game();
        console.log('Game state created');
        
        const serializedState = get_game_data(gameState);
        console.log('Serialized state:', serializedState);
        
        document.getElementById('output').innerHTML = `
            <p>✅ WASM module loaded successfully</p>
            <p> Controls (for now): W/S for left paddle, ↑/↓ for right paddle</p>
            <p>Game data: ${serializedState}</p>
        `;
        
        window.addEventListener('keydown', (e) => {
            const deltaTime = 0.016; // Approximate frame time
            
            switch(e.key) {
                case 'w': 
                case 'W':
                    move_paddle1(gameState, gameState.paddle1.y - 50, deltaTime);
                    break;
                case 's': 
                case 'S':
                    move_paddle1(gameState, gameState.paddle1.y + 50, deltaTime);
                    break;
                case 'ArrowUp': 
                    move_paddle2(gameState, gameState.paddle2.y - 50, deltaTime);
                    break;
                case 'ArrowDown': 
                    move_paddle2(gameState, gameState.paddle2.y + 50, deltaTime);
                    break;
            }
        });
        
        requestAnimationFrame(gameLoop);
        
    } catch (error) {
        console.error('Failed to load WASM:', error);
        document.getElementById('output').innerHTML = `
            <p>❌ Error loading WASM: ${error}</p>
        `;
    }
}

function gameLoop(currentTime) {
    const deltaTime = lastFrameTime === 0 ? 0.016 : (currentTime - lastFrameTime) / 1000; // Calculate delta time in seconds
    lastFrameTime = currentTime;
    
    if (gameState) {
        update_game(gameState, deltaTime);
        render();
    }

    requestAnimationFrame(gameLoop);
}

function render() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const ball = gameState.ball;
    const paddle1 = gameState.paddle1;
    const paddle2 = gameState.paddle2;
    const score = gameState.score;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${score.player1} : ${score.player2}`, canvas.width / 2, 30);
}

run();