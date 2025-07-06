use wasm_bindgen::prelude::*;

pub const FIELD_WIDTH: f32 = 800.0;
pub const FIELD_HEIGHT: f32 = 400.0;
pub const PADDLE_WIDTH: f32 = 10.0;
pub const PADDLE_HEIGHT: f32 = 80.0;
pub const BALL_RADIUS: f32 = 8.0;
pub const PADDLE_SPEED: f32 = 300.0; // pixels per second
pub const BALL_SPEED: f32 = 250.0; // pixels per second

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Paddle {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
}

#[wasm_bindgen]
impl Paddle {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f32, y: f32) -> Paddle {
        Paddle {
            x,
            y,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn x(&self) -> f32 { self.x }
    
    #[wasm_bindgen(getter)]
    pub fn y(&self) -> f32 { self.y }
    
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> f32 { self.width }
    
    #[wasm_bindgen(getter)]
    pub fn height(&self) -> f32 { self.height }
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Ball {
    x: f32,
    y: f32,
    dx: f32, 
    dy: f32, 
    radius: f32,
}

#[wasm_bindgen]
impl Ball {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f32, y: f32, dx: f32, dy: f32) -> Ball {
        Ball {
            x,
            y,
            dx,
            dy,
            radius: BALL_RADIUS,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn x(&self) -> f32 { self.x }
    
    #[wasm_bindgen(getter)]
    pub fn y(&self) -> f32 { self.y }
    
    #[wasm_bindgen(getter)]
    pub fn dx(&self) -> f32 { self.dx }
    
    #[wasm_bindgen(getter)]
    pub fn dy(&self) -> f32 { self.dy }
    
    #[wasm_bindgen(getter)]
    pub fn radius(&self) -> f32 { self.radius }
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Score {
    player1: u32,
    player2: u32,
}

#[wasm_bindgen]
impl Score {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Score {
        Score {
            player1: 0,
            player2: 0,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn player1(&self) -> u32 { self.player1 }
    
    #[wasm_bindgen(getter)]
    pub fn player2(&self) -> u32 { self.player2 }
}

#[wasm_bindgen]
pub struct GameState {
    paddle1: Paddle,
    paddle2: Paddle,
    ball: Ball,
    score: Score,
}

#[wasm_bindgen]
impl GameState {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GameState {
        // Initialize paddles
        let paddle1 = Paddle::new(20.0, FIELD_HEIGHT / 2.0 - PADDLE_HEIGHT / 2.0);
        let paddle2 = Paddle::new(FIELD_WIDTH - 20.0 - PADDLE_WIDTH, FIELD_HEIGHT / 2.0 - PADDLE_HEIGHT / 2.0);
        
        // Initialize ball with random direction
        let initial_angle = if js_sys::Math::random() > 0.5 { 0.3 } else { -0.3 };
        let ball_dx = if js_sys::Math::random() > 0.5 { BALL_SPEED } else { -BALL_SPEED };
        let ball_dy = ball_dx * initial_angle;
        
        let ball = Ball::new(
            FIELD_WIDTH / 2.0,
            FIELD_HEIGHT / 2.0,
            ball_dx,
            ball_dy,
        );

        let score = Score::new();

        GameState {
            paddle1,
            paddle2,
            ball,
            score,
        }
    }

    pub fn update(&mut self, delta_time: f32) {
        // Update ball position
        self.ball.x += self.ball.dx * delta_time;
        self.ball.y += self.ball.dy * delta_time;

        // Basic boundary collision for top/bottom
        if self.ball.y <= self.ball.radius || self.ball.y >= FIELD_HEIGHT - self.ball.radius {
            self.ball.dy = -self.ball.dy;
        }

        // Reset ball if it goes off screen (simplified for now)
        if self.ball.x < 0.0 || self.ball.x > FIELD_WIDTH {
            self.ball.x = FIELD_WIDTH / 2.0;
            self.ball.y = FIELD_HEIGHT / 2.0;
            self.ball.dx = -self.ball.dx;
        }
    }

    // Getters for rendering
    #[wasm_bindgen(getter)]
    pub fn paddle1(&self) -> Paddle {
        self.paddle1
    }

    #[wasm_bindgen(getter)]
    pub fn paddle2(&self) -> Paddle {
        self.paddle2
    }

    #[wasm_bindgen(getter)]
    pub fn ball(&self) -> Ball {
        self.ball
    }

    #[wasm_bindgen(getter)]
    pub fn score(&self) -> Score {
        self.score
    }

    // Serialize state for network transmission
    pub fn serialize_state(&self) -> String {
        format!(
            "{}|{}|{}|{}|{}|{}|{}|{}",
            self.paddle1.y, self.paddle2.y,
            self.ball.x, self.ball.y, self.ball.dx, self.ball.dy,
            self.score.player1, self.score.player2
        )
    }

    // Deserialize and apply remote state
    pub fn deserialize_state(&mut self, state_str: &str) -> bool {
        let parts: Vec<&str> = state_str.split('|').collect();
        if parts.len() != 8 {
            return false;
        }

        // Parse values - return false on any parse error
        let paddle1_y = match parts[0].parse::<f32>() {
            Ok(val) => val,
            Err(_) => return false,
        };
        let paddle2_y = match parts[1].parse::<f32>() {
            Ok(val) => val,
            Err(_) => return false,
        };
        let ball_x = match parts[2].parse::<f32>() {
            Ok(val) => val,
            Err(_) => return false,
        };
        let ball_y = match parts[3].parse::<f32>() {
            Ok(val) => val,
            Err(_) => return false,
        };
        let ball_dx = match parts[4].parse::<f32>() {
            Ok(val) => val,
            Err(_) => return false,
        };
        let ball_dy = match parts[5].parse::<f32>() {
            Ok(val) => val,
            Err(_) => return false,
        };
        let score1 = match parts[6].parse::<u32>() {
            Ok(val) => val,
            Err(_) => return false,
        };
        let score2 = match parts[7].parse::<u32>() {
            Ok(val) => val,
            Err(_) => return false,
        };

        // Apply state
        self.paddle1.y = paddle1_y;
        self.paddle2.y = paddle2_y;
        self.ball.x = ball_x;
        self.ball.y = ball_y;
        self.ball.dx = ball_dx;
        self.ball.dy = ball_dy;
        self.score.player1 = score1;
        self.score.player2 = score2;

        true
    }
}