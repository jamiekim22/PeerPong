use wasm_bindgen::prelude::*;

// Import our modules
pub mod game;
pub mod physics;
pub use game::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    console_log!("Hello, {}! From Rust/WASM", name);
}

// WASM exports for the game
#[wasm_bindgen]
pub fn create_game() -> GameState {
    console_log!("Creating new Pong game!");
    GameState::new()
}

#[wasm_bindgen]
pub fn update_game(game: &mut GameState, delta_time: f32) {
    game.update(delta_time);
}

#[wasm_bindgen]
pub fn get_game_data(game: &GameState) -> String {
    game.serialize_state()
}

// Below is old Game struct for testing purposes
#[wasm_bindgen]
pub struct Game {
    message: String,
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Game {
        console_log!("we makin a game in rust wowzers");
        Game {
            message: String::from("hello erik lin!"),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }
}

#[wasm_bindgen]
pub fn move_paddle1(game: &mut GameState, target_y: f32, delta_time: f32) {
    game.move_paddle1(target_y, delta_time);
}

#[wasm_bindgen]
pub fn move_paddle2(game: &mut GameState, target_y: f32, delta_time: f32) {
    game.move_paddle2(target_y, delta_time);
}