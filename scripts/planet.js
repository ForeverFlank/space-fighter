"use strict"

import { G } from "./orbit.js";
import { SolarSystem } from "./solar-system.js";

class Planet {
    constructor({
        name,
        mass,
        radius,
        color,
        parentName,
        satelliteNames = [],
        orbit
    } = {}) {
        this.type = "planet";
        this.name = name;
        this.mass = mass;
        this.mu = G * mass;
        this.radius = radius;
        this.color = color;
        this.parentName = parentName;
        this.satelliteNames = satelliteNames;
        this.orbit = orbit;
    }

    getParent() {
        return SolarSystem.planets[this.parentName];
    }

    getSatellites() {
        return this.satelliteNames.map((satelliteName) =>
            SolarSystem.planets[satelliteName]
        );
    }
}

export { Planet }