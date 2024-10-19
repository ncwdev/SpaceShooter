// contains target field of player's ship and icons of enemies
import { BaseGui } from './BaseGui.js';
import { ProgressBar } from './ProgressBar.js';
import * as utils from '../Utils/utils.js';
import * as dbg from '../Utils/DebugPanel.js';
import CONST from '../const.js';

const RT_TOP = 0.25;
const RT_HEIGHT = 0.50;
const RT_LEFT = 0.30;
const RT_WIDTH = 0.40;

const MAX_DX = 0.5 - RT_LEFT;
const MAX_DY = 0.5 - RT_TOP;

export class PlayerShipGui extends BaseGui {
    pointerObserver = null;

    ship = null;
    target = null; // gui control as a fake mouse pointer
    target_pos = null;
    target_obj = null;

    getTargetObj() {
        return this.target_obj;
    }

    target_field = null;
    reticle_center_x = 0.5;
    reticle_center_y = 0.5;

    speed_bar_pos = null;
    speed_bar_neg = null;
    energy_bar    = null;

    health_bar= null;
    armor_bar = null;

    infoPanel = null;
    misselsCounter = null;
    enemiesCounter = null;

    constructor(game, ship) {
        super(game);

        this.ship = ship;

        const parent = game.getHud().parent;

        const target_field = this.createTargetField();
        parent.addControl(target_field);
        this.target_field = target_field;

        const center = new BABYLON.GUI.Image('center', 'assets/images/center.png');
        center.width = 0.03;
        center.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
        center.zIndex = 10;
        target_field.addControl(center);

        const target = new BABYLON.GUI.Rectangle('target');
        target.width = (this.screen_width * 0.012) + 'px';
        target.height= target.width;
        target.zIndex = 10;
        target.color = '#3071a9';
        target.thickness = 2;
        target.cornerRadius = 5;
        parent.addControl(target);
        this.target = target;

        this.target.left= '0px';
        this.target.top = '0px';
        this.target_pos = { x: 0, y: 0 };

        this.infoPanel = document.getElementById('InfoPanel');
        this.enemiesCounter = document.getElementById('EnemiesCount');
        this.misselsCounter = document.getElementById('MissileCount');

        this.pointerObserver = this.scene.onPointerObservable.add(this.onPointerHandler.bind(this));
    }

    setInfoPanelVisible(flag) {
        this.infoPanel.style.display = flag ? 'block' : 'none';
    }

    getArmorBar() {
        return this.armor_bar;
    }

    getHealthBar() {
        return this.health_bar;
    }

    onPointerHandler(e) {
        if (!this.scene.getEngine().isPointerLock) {
            return;
        }
        if (this.ship.isDestroyed()) {
            return;
        }
        const dx = e.event.movementX;
        const dy = e.event.movementY;

        const engine = this.scene.getEngine();
        const w = engine.getRenderWidth();
        const h = engine.getRenderHeight();

        // draw reticle instead of mouse cursor
        const MARGIN = 0.01;
        const tw = w * 0.5 - w * MARGIN;
        const th = h * 0.5 - h * MARGIN;

        let { x, y } = this.target_pos;
        x = utils.clamp(x + dx, -tw, tw);
        y = utils.clamp(y + dy, -th, th);
        this.target_pos = { x, y };

        this.target.left= `${x}px`;
        this.target.top = `${y}px`;
    }

    getCursorCenterDeflection() {
        const cursorPos = this.target_pos;

        const engine = this.scene.getEngine();
        const w = engine.getRenderWidth();
        const h = engine.getRenderHeight();

        const dx = -cursorPos.x / w;
        const dy = -cursorPos.y / h;
        return [dx, dy];
    }

    getCursorPosition() {
        const cursorPos = this.target_pos;
        const w = this.scene.getEngine().getRenderWidth();
        const h = this.scene.getEngine().getRenderHeight();
        return { x: cursorPos.x + w * 0.5, y: cursorPos.y + h * 0.5};
    }

