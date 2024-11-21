const config = Object.freeze({
    health: 1000,
    armor: 1000,
    armorRestore: 10,
    plasmaShotDamage: 50,

    mass: 100,
    linearDamping: 0.59,
    angularDamping: 0.59,

    accelFwd: 10.0,
    accelBack: -10.0,
    accelSide: 6.0,
    turboK: 2.0,
    decVelK: 0.5,

    velFwdMin: -25.0,
    velFwdMax: 25.0,
    velFwdTurbo: 50.0,

    velSideMin: -12.0,
    velSideMax: 12.0,

    rollAccel: 0.5,
    rollSpeedMin: -1.95,
    rollSpeedMax: 1.95,

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

    camOffset: new BABYLON.Vector3(-19, 5.5, 0),
    camTargetDist: 80, // distance to target in front of ship
    camLerpFactor: 12,
    cameraToShipInitialDist: 3,

    idleMoveRadius: 0.12,
    idleMoveSpeed: 0.05,

    leftFlarePos: new BABYLON.Vector3(-6.8, 0.2, 0.8),
    rightFlarePos: new BABYLON.Vector3(-6.8, 0.2, -0.8),

    plasmaShotLeftPos: new BABYLON.Vector3(3.2, 0.9, 2.1),
    plasmaShotRightPos: new BABYLON.Vector3(3.2, 0.9, -2.1),

    missilePos: new BABYLON.Vector3(1, -2.5, 0.0),
    missilesNum: 3,
});
export default config;
