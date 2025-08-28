"use strict"

import { vecAdd } from "./math.js";
import { Orbit } from "./orbit.js";

class SolarSystem {
    static planets = {}

    static addPlanet(planet) {
        this.planets[planet.name] = planet;
    }

    static init(time = 0) {
        this.updatePlanetPositions(time);
        for (const key in this.planets) {
            const planet = this.planets[key];
            const parent = planet.getParent();
            if (parent === undefined) {
                planet.soi = Infinity;
                continue;
            }

            const m = planet.mass;
            const M = parent.mass;
            const a = planet.orbit.sma;
            planet.soi = a * Math.pow(m / M, 0.4);
        }
    }

    static updatePlanetPositions(time) {
        for (const key in this.planets) {
            const planet = this.planets[key];
            const parent = planet.getParent();
            if (parent === undefined) {
                planet.localPos = [0, 0];
                continue;
            }

            planet.localPos = Orbit.getPositionAtTime(
                planet.orbit, parent.mu, time
            );
        }
    }

    static getPlanetPosition(planet) {
        const parent = planet.getParent();
        if (parent === undefined) {
            return [0, 0];
        }

        const pos = planet.localPos;
        const parentPos = this.getPlanetPosition(parent);

        const out = [0, 0];
        return vecAdd(out, pos, parentPos);
    }

    static getPlanetPositionAtTime(planet, time) {
        const parent = planet.getParent();
        if (parent === undefined) {
            return [0, 0];
        }

        const pos = Orbit.getPositionAtTime(
            planet.orbit, parent.mu, time
        );
        const parentPos = this.getPlanetPositionAtTime(parent, time);

        const out = [0, 0];
        return vecAdd(out, pos, parentPos);
    }

    static getPlanetVelocityAtTime(planet, time) {
        const parent = planet.getParent();
        if (parent === undefined) {
            return [0, 0];
        }

        const pos = Orbit.getVelocityAtTime(
            planet.orbit, parent.mu, time
        );
        const parentPos = this.getPlanetVelocityAtTime(parent, time);

        const out = [0, 0];
        return vecAdd(out, pos, parentPos);
    }
}

export { SolarSystem }