    isCursorInTargetField() {
        const [dx, dy] = this.getCursorCenterDeflection();
        if (Math.abs(dx) > MAX_DX || Math.abs(dy) > MAX_DY) {
            return false;
        }
        return true;
    }

    isCursorInBufferZone() {
        const [dx, dy] = this.getCursorCenterDeflection();
        const MIN_TARGET_RADIUS = 0.001;
        const radius = dx*dx + dy*dy;
        return radius < MIN_TARGET_RADIUS;
    }

    setEnemiesCount(value) {
        this.enemiesCounter.innerText = getLocText('TXT_ENEMIES') + value;
    }

    setMisselesCount(value) {
        this.misselsCounter.innerText = getLocText('TXT_MISSELES') + value;
    }

    createTargetField() {
        const target_field_clr = 'white';
        const target_field_line_width = 1;

        const w = this.scene.getEngine().getRenderWidth();
        const h = this.scene.getEngine().getRenderHeight();

        const target_field = new BABYLON.GUI.Rectangle();
        target_field.width = 1.0;
        target_field.height= 1.0;
        target_field.cornerRadius = 0;
        target_field.thickness = 0;

        const origin_point = { x: 0.0, y: 0.0 };
        const reticle_left = new BABYLON.GUI.MultiLine();
        let coordinates = [
            { x: RT_LEFT + 0.01, y: RT_TOP },
            { x: RT_LEFT, y: RT_TOP },
            { x: RT_LEFT, y: RT_TOP + RT_HEIGHT },
            { x: RT_LEFT + 0.01, y: RT_TOP + RT_HEIGHT },
        ];
        utils.addMultipleCoordinates(reticle_left, coordinates, origin_point);
        reticle_left.lineWidth = target_field_line_width;
        reticle_left.color = target_field_clr;
        target_field.addControl(reticle_left);

        const reticle_right = new BABYLON.GUI.MultiLine();
        coordinates = [
            { x: RT_LEFT + RT_WIDTH - 0.01, y: RT_TOP },
            { x: RT_LEFT + RT_WIDTH, y: RT_TOP },
            { x: RT_LEFT + RT_WIDTH, y: RT_TOP + RT_HEIGHT },
            { x: RT_LEFT + RT_WIDTH - 0.01, y: RT_TOP + RT_HEIGHT },
        ];
        utils.addMultipleCoordinates(reticle_right, coordinates, origin_point);
        reticle_right.lineWidth = target_field_line_width;
        reticle_right.color = target_field_clr;
        target_field.addControl(reticle_right);

        // progress for forward speed
        const BAR_WIDTH = 3;
        const MARGIN_H = 0.01;
        const MARGIN_W = 0.003;

        const bar_offset_x = w * (RT_LEFT + MARGIN_W);

        const WHOLE_HEIGHT = RT_HEIGHT - 2 * MARGIN_H;
        const WHOLE_SPEED  = this.ship.getMaxVelocity() + Math.abs(this.ship.getMinVelocity());

        const NEG_VEL_PERCENT = Math.abs(this.ship.getMinVelocity()) / WHOLE_SPEED;
        const POS_VEL_PERCENT = 1 - NEG_VEL_PERCENT;

        const pos_bar_start_h = h * (RT_TOP + MARGIN_H + WHOLE_HEIGHT * POS_VEL_PERCENT);
        const pos_bar_end_h = h * (RT_TOP + MARGIN_H);

        const line1 = new ProgressBar(target_field);
        line1.setStartPoint(bar_offset_x, pos_bar_start_h);
        line1.setEndPoint  (bar_offset_x, pos_bar_end_h);
        line1.setWidth(BAR_WIDTH);
        line1.setColor('green');
        this.speed_bar_pos = line1;

        // progress for back speed
        const line2 = new ProgressBar(target_field);
        line2.setStartPoint(bar_offset_x, pos_bar_start_h);
        line2.setEndPoint  (bar_offset_x, h * (RT_TOP + RT_HEIGHT - MARGIN_H));
        line2.setWidth(BAR_WIDTH);
        line2.setColor('red');
        this.speed_bar_neg = line2;

        // small line between bars
        const line = new BABYLON.GUI.Line();
        target_field.addControl(line);
        line.x1 = w * RT_LEFT;
        line.y1 = pos_bar_start_h;
        line.x2 = w * (RT_LEFT + 0.004);
        line.y2 = pos_bar_start_h;
        line.lineWidth = 2;
        line.color = 'white';

        // energy
        const MARGIN_SECOND_W = 0.006;
        const energy_x = w * (RT_LEFT + MARGIN_SECOND_W);
        const bar_start = h * (RT_TOP + RT_HEIGHT - MARGIN_H);
        const bar_end = h * (RT_TOP + MARGIN_H);

        const line3 = new ProgressBar(target_field);
        line3.setStartPoint(energy_x, bar_start);
        line3.setEndPoint  (energy_x, bar_end);
        line3.setWidth(BAR_WIDTH);
        line3.setColor('white');
        this.energy_bar = line3;

        // armor
        const armor_x = w * (RT_LEFT + RT_WIDTH - MARGIN_SECOND_W);
        const line4 = new ProgressBar(target_field);
        line4.setStartPoint(armor_x, bar_start);
        line4.setEndPoint  (armor_x, bar_end);
        line4.setWidth(BAR_WIDTH);
        line4.setColor('#85B2F5');
        this.armor_bar = line4;

        // health
        const health_x = w * (RT_LEFT + RT_WIDTH - MARGIN_W);
        const line5 = new ProgressBar(target_field);
        line5.setStartPoint(health_x, bar_start);
        line5.setEndPoint  (health_x, bar_end);
        line5.setWidth(BAR_WIDTH);
        line5.setColor('orange');
        this.health_bar = line5;

        return target_field;
    }

