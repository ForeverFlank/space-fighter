"use strict";

import { Timewarp } from "./main.js";
import { GameObjects } from "./game-objects.js";
import { InputState } from "./input.js";
import { formatDate, toDate } from "./time.js";
import { getScreenPos, getScreenSize } from "./camera.js";

// document.querySelectorAll(".toggle-btn").forEach(btn => {
//     const color = btn.dataset.color;
//     btn.style.setProperty("--btn-color", color);
// });

function updateUI(time) {
    const currShip = GameObjects.controllingObject;

    if (currShip) {
        document.getElementById("ship-health").innerText =
            "Health: " + Math.round(currShip.getTotalHealth()) +
            "/" + Math.round(currShip.getMaxHealth());

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

    let currDate = toDate(time);
    document.getElementById("time").innerText = formatDate(currDate);
    document.getElementById("time-speed").innerText = Timewarp.speed + "x";
}

export { updateUI }