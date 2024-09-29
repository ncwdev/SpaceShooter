const config = {
    health: 1000,
    armor:  0,
    armor_restore: 0,
    plasma_shot_damage: 20,

    mass: 100,
    linear_damping: 0.59,
    angular_damping:0.59,

    accel_fwd:  10.0,
    accel_back:-10.0,
    accel_side: 20.0,
    turbo_k:    3.0,
    dec_vel_k:  0.5,

    vel_fwd_min:   -25.0,
    vel_fwd_max:    25.0,
    vel_fwd_turbo:  50.0,

    vel_side_min: -25.0,
    vel_side_max:  25.0,

    roll_accel: 0.25,
    roll_speed_min:-0.45,
    roll_speed_max: 0.45,

    yaw_mult:  2.0,
    yaw_accel: 0.5,
    yaw_speed_max: 0.85,

    pitch_mult: 2.0,
    pitch_accel:1.0,
    pitch_speed_max: 0.85,

    rot_decreasing: 0.24,

    energy: {
        volume: 1000,
        red_zone_value: 200,
        accel_consump:  50,
        turbo_consump:  100,
        restore_speed:  50,
    },

    ai: {
        AI_dt: 0.050,
        AI_TICK: 50,
        AI_FIRE_INTERVAL: 100,
        AI_FIRE_CHANCE: 0.35,
        AI_RADIUS_FIRE: 300,
        AI_RADIUS_LEAVE:100,
        AI_RADIUS_RETREAT: 500,
        AI_RAY_DIST: 100,
        AI_EVASION_SPEED: 1.5,
        AI_TURN_SPEED: 0.5,
    },

    health_bar_width: 0.03,
    health_bar_height:0.006,
    health_bar_alpha: 1.0,
    health_bar_offset: 0.015,

    hp_text_color: '#FF462D',
    hp_text_font_size: 0.015,
    hp_text_offset: 0.03,

    left_flare_pos: new BABYLON.Vector3(-20.7, 0.8, 2.5),
    right_flare_pos:new BABYLON.Vector3(-20.7, 0.8,-2.5),

    plasma_shot_left_pos: new BABYLON.Vector3(-5.0, 0.0,  6.5),
    plasma_shot_right_pos:new BABYLON.Vector3(-5.0, 0.0, -6.5),

    max_angle_to_fire: 0.85,
    stop_fire_distance: 100,    // if target is too close, don't fire
};
export default config;
