export default {
    max_enemies_num: 12,

    radius_min: 1100,
    radius_max: 1600,
    asteroids_num: 30, // it will be multiplied by number of asteroids models (currently 6)

    // TEST
    // radius_min: 500,
    // radius_max: 940,
    // asteroids_num: 0, // it will be multiplied by number of asteroids models (currently 6)

    show_goal_time: 3000,
    game_win_backcolor: "#128F12",
    game_lost_backcolor:"#8F1212",
    game_over_text_times: [0.3, 1.2, 1.4],

    pl_ship_spawn_radius: 0.8,
    spawn_ships_min_dist: 250,
    spawn_enemies_radius: 0.8,
    spawn_asteroids_min_dist: 250,

    dust_cloud_radius: 250,

    time_missile_no_collision: 2000,
    time_destroy_ship_after_explode: 800,

    missile_damage_radius: 50,
    missile_damage: 1000,
};