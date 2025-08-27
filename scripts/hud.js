"use strict";

import { GameObjects } from "./game-objects.js";
import { formatDate, toDate } from "./time.js";

export function updateHUD(time) {
    const ship = GameObjects.controllingObject;

    if (ship) {
        document.getElementById("ship-health").innerText = 
            `Health: ${ship.health}/${ship.maxHealth}`;
        document.getElementById("ship-armor").innerText = 
            `Armor: ${ship.getTotalArmor()}/${ship.getMaxArmor()}`;
    }

    // const days = Math.floor(time / 86400);
    // const hours = Math.floor(time / 3600) % 24;
    // const minutes = Math.floor(time / 60) % 60;
    // const seconds = time % 60;
    // document.getElementById("time").innerText =
    //     `T+${days}d ${hours}h ${minutes}m ${seconds.toFixed(1)}s`;

    
    let currDate = toDate(time);
    document.getElementById("time").innerText = formatDate(currDate);
}
