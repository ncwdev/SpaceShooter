import { BaseState } from './BaseState.js';
import * as FadeEffect from '../Effects/FadeEffect.js';

const FADE_IN_TIME = 2.5;

export class ShowResultState extends BaseState {
    enter() {
        const scene = this.game.getScene();

        FadeEffect.fadeSceneIn(scene, FADE_IN_TIME, () => {
            this.game.clear();
        });
    }
}
