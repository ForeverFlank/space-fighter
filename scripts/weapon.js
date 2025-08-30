"use strict";

import { Part } from "./part.js";

class Weapon extends Part {
    constructor(opts = {}) {
        super({
            partType: "Weapon",
            density: 100,
            healthPerArea: 20,
            hitChance: 0.2,
            damageMultiplier: 0.5,
            ...opts
        });
    }

    fire(time, ship) {

    }
}

export { Weapon }