use crate::game::{Ball, Paddle, FIELD_WIDTH, FIELD_HEIGHT, BALL_SPEED, PADDLE_SPEED};

// Physics constants
pub const BALL_BOUNCE_FACTOR: f32 = 1.0; // No dampening for now
pub const PADDLE_BOUNCE_ANGLE_FACTOR: f32 = 0.5; // How much paddle position affects bounce angle
pub const MAX_BOUNCE_ANGLE: f32 = 1.0; // Maximum bounce angle in radians

#[derive(Debug, Clone, Copy)]
pub enum Player {
    Player1,
    Player2,
}

// Utility functions
pub fn clamp(value: f32, min: f32, max: f32) -> f32 {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

pub fn normalize_vector(x: f32, y: f32) -> (f32, f32) {
    let length = (x * x + y * y).sqrt();
    if length > 0.0 {
        (x / length, y / length)
    } else {
        (0.0, 0.0)
    }
}

// Movement functions
pub fn update_ball_position(ball: &mut Ball, delta_time: f32) {
    ball.x += ball.dx * delta_time;
    ball.y += ball.dy * delta_time;
}

pub fn update_paddle_position(paddle: &mut Paddle, target_y: f32, delta_time: f32) {
    let current_y = paddle.y;
    let diff = target_y - current_y;
    
    // Calculate maximum movement distance this frame
    let max_movement = PADDLE_SPEED * delta_time;
    
    // Move toward target, but not more than max_movement
    let movement = if diff.abs() <= max_movement {
        diff
    } else if diff > 0.0 {
        max_movement
    } else {
        -max_movement
    };
    
    // Apply movement with boundary checking
    let new_y = current_y + movement;
    paddle.y = clamp(new_y, 0.0, FIELD_HEIGHT - paddle.height);
}

// Collision detection
pub fn check_ball_wall_collision(ball: &Ball, field_height: f32) -> bool {
    ball.y <= ball.radius || ball.y >= field_height - ball.radius
}

pub fn check_ball_paddle_collision(ball: &Ball, paddle: &Paddle) -> bool {
    // AABB collision detection
    let ball_left = ball.x - ball.radius;
    let ball_right = ball.x + ball.radius;
    let ball_top = ball.y - ball.radius;
    let ball_bottom = ball.y + ball.radius;
    
    let paddle_left = paddle.x;
    let paddle_right = paddle.x + paddle.width;
    let paddle_top = paddle.y;
    let paddle_bottom = paddle.y + paddle.height;
    
    ball_right >= paddle_left && 
    ball_left <= paddle_right && 
    ball_bottom >= paddle_top && 
    ball_top <= paddle_bottom
}

// Collision resolution
pub fn resolve_ball_wall_collision(ball: &mut Ball) {
    ball.dy = -ball.dy * BALL_BOUNCE_FACTOR;
    
    // Ensure ball stays within bounds
    if ball.y < ball.radius {
        ball.y = ball.radius;
    } else if ball.y > FIELD_HEIGHT - ball.radius {
        ball.y = FIELD_HEIGHT - ball.radius;
    }
}

pub fn resolve_ball_paddle_collision(ball: &mut Ball, paddle: &Paddle) {
    // Determine which side the paddle is on
    let is_left_paddle = paddle.x < FIELD_WIDTH / 2.0;
    
    // Calculate hit position relative to paddle center (0 = center, -1 = top, 1 = bottom)
    let paddle_center_y = paddle.y + paddle.height / 2.0;
    let hit_position = (ball.y - paddle_center_y) / (paddle.height / 2.0);
    let clamped_hit_position = clamp(hit_position, -1.0, 1.0);
    
    // Calculate bounce angle based on hit position
    let bounce_angle = clamped_hit_position * MAX_BOUNCE_ANGLE * PADDLE_BOUNCE_ANGLE_FACTOR;
    
    // Set ball direction based on which paddle was hit
    if is_left_paddle {
        ball.dx = BALL_SPEED; // Ball goes right after hitting left paddle
    } else {
        ball.dx = -BALL_SPEED; // Ball goes left after hitting right paddle
    }
    
    // Apply angle to Y velocity
    ball.dy = BALL_SPEED * bounce_angle;
    
    // Push ball away from paddle to prevent sticking
    if is_left_paddle {
        // Left paddle - push ball to the right
        ball.x = paddle.x + paddle.width + ball.radius;
    } else {
        // Right paddle - push ball to the left
        ball.x = paddle.x - ball.radius;
    }
}

// Scoring logic
pub fn check_ball_out_of_bounds(ball: &Ball, field_width: f32) -> Option<Player> {
    if ball.x < 0.0 {
        Some(Player::Player2) // Player 2 scores
    } else if ball.x > field_width {
        Some(Player::Player1) // Player 1 scores
    } else {
        None
    }
}

pub fn reset_ball_position(ball: &mut Ball, field_width: f32, field_height: f32) {
    ball.x = field_width / 2.0;
    ball.y = field_height / 2.0;
    
    // Random initial direction
    let direction = if js_sys::Math::random() > 0.5 { 1.0 } else { -1.0 };
    let angle = (js_sys::Math::random() - 0.5) * 0.6; // Random angle between -0.3 and 0.3 radians
    
    ball.dx = BALL_SPEED * direction;
    ball.dy = BALL_SPEED * (angle as f32);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::game::{Ball, Paddle, BALL_RADIUS, PADDLE_WIDTH, PADDLE_HEIGHT};
    
    #[test]
    fn test_clamp() {
        assert_eq!(clamp(5.0, 0.0, 10.0), 5.0);
        assert_eq!(clamp(-1.0, 0.0, 10.0), 0.0);
        assert_eq!(clamp(15.0, 0.0, 10.0), 10.0);
    }
    
    #[test]
    fn test_normalize_vector() {
        let (x, y) = normalize_vector(3.0, 4.0);
        assert!((x - 0.6).abs() < 0.001);
        assert!((y - 0.8).abs() < 0.001);
    }
    
    #[test]
    fn test_ball_wall_collision() {
        let ball = Ball::new(100.0, 5.0, 100.0, 100.0); // Ball near top
        assert!(check_ball_wall_collision(&ball, 400.0));
        
        let ball = Ball::new(100.0, 200.0, 100.0, 100.0); // Ball in middle
        assert!(!check_ball_wall_collision(&ball, 400.0));
    }
    
    #[test]
    fn test_ball_paddle_collision() {
        let ball = Ball::new(25.0, 100.0, 100.0, 100.0);
        let paddle = Paddle::new(20.0, 80.0);
        assert!(check_ball_paddle_collision(&ball, &paddle));
        
        let ball = Ball::new(100.0, 100.0, 100.0, 100.0);
        let paddle = Paddle::new(20.0, 80.0);
        assert!(!check_ball_paddle_collision(&ball, &paddle));
    }
}