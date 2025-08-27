"use strict";

import { SolarSystem } from "./solar-system.js";

class Projectile {
    constructor({
        pos,
        vel,
        parentName,
        startTime,
        lifetime
    } = {}) {
        this.type = "projectile";
        this.pos = pos;
        this.vel = vel;
        this.parentName = parentName;
        this.startTime = startTime;
        this.time = startTime;
        this.lifetime = lifetime;
    }

    getParent() {
        return SolarSystem.planets[this.parentName];
    }

    setParent(planet) {
        this.parentName = planet.name;
    }
}

export { Projectile }