"use strict";

import { SolarSystem } from "./solar-system.js";

class Projectile {
    constructor({
        pos,
        vel,
        mass,
        penetration,
        parentName,
        color,
        startTime,
        lifetime
    } = {}) {
        this.type = "projectile";

        this.pos = pos;
        this.lastPos = pos;
        this.vel = vel;
        this.parentName = parentName;

        this.mass = mass;
        this.penetration = penetration;
        
        this.color = color;
        
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

    raycast(ship) {
        
    }
}

export { Projectile }