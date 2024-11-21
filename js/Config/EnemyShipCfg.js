const config = Object.freeze({
    health: 1000,
    armor: 0,
    armorRestore: 0,
    plasmaShotDamage: 20,

    mass: 100,
    linearDamping: 0.59,
    angularDamping: 0.59,

    accelFwd: 10.0,
    accelBack: -10.0,
    accelSide: 20.0,
    turboK: 3.0,
    decVelK: 0.5,

    velFwdMin: -25.0,
    velFwdMax: 25.0,
    velFwdTurbo: 50.0,

    velSideMin: -25.0,
    velSideMax: 25.0,

    rollAccel: 0.25,
    rollSpeedMin: -0.45,
    rollSpeedMax: 0.45,

    yawMult: 2.0,
    yawAccel: 0.5,
    yawSpeedMax: 0.85,

    pitchMult: 2.0,
    pitchAccel: 1.0,
    pitchSpeedMax: 0.85,

    rotDecreasing: 0.24,

    energy: {
        volume: 1000,
        redZoneValue: 200,
        accelConsump: 50,
        turboConsump: 100,
        restoreSpeed: 50,
    },

    ai: {
        AI_DT: 0.050,
        AI_TICK: 50,
        AI_FIRE_INTERVAL: 100,
        AI_FIRE_CHANCE: 0.35,
        AI_RADIUS_FIRE: 300,
        AI_RADIUS_LEAVE: 100,
        AI_RADIUS_RETREAT: 500,
        AI_RAY_DIST: 100,
        AI_EVASION_SPEED: 1.5,
        AI_TURN_SPEED: 0.5,
    },

    healthBarWidth: 0.03,
    healthBarHeight: 0.006,
    healthBarAlpha: 1.0,
    healthBarOffset: 0.015,

    hpTextColor: '#FF462D',
    hpTextFontSize: 0.015,
    hpTextOffset: 0.03,

    leftFlarePos: new BABYLON.Vector3(-20.7, 0.8, 2.5),
    rightFlarePos: new BABYLON.Vector3(-20.7, 0.8,-2.5),

    plasmaShotLeftPos: new BABYLON.Vector3(-5.0, 0.0, 6.5),
    plasmaShotRightPos: new BABYLON.Vector3(-5.0, 0.0, -6.5),

    maxAngleToFire: 0.85,
    stopFireDistance: 100, // if target is too close, don't fire
});
export default config;
