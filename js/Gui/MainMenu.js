const div_menu = document.getElementById("MainMenu");
const div_enemy_number = document.getElementById("EnemyNumber");
const div_enemy_number_slider = document.getElementById("EnemyNumberSlider");

let enemies_num = 3;

div_enemy_number_slider.addEventListener("input", function() {
    enemies_num = div_enemy_number_slider.value;
    div_enemy_number.innerHTML = enemies_num;
});

export const MainMenu = {
    setVisible(flag) {
        div_menu.style.display = flag ? "grid" : "none";
    },
    getEnemiesNumber() {
        return enemies_num;
    },
    setMaxEnemiesNumber(num) {
        div_enemy_number_slider.max = num;
    }
};