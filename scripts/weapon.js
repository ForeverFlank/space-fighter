"use strict";

import { Part } from "./part.js";

class Weapon extends Part {
    constructor(opts = {}) {
        super({
            partType: "Weapon",
            density: 100,
            healthPerArea: 50,
            ...opts
        });
    }

    fire(time, ship) {
        
    }
}

export { Weapon }