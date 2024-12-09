// contains target field of player's ship and icons of enemies
import { BaseGui } from './BaseGui.js';
import { ProgressBar } from './ProgressBar.js';
import { getLocText } from '../Utils/lang.js';
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
    targetPos = null;
    targetObj = null;

    getTargetObj() {
        return this.targetObj;
    }

    targetField = null;
    speedBarPos = null;
    speedBarNeg = null;
    energyBar = null;
    healthBar = null;
    armorBar = null;

    infoPanel = null;
    misselsCounter = null;
    enemiesCounter = null;

    constructor(game, ship) {
        super(game);

        this.ship = ship;

        const parent = game.getHud().parent;

        const targetField = this.createTargetField();
        parent.addControl(targetField);
        this.targetField = targetField;

        const center = new BABYLON.GUI.Image('center', '/images/center.png');
        center.width = 0.03;
        center.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
        center.zIndex = 10;
        targetField.addControl(center);

        const target = new BABYLON.GUI.Rectangle('target');
        target.width = (this.screenWidth * 0.012) + 'px';
        target.height = target.width;
        target.zIndex = 10;
        target.color = '#3071a9';
        target.thickness = 2;
        target.cornerRadius = 5;
        parent.addControl(target);
        this.target = target;

        this.target.left = '0px';
        this.target.top = '0px';
        this.targetPos = { x: 0, y: 0 };

        this.infoPanel = document.getElementById('InfoPanel');
        this.enemiesCounter = document.getElementById('EnemiesCount');
        this.misselsCounter = document.getElementById('MissileCount');

        this.pointerObserver = this.scene.onPointerObservable.add(this.onPointerHandler.bind(this));
    }

    setInfoPanelVisible(flag) {
        this.infoPanel.style.display = flag ? 'block' : 'none';
    }

    getArmorBar() {
        return this.armorBar;
    }

    getHealthBar() {
        return this.healthBar;
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

        let { x, y } = this.targetPos;
        x = utils.clamp(x + dx, -tw, tw);
        y = utils.clamp(y + dy, -th, th);
        this.targetPos = { x, y };

        this.target.left = `${x}px`;
        this.target.top = `${y}px`;
    }

    getCursorCenterDeflection() {
        const cursorPos = this.targetPos;

        const engine = this.scene.getEngine();
        const w = engine.getRenderWidth();
        const h = engine.getRenderHeight();

        const dx = -cursorPos.x / w;
        const dy = -cursorPos.y / h;
        return [dx, dy];
    }

    getCursorPosition() {
        const cursorPos = this.targetPos;
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
        const radius = dx * dx + dy * dy;
        return radius < MIN_TARGET_RADIUS;
    }

    setEnemiesCount(value) {
        this.enemiesCounter.innerText = getLocText('TXT_ENEMIES') + value;
    }

    setMisselesCount(value) {
        this.misselsCounter.innerText = getLocText('TXT_MISSELES') + value;
    }

    createTargetField() {
        const targetFieldClr = 'white';
        const targetFieldLineWidth = 1;

        const w = this.scene.getEngine().getRenderWidth();
        const h = this.scene.getEngine().getRenderHeight();

        const targetField = new BABYLON.GUI.Rectangle();
        targetField.width = 1.0;
        targetField.height = 1.0;
        targetField.cornerRadius = 0;
        targetField.thickness = 0;

        const originPoint = { x: 0.0, y: 0.0 };
        const reticleLeft = new BABYLON.GUI.MultiLine();
        let coordinates = [
            { x: RT_LEFT + 0.01, y: RT_TOP },
            { x: RT_LEFT, y: RT_TOP },
            { x: RT_LEFT, y: RT_TOP + RT_HEIGHT },
            { x: RT_LEFT + 0.01, y: RT_TOP + RT_HEIGHT },
        ];
        utils.addMultipleCoordinates(reticleLeft, coordinates, originPoint);
        reticleLeft.lineWidth = targetFieldLineWidth;
        reticleLeft.color = targetFieldClr;
        targetField.addControl(reticleLeft);

        const reticleRight = new BABYLON.GUI.MultiLine();
        coordinates = [
            { x: RT_LEFT + RT_WIDTH - 0.01, y: RT_TOP },
            { x: RT_LEFT + RT_WIDTH, y: RT_TOP },
            { x: RT_LEFT + RT_WIDTH, y: RT_TOP + RT_HEIGHT },
            { x: RT_LEFT + RT_WIDTH - 0.01, y: RT_TOP + RT_HEIGHT },
        ];
        utils.addMultipleCoordinates(reticleRight, coordinates, originPoint);
        reticleRight.lineWidth = targetFieldLineWidth;
        reticleRight.color = targetFieldClr;
        targetField.addControl(reticleRight);

        // progress for forward speed
        const BAR_WIDTH = 3;
        const MARGIN_H = 0.01;
        const MARGIN_W = 0.003;

        const barOffsetX = w * (RT_LEFT + MARGIN_W);

        const WHOLE_HEIGHT = RT_HEIGHT - 2 * MARGIN_H;
        const WHOLE_SPEED = this.ship.getMaxVelocity() + Math.abs(this.ship.getMinVelocity());

        const NEG_VEL_PERCENT = Math.abs(this.ship.getMinVelocity()) / WHOLE_SPEED;
        const POS_VEL_PERCENT = 1 - NEG_VEL_PERCENT;

        const posBarStartH = h * (RT_TOP + MARGIN_H + WHOLE_HEIGHT * POS_VEL_PERCENT);
        const posBarEndH = h * (RT_TOP + MARGIN_H);

        const line1 = new ProgressBar(targetField);
        line1.setStartPoint(barOffsetX, posBarStartH);
        line1.setEndPoint(barOffsetX, posBarEndH);
        line1.setWidth(BAR_WIDTH);
        line1.setColor('green');
        this.speedBarPos = line1;

        // progress for back speed
        const line2 = new ProgressBar(targetField);
        line2.setStartPoint(barOffsetX, posBarStartH);
        line2.setEndPoint(barOffsetX, h * (RT_TOP + RT_HEIGHT - MARGIN_H));
        line2.setWidth(BAR_WIDTH);
        line2.setColor('red');
        this.speedBarNeg = line2;

        // small line between bars
        const line = new BABYLON.GUI.Line();
        targetField.addControl(line);
        line.x1 = w * RT_LEFT;
        line.y1 = posBarStartH;
        line.x2 = w * (RT_LEFT + 0.004);
        line.y2 = posBarStartH;
        line.lineWidth = 2;
        line.color = 'white';

        // energy
        const MARGIN_SECOND_W = 0.006;
        const energyX = w * (RT_LEFT + MARGIN_SECOND_W);
        const barStart = h * (RT_TOP + RT_HEIGHT - MARGIN_H);
        const barEnd = h * (RT_TOP + MARGIN_H);

        const line3 = new ProgressBar(targetField);
        line3.setStartPoint(energyX, barStart);
        line3.setEndPoint(energyX, barEnd);
        line3.setWidth(BAR_WIDTH);
        line3.setColor('white');
        this.energyBar = line3;

        // armor
        const armorX = w * (RT_LEFT + RT_WIDTH - MARGIN_SECOND_W);
        const line4 = new ProgressBar(targetField);
        line4.setStartPoint(armorX, barStart);
        line4.setEndPoint(armorX, barEnd);
        line4.setWidth(BAR_WIDTH);
        line4.setColor('#85B2F5');
        this.armorBar = line4;

        // health
        const healthX = w * (RT_LEFT + RT_WIDTH - MARGIN_W);
        const line5 = new ProgressBar(targetField);
        line5.setStartPoint(healthX, barStart);
        line5.setEndPoint(healthX, barEnd);
        line5.setWidth(BAR_WIDTH);
        line5.setColor('orange');
        this.healthBar = line5;

        return targetField;
    }

    targetEnemy(targetObj) {
        // target is needed for missiles
        this.targetObj = targetObj;

        const mesh = targetObj.getMesh();
        mesh.renderOutline = true;
        mesh.outlineColor = new BABYLON.Color3(1, 0, 0);
        mesh.outlineWidth = 0.1;

        this.target.color = '#FF462D';
    }

    resetTarget() {
        if (this.targetObj) {
            const mesh = this.targetObj.getMesh();
            if (mesh) {
                mesh.renderOutline = false;
            }
            this.targetObj = null;

            this.target.color = '#3071a9';
        }
    }

    pickEnemy() {
        const cursorPos = this.getCursorPosition();

        const positions = [5];
        positions[0] = [ cursorPos.x, cursorPos.y ];

        positions[1] = [ cursorPos.x + 2, cursorPos.y ];
        positions[2] = [ cursorPos.x, cursorPos.y + 2 ];
        positions[3] = [ cursorPos.x - 2, cursorPos.y ];
        positions[4] = [ cursorPos.x, cursorPos.y - 2 ];

        positions[5] = [ cursorPos.x + 4, cursorPos.y ];
        positions[6] = [ cursorPos.x, cursorPos.y + 4 ];
        positions[7] = [ cursorPos.x - 4, cursorPos.y ];
        positions[8] = [ cursorPos.x, cursorPos.y - 4 ];

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const pick = this.scene.pick(pos[0], pos[1]);

            if (pick.hit && pick.pickedMesh && this.isCursorInTargetField()) {
                const mesh = pick.pickedMesh;
                if (mesh.mfg && (mesh.mfg.entityClass === CONST.ENTITY_CLASS_ENEMY_SHIP)) {
                    const enemyShip = mesh.mfg.entity;
                    if (!enemyShip.isDestroyed()) {
                        this.targetEnemy(enemyShip);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    updateTarget(dt) {
        // shift target pos to center (0, 0)
        let { x, y } = this.targetPos;
        if (!this.isCursorInBufferZone() && (x !== 0 || y !== 0)) {
            const TINY = 1;
            const change = 30 * dt;
            x = utils.decreaseValueToZero(x, TINY, change);
            y = utils.decreaseValueToZero(y, TINY, change);
            this.targetPos = { x, y };

            this.target.left = `${x}px`;
            this.target.top = `${y}px`;
        }

        // picking meshes under target icon
        if (!this.pickEnemy()) {
            this.resetTarget();
        }
    }

    update(dt) {
        this.updateTarget(dt);

        const playerShip = this.ship;

        const fwdVel = playerShip.getFwdVelocity();
        dbg.setShipVelocity(fwdVel);

        const speedPercent = fwdVel / playerShip.getMaxVelocity();
        if (speedPercent >= 0) {
            this.speedBarPos.setProgress(speedPercent);

            this.speedBarPos.setVisible(true);
            this.speedBarNeg.setVisible(false);
        } else {
            const percent = Math.abs(fwdVel / playerShip.getMinVelocity());
            this.speedBarNeg.setProgress(percent);

            this.speedBarPos.setVisible(false);
            this.speedBarNeg.setVisible(true);
        }
        const energyPercent = playerShip.getCurEnergy() / playerShip.getMaxEnergy();
        this.energyBar.setProgress(energyPercent);

        if (playerShip.isEnergyInRedZone()) {
            this.energyBar.setColor('red');
        } else {
            this.energyBar.setColor('white');
        }

        // draw icons of enemies
        const invMatrix = playerShip.getMesh().computeWorldMatrix(true).clone().invert();

        const enemies = this.game.getBattleArea().getEnemies();
        enemies.forEach(enemy => {
            if (!enemy.isDestroyed()) {
                this.drawEnemyIcon(enemy, invMatrix);
            }
        });
        this.setEnemiesCount(this.game.getBattleArea().getEnemiesCount());
    }

    drawEnemyIcon(enemy, invMatrix) {
        const mesh = enemy.getMesh();
        const icon = enemy.getRadarIcon();

        let screenWidth = this.screenWidth;
        let screenHeight = this.screenHeight;

        // Convert the world position to screen coordinates
        const pos = mesh.getAbsolutePosition();
        const screenPos = BABYLON.Vector3.Project(
            pos,
            BABYLON.Matrix.Identity(),
            this.scene.getTransformMatrix(),
            this.scene.activeCamera.viewport.toGlobal(screenWidth, screenHeight)
        );

        const isVisible = this.scene.activeCamera.isInFrustum(mesh);
        if (isVisible) {
            const HEIGHT_OFFSET = enemy.getConfig().hpTextOffset;
            icon.top = screenPos.y - screenHeight * 0.5 - HEIGHT_OFFSET * screenHeight;
            icon.left = screenPos.x - screenWidth * 0.5;
        } else {
            screenWidth -= icon.widthNumeric * screenWidth;
            screenHeight -= icon.widthNumeric * screenHeight;

            // convert global enemy pos to local system of coordinates of the player ship
            const localPos = BABYLON.Vector3.TransformCoordinates(pos, invMatrix);

            // create a 2d vector projected to local YOZ plane, because OX is the forward direction of our ship
            const localPos2d = new BABYLON.Vector2(-localPos.z, -localPos.y);

            // get intersection point between 2d vector and rectangle
            const point = utils.getVectorRectangleIntersection(localPos2d.x, localPos2d.y, screenWidth, screenHeight);
            icon.top = point.y + 'px';
            icon.left = point.x + 'px';
        }
    }

    hide() {
        this.targetField.isVisible = false;
        this.target.isVisible = false;

        this.healthBar.setVisible(false);
        this.armorBar.setVisible(false);
        this.energyBar.setVisible(false);
        this.speedBarPos.setVisible(false);
        this.speedBarNeg.setVisible(false);

        this.setInfoPanelVisible(false);
    }

    clear() {
        this.scene.onPointerObservable.remove(this.pointerObserver);

        this.game = null;
        this.scene = null;
        this.ship = null;

        this.targetField.dispose();
        this.targetField = null;

        this.target.dispose();
        this.target = null;
        this.targetObj = null;

        this.speedBarPos.clear();
        this.speedBarPos = null;

        this.speedBarNeg.clear();
        this.speedBarNeg = null;

        this.energyBar.clear();
        this.energyBar = null;

        this.healthBar.clear();
        this.healthBar = null;

        this.armorBar.clear();
        this.armorBar = null;
    }
}