    targetEnemy(target_obj) {
        // target is needed for missiles
        this.target_obj = target_obj;

        const mesh = target_obj.getMesh();
        mesh.renderOutline = true;
        mesh.outlineColor = new BABYLON.Color3(1, 0, 0);
        mesh.outlineWidth = 0.1;

        this.target.color = '#FF462D';
    }
    resetTarget() {
        if (this.target_obj) {
            const mesh = this.target_obj.getMesh();
            if (mesh) {
                mesh.renderOutline = false;
            }
            this.target_obj = null;

            this.target.color = '#3071a9';
        }
    }

    updateTarget(dt) {
        // shift target pos to center (0, 0)
        let { x, y } = this.target_pos;
        if (!this.isCursorInBufferZone() && (x !== 0 || y !== 0)) {
            const TINY = 1;
            const change = 30 * dt;
            x = utils.decreaseValueToZero(x, TINY, change);
            y = utils.decreaseValueToZero(y, TINY, change);
            this.target_pos = { x, y };

            this.target.left = `${x}px`;
            this.target.top = `${y}px`;
        }

        // picking meshes under target icon
        const cursorPos = this.getCursorPosition();
        const pick = this.scene.pick(cursorPos.x, cursorPos.y);

        if (pick.hit && pick.pickedMesh && this.isCursorInTargetField()) {
            const mesh = pick.pickedMesh;
            if (mesh.mfg && (mesh.mfg.entity_class === CONST.ENTITY_CLASS_ENEMY_SHIP)) {
                const enemy_ship = mesh.mfg.entity;
                if (!enemy_ship.isDestroyed()) {
                    this.targetEnemy(enemy_ship);
                    return;
                }
            }
        }
        this.resetTarget();
    }

