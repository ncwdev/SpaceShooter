export default Object.freeze({
    maxEnemiesNum: 12,

    radiusMin: 1100,
    radiusMax: 1600,
    asteroidsNum: 30, // it will be multiplied by number of asteroids models (currently 6)

    // TEST
    // radiusMin: 500,
    // radiusMax: 940,
    // asteroidsNum: 0, // it will be multiplied by number of asteroids models (currently 6)

    gameWinBackColor: '#128F12',
    gameLostBackColor: '#8F1212',
    gameOverTextTimes: [0.3, 1.2, 1.4],

    plShipSpawnRadius: 0.8,
    spawnShipsMinDist: 250,
    spawnEnemiesRadius: 0.8,
    spawnAsteroidsMinDist: 250,

    dustCloudRadius: 250,

    timeMissileNoCollision: 2000,
    timeDestroyShipAfterExplode: 800,

    missileDamageRadius: 50,
    missileDamage: 1000,

    skyboxTextureSize: 2048,
    starsCount: 3000,
});
