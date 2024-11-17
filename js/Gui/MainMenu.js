const divMenu = document.getElementById('MainMenu');
const divEnemyNumber = document.getElementById('EnemyNumber');
const divEnemyNumberSlider = document.getElementById('EnemyNumberSlider');
const playButton = document.getElementById('PlayTxt');
// const volumeSlider = document.getElementById('VolumeSlider');

let enemiesNumber = 3;

divEnemyNumberSlider.addEventListener('input', function() {
    enemiesNumber = divEnemyNumberSlider.value;
    divEnemyNumber.innerHTML = enemiesNumber;
});

// volumeSlider.addEventListener('input', function() {
//     const value = volumeSlider.value / 100.0;
//     BABYLON.Engine.audioEngine.setGlobalVolume(value);
// });

export const MainMenu = {
    setVisible(flag) {
        divMenu.style.display = flag ? 'grid' : 'none';
    },
    getEnemiesNumber() {
        return enemiesNumber;
    },
    setMaxEnemiesNumber(num) {
        divEnemyNumberSlider.max = num;
    },
    setOpacity(opacity) {
        divMenu.style.opacity = opacity;
    },
    enablePlayButton() {
        playButton.style.pointerEvents = 'auto';
    },
};
