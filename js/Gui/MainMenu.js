const divMenu = document.getElementById('MainMenu');
const divEnemyNumber = document.getElementById('EnemyNumber');
const divEnemyNumberSlider = document.getElementById('EnemyNumberSlider');
const playButton = document.getElementById('PlayTxt');

let enemiesNumber = 3;

divEnemyNumberSlider.addEventListener('input', function() {
    enemiesNumber = divEnemyNumberSlider.value;
    divEnemyNumber.innerHTML = enemiesNumber;
});

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
