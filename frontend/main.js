import init, { greet, Game } from './pkg/pong_game.js';

async function run() {
    try {
        // Initialize WASM
        await init();
        console.log('WASM loaded successfully');
        
        // Test basic function
        greet('World');
        
        // Test struct
        const game = new Game();
        console.log('Game message:', game.message);
        
        // Update page
        document.getElementById('output').innerHTML = `
            <p>✅ WASM module was able to load tee hee</p>
            <p>✅ Rust function was called too wow!!</p>
            <p>lil msg from jamie kim: ${game.message}</p>
        `;
        
    } catch (error) {
        console.error('Failed to load WASM:', error);
        document.getElementById('output').innerHTML = `
            <p>❌ Failed to load WASM: ${error}</p>
        `;
    }
}

run();