    update(dt) {
        this.updateTarget(dt);

        const pl_ship = this.ship;

        const fwd_vel = pl_ship.getFwdVelocity();
        dbg.setShipVelocity(fwd_vel);

        const speed_percent = fwd_vel / pl_ship.getMaxVelocity();
        if (speed_percent >= 0) {
            this.speed_bar_pos.setProgress(speed_percent);

            this.speed_bar_pos.setVisible(true);
            this.speed_bar_neg.setVisible(false);
        } else {
            const percent = Math.abs(fwd_vel / pl_ship.getMinVelocity());
            this.speed_bar_neg.setProgress(percent);

            this.speed_bar_pos.setVisible(false);
            this.speed_bar_neg.setVisible(true);
        }
        const energy_percent = pl_ship.getCurEnergy() / pl_ship.getMaxEnergy();
        this.energy_bar.setProgress(energy_percent);

        if (pl_ship.isEnergyInRedZone()) {
            this.energy_bar.setColor('red');
        } else {
            this.energy_bar.setColor('white');
        }

        // draw icons of enemies
        const inv_matrix = pl_ship.getMesh().computeWorldMatrix(true).clone().invert();

        const enemies = this.game.getBattleArea().getEnemies();
        enemies.forEach(enemy => {
            if (!enemy.isDestroyed()) {
                this.drawEnemyIcon(enemy, inv_matrix);
            }
        });
        this.setEnemiesCount(this.game.getBattleArea().getEnemiesCount());
    }

    drawEnemyIcon(enemy, inv_matrix) {
        const mesh = enemy.getMesh();
        const icon = enemy.getRadarIcon();

        let screen_width = this.screen_width;
        let screen_height = this.screen_height;

        // Convert the world position to screen coordinates
        const pos = mesh.getAbsolutePosition();
        const screenPos = BABYLON.Vector3.Project(
            pos,
            BABYLON.Matrix.Identity(),
            this.scene.getTransformMatrix(),
            this.scene.activeCamera.viewport.toGlobal(screen_width, screen_height)
        );

        const isVisible = this.scene.activeCamera.isInFrustum(mesh);
        if (isVisible) {
            const HEIGHT_OFFSET = enemy.getConfig().hp_text_offset;
            icon.top = screenPos.y - screen_height * 0.5 - HEIGHT_OFFSET * screen_height;
            icon.left = screenPos.x - screen_width * 0.5;
        } else {
            screen_width -= icon.width_numeric * screen_width;
            screen_height-= icon.width_numeric * screen_height;

            // convert global enemy pos to local system of coordinates of the player ship
            const local_pos = BABYLON.Vector3.TransformCoordinates(pos, inv_matrix);

            // create a 2d vector projected to local YOZ plane, because OX is the forward direction of our ship
            const local_pos_2d = new BABYLON.Vector2(-local_pos.z, -local_pos.y);

            // get intersection point between 2d vector and rectangle
            const point = utils.getVectorRectangleIntersection(local_pos_2d.x, local_pos_2d.y, screen_width, screen_height);
            icon.top = point.y + 'px';
            icon.left= point.x + 'px';
        }
    }

    hide() {
        this.target_field.isVisible = false;
        this.target.isVisible = false;

        this.health_bar.setVisible(false);
        this.armor_bar.setVisible(false);
        this.energy_bar.setVisible(false);
        this.speed_bar_pos.setVisible(false);
        this.speed_bar_neg.setVisible(false);

        this.setInfoPanelVisible(false);
    }

    clear() {
        this.scene.onPointerObservable.remove(this.pointerObserver);

        this.game  = null;
        this.scene = null;
        this.ship  = null;

        this.target_field.dispose();
        this.target_field = null;

        this.target.dispose();
        this.target= null;
        this.target_obj = null;

        this.speed_bar_pos.clear();
        this.speed_bar_pos = null;

        this.speed_bar_neg.clear();
        this.speed_bar_neg = null;

        this.energy_bar.clear();
        this.energy_bar = null;

        this.health_bar.clear();
        this.health_bar = null;

        this.armor_bar.clear();
        this.armor_bar = null;
    }
}
