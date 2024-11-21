/* eslint-disable camelcase */
import { Node } from '../BehaviorTree/Node.js';
import { TreeBuilder } from '../BehaviorTree/TreeBuilder.js';

// Description of behavior tree:
// Each node contains:
//  string unique id
//  int type - selector, sequence, if-then-else, leaf
//  func - name of function OR anonymous function (for leaf nodes)
//  children ids

const enemyBT = {
    root: {
        id: 'root',
        type: TreeBuilder.NT_IF_THEN_ELSE,
        nodes: ['N1_if_has_obstacle', 'N1_escape_obstacle', 'N1_maneuver'],
    },
    //-----

    N1_if_has_obstacle: {
        id: 'N1_if_has_obstacle',
        type: TreeBuilder.NT_LEAF,
        func: N1_if_has_obstacle,
    },

    N1_escape_obstacle: {
        id: 'N1_escape_obstacle',
        type: TreeBuilder.NT_LEAF,
        func: N1_escape_obstacle,
    },

    N1_maneuver: {
        id: 'N1_maneuver',
        type: TreeBuilder.NT_SEQUENCE,
        nodes: ['N2_approach', 'N2_attack', 'N2_retreat'],
    },
    //-----

    N2_approach: {
        id: 'N2_approach',
        type: TreeBuilder.NT_IF_THEN_ELSE,
        nodes: ['N3_is_too_far', 'N3_do_approach', 'N3_go_to_attack'],
    },
    //-----

    N2_attack: {
        id: 'N2_attack',
        type: TreeBuilder.NT_IF_THEN_ELSE,
        nodes: ['N3_is_near', 'N3_do_attack', 'N3_go_to_retreat'],
    },
    //-----

    N2_retreat: {
        id: 'N2_retreat',
        type: TreeBuilder.NT_IF_THEN_ELSE,
        nodes: ['N3_is_too_close', 'N3_do_retreat', 'N3_repeat'],
    },
    //-----

    // approach nodes
    N3_is_too_far: {
        id: 'N3_is_too_far',
        type: TreeBuilder.NT_LEAF,
        func: N3_is_too_far,
    },
    N3_do_approach: {
        id: 'N3_do_approach',
        type: TreeBuilder.NT_LEAF,
        func: N3_do_approach,
    },
    N3_go_to_attack: {
        id: 'N3_go_to_attack',
        type: TreeBuilder.NT_LEAF,
        func: (entity, context) => {
            return Node.RES_SUCCESS;
        }
    },

    // attack nodes
    N3_is_near: {
        id: 'N3_is_near',
        type: TreeBuilder.NT_LEAF,
        func: N3_is_near,
    },
    N3_do_attack: {
        id: 'N3_do_attack',
        type: TreeBuilder.NT_LEAF,
        func: N3_do_attack,
    },
    N3_go_to_retreat: {
        id: 'N3_go_to_retreat',
        type: TreeBuilder.NT_LEAF,
        func: (entity, context) => {
            return Node.RES_SUCCESS;
        }
    },

    // retreat nodes
    N3_is_too_close: {
        id: 'N3_is_too_close',
        type: TreeBuilder.NT_LEAF,
        func: N3_is_too_close,
    },
    N3_do_retreat: {
        id: 'N3_do_retreat',
        type: TreeBuilder.NT_LEAF,
        func: N3_do_retreat,
    },
    N3_repeat: {
        id: 'N3_repeat',
        type: TreeBuilder.NT_LEAF,
        func: (entity, context) => {
            return Node.RES_SUCCESS;
        },
    },
};
//------------------------------------------------------------

function N1_if_has_obstacle(entity, context) {
    const mesh = entity.getMesh();
    const srcPos = entity.getPosition();
    const dir = mesh.getDirection(BABYLON.Axis.X).clone();

    function predicate(_mesh) {
        if (_mesh === mesh) {
            return false;
        }
        return true;
    }
    const ray = new BABYLON.Ray(srcPos, dir, context.AI_RAY_DIST);
    const result = context.scene.pickWithRay(ray, predicate);

    if (result.hit) {
        return Node.RES_SUCCESS;
    }
    const dt = context.AI_DT;
    entity.yawPitch(0, 0, dt);

    return Node.RES_FAIL;
}

function N1_escape_obstacle(entity, context) {
    entity.yawPitch(0, context.AI_EVASION_SPEED, context.AI_DT);

    return Node.RES_RUNNING;
}

function N3_is_too_far(entity, context) {
    const plPos = context.playerShip.getPosition();
    const pos = entity.getPosition();
    const dist = plPos.clone().subtract(pos).length();

    if (dist > context.AI_RADIUS_FIRE) {
        return Node.RES_SUCCESS;
    }
    return Node.RES_FAIL;
}

function N3_do_approach(entity, context) {
    const dt = context.AI_DT;
    entity.turnToPlayerShip(dt);
    entity.moveForward(dt);

    return Node.RES_RUNNING;
}

function N3_is_near(entity, context) {
    const plPos = context.playerShip.getPosition();
    const pos = entity.getPosition();
    const dist = plPos.clone().subtract(pos).length();

    if (dist > context.AI_RADIUS_LEAVE && dist <= context.AI_RADIUS_FIRE) {
        context.distToTarget = dist;
        return Node.RES_SUCCESS;
    }
    return Node.RES_FAIL;
}

function N3_do_attack(entity, context) {
    const dt = context.AI_DT;

    // move with evasion
    entity.moveForward(dt);
    entity.roll(true, dt);
    entity.moveSide(true, dt);
    entity.turnToPlayerShip(dt);

    if (!context.lastFireTime || context.lastFireTime + context.AI_FIRE_INTERVAL < Date.now()) {
        const chance = Math.random();
        if (chance < context.AI_FIRE_CHANCE) {
            entity.firePlasmaShot(context.distToTarget);
            context.lastFireTime = Date.now();
        }
    }
    return Node.RES_RUNNING;
}

function N3_is_too_close(entity, context) {
    const plPos = context.playerShip.getPosition();
    const pos = entity.getPosition();
    const dist = plPos.clone().subtract(pos).length();

    if (dist <= context.AI_RADIUS_RETREAT) {
        return Node.RES_SUCCESS;
    }
    return Node.RES_FAIL;
}

function N3_do_retreat(entity, context) {
    const dt = context.AI_DT;

    // move with evasion
    entity.moveForward(dt);
    entity.roll(true, dt);
    entity.moveSide(true, dt);

    return Node.RES_RUNNING;
}

export { enemyBT };
