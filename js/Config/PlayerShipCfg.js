const config = Object.freeze({
    health: 1000,
    armor:  1000,
    armor_restore: 10,
    plasma_shot_damage: 50,

    mass: 100,
    linear_damping: 0.59,
    angular_damping:0.59,

    accel_fwd:  10.0,
    accel_back:-10.0,
    accel_side: 6.0,
    turbo_k:    2.0,
    dec_vel_k:  0.5,

    vel_fwd_min:   -25.0,
    vel_fwd_max:    25.0,
    vel_fwd_turbo:  50.0,

    vel_side_min: -12.0,
    vel_side_max:  12.0,

    roll_accel: 0.5,
    roll_speed_min:-1.95,
    roll_speed_max: 1.95,

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

    cam_offset: new BABYLON.Vector3(-19, 5.5, 0),
    cam_target_dist: 80, // distance to target in front of ship
    cam_lerp_factor: 12,
    camera_to_ship_initial_dist: 3,

    idle_move_radius: 0.12,
    idle_move_speed:  0.05,

    left_flare_pos: new BABYLON.Vector3(-6.8, 0.2, 0.8),
    right_flare_pos:new BABYLON.Vector3(-6.8, 0.2,-0.8),

    plasma_shot_left_pos:  new BABYLON.Vector3(3.2, 0.9,  2.1),
    plasma_shot_right_pos: new BABYLON.Vector3(3.2, 0.9, -2.1),

    missile_pos: new BABYLON.Vector3(1, -2.5, 0.0),
    missiles_num: 3,
});
export default config;
