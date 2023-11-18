const en = {
    TXT_TITLE: "Space shooter",
    TXT_ENEMIES_NUM: "Number of enemies:",
    TXT_PLAY: "Play",
    TXT_LOADING: "Loading...",
    TXT_ENEMIES: "Enemies: ",
    TXT_MISSELES:"Missiles: ",
    TXT_ESCAPE_INFO: "Esc to return to the menu",
    TXT_EXIT_CONFIRM: "Are you sure you want to quit?",
    TXT_WIN: "WIN!",
    TXT_LOST: "GAME OVER",
    TXT_CONTROLS: "WASD + QE + mouse",
    TXT_GOAL: "Defeat all enemies",
    TXT_MISSILE_INFO: "Collect loot from enemies to get missiles",
};
const ru = {
    TXT_TITLE: "Space shooter",
    TXT_ENEMIES_NUM: "Число врагов:",
    TXT_PLAY: "В бой",
    TXT_LOADING: "Загрузка...",
    TXT_ENEMIES: "Враги: ",
    TXT_MISSELES:"Ракеты: ",
    TXT_ESCAPE_INFO: "Esc для возврата в меню",
    TXT_EXIT_CONFIRM: "Выйти в меню?",
    TXT_WIN: "Победа!",
    TXT_LOST: "Вы проиграли...",
    TXT_CONTROLS: "WASD + QE + мышка",
    TXT_GOAL: "Победи всех врагов",
    TXT_MISSILE_INFO: "Собирай лут с врагов, чтобы получить ракеты",
};

// too lazy to make selector...
let cur_lang = en;

function getLocText(id) {
    return cur_lang[id];
}

let elem = document.getElementById('GameTitle');
elem.innerText = getLocText("TXT_TITLE");

elem = document.getElementById('EnemyNumberTxt');
elem.innerText = getLocText("TXT_ENEMIES_NUM");

elem = document.getElementById('PlayTxt');
elem.innerText = getLocText("TXT_PLAY");