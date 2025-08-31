"use strict";

import { Timewarp } from "./main.js";
import { GameObjects } from "./game-objects.js";
import { InputState } from "./input.js";
import { formatDate, toDate } from "./time.js";
import { getScreenSize } from "./camera.js";

// document.querySelectorAll(".toggle-btn").forEach(btn => {
//     const color = btn.dataset.color;
//     btn.style.setProperty("--btn-color", color);
// });

function formatNumber(num) {
    const parts = num.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
}

function updateUI(time) {
    const currShip = GameObjects.controllingShip;

    if (currShip) {
        document.getElementById("ship-health").innerText =
            "Health: " + Math.round(currShip.getTotalHealth()) +
            "/" + Math.round(currShip.maxHealth);

        document.getElementById("ship-armor").innerText =
            "Armor: " + Math.round(currShip.getTotalArmor()) +
            "/" + Math.round(currShip.getMaxArmor());

        document.getElementById("ship-power").innerText =
            "Power: " + Math.round(currShip.power) +
            "/" + Math.round(currShip.maxPower);

        document.getElementById("ship-heat").innerText =
            "Heat: " + Math.round(currShip.heat) +
            "/" + Math.round(currShip.maxHeat);
    }

    for (const ship of GameObjects.ships) {
        ship.updateUI();
    }

    // const days = Math.floor(time / 86400);
    // const hours = Math.floor(time / 3600) % 24;
    // const minutes = Math.floor(time / 60) % 60;
    // const seconds = time % 60;
    // document.getElementById("time").innerText =
    //     `T+${days}d ${hours}h ${minutes}m ${seconds.toFixed(1)}s`;

    const camButton = document.getElementById("button-cam");
    if (InputState.camMode) {
        camButton.classList.add("on");
    } else {
        camButton.classList.remove("on");
    }

    const weaponMenu = document.getElementById("weapons-menu");
    for (const key in currShip.enabledWeapons) {
        const btn = weaponMenu.querySelector(`[data-weapon="${key}"]`);
        if (btn == null) console.log('e')
        if (currShip.enabledWeapons[key]) {
            btn.classList.add("on");
        } else {
            btn.classList.remove("on");
        }
    }

    let currDate = toDate(time);
    document.getElementById("time").innerText = formatDate(currDate);
    document.getElementById("time-speed").innerText = Timewarp.speed + "x";

    const scaleBar = document.getElementById("scale-bar");
    const scaleText = document.getElementById("scale-value");

    let worldSize = 0.1;
    let screenSize = 0.1;

    for (let i = 0; screenSize < 100; i++) {
        worldSize *= (i % 3 == 1) ? 2.5 : 2;
        screenSize = getScreenSize(worldSize);
    }

    scaleBar.style.width = screenSize + "px";

    if (worldSize < 1E3) {
        scaleText.innerText = worldSize + " m";
    } else {
        scaleText.innerText = formatNumber(worldSize / 1E3) + " km";
    }
}

export { updateUI }