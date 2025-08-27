"use strict"

import { Orbit } from "./orbit.js";

class SolarSystem {
    static planets = {}

    static addPlanet(planet) {
        this.planets[planet.name] = planet;
    }

    static init(time = 0) {
        this.updatePlanetPositions(time);
        for (let key in this.planets) {
            let planet = this.planets[key];
            let parent = planet.getParent();
            if (parent === undefined) {
                planet.soi = Infinity;
                continue;
            }
            
            let m = planet.mass;
            let M = parent.mass;
            let a = planet.orbit.sma;

            planet.soi = a * Math.pow(m / M, 0.4);
        }
    }

    static updatePlanetPositions(time) {
        for (let key in this.planets) {
            let planet = this.planets[key];
            let parent = planet.getParent();
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
        let parent = planet.getParent();
        if (parent === undefined) {
            return [0, 0];
        }

        let pos = planet.localPos;
        let parentPos = this.getPlanetPosition(parent);

        return [pos[0] + parentPos[0], pos[1] + parentPos[1]];
    }

    static getPlanetPositionAtTime(planet, time) {
        let parent = planet.getParent();
        if (parent === undefined) {
            return [0, 0];
        }

        let pos = Orbit.getPositionAtTime(
            planet.orbit, parent.mu, time
        );
        let parentPos = this.getPlanetPositionAtTime(parent, time);

        return [pos[0] + parentPos[0], pos[1] + parentPos[1]];
    }

    static getPlanetVelocityAtTime(planet, time) {
        let parent = planet.getParent();
        if (parent === undefined) {
            return [0, 0];
        }

        let pos = Orbit.getVelocityAtTime(
            planet.orbit, parent.mu, time
        );
        let parentPos = this.getPlanetVelocityAtTime(parent, time);

        return [pos[0] + parentPos[0], pos[1] + parentPos[1]];
    }
}

export { SolarSystem }