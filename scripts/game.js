"use strict";

import { Orbit } from "./orbit.js";
import { SolarSystem } from "./solar-system.js";
import { GameObjects } from "./game-objects.js";
import { InputState } from "./input.js";
import { FocusTarget, getWorldPos, updateCamera } from "./camera.js";
import { Planet } from "./planet.js";
import { deg2Rad } from "./math.js";

class Game {
    static start(time = 0) {
        SolarSystem.addPlanet(new Planet({
            name: "Sun",
            mass: 1.989E+30,
            radius: 696_265_000,
            color: "#fffdc0ff",
            satelliteNames: ["Earth", "Mars"]
        }));

        SolarSystem.addPlanet(new Planet({
            name: "Earth",
            mass: 5.972E+24,
            radius: 6_378_137,
            color: "#4f98ffff",
            parentName: "Sun",
            satelliteNames: ["Moon"],
            orbit: new Orbit(
                149.6E+9,
                0.0167,
                102.94719 * deg2Rad,
                358.617 * deg2Rad,
                0
            )
        }));

        SolarSystem.addPlanet(new Planet({
            name: "Moon",
            mass: 7.342E+22,
            radius: 1_737_400,
            color: "#ddddddff",
            parentName: "Earth",
            orbit: new Orbit(
                384.4E+6,
                0.0549,
                318.15 * deg2Rad,
                134.96292 * deg2Rad,
                0
            )
        }));

        SolarSystem.addPlanet(new Planet({
            name: "Mars",
            mass: 6.4171E+23,
            radius: 3_389_500,
            color: "#ff6040ff",
            parentName: "Sun",
            orbit: new Orbit(
                227.9E+9,
                0.0935,
                336.04084 * deg2Rad,
                19.412 * deg2Rad,
                0
            )
        }));

        SolarSystem.init(time);
        GameObjects.init(time);

        FocusTarget.type = "planet";
        FocusTarget.object = SolarSystem.planets["Moon"];
        
    }

    static update(time, timeSpeed, dt) {
        SolarSystem.updatePlanetPositions(time);

        let stepDt = 1 / 60;
        if (timeSpeed >= 10) stepDt = 1 / 10;
        if (timeSpeed >= 1_000) stepDt = 1;
        if (timeSpeed >= 10_000) stepDt = 10;

        const currShip = GameObjects.controllingObject;
        currShip.throttle = InputState.throttle;
        currShip.sas = InputState.sas;

        let turning = 0;
        const torque = currShip.torque;
        const inertia = currShip.getInertia();
        if (InputState.turning != 0) {
            turning = InputState.turning;
        } else if (currShip.sas) {
            turning = -currShip.angVel * inertia / torque / dt;
        }
        turning = Math.max(-1, Math.min(turning, 1));
        const angAccel = turning * torque / inertia;
        currShip.angVel += angAccel * dt;

        const sin = Math.sin(currShip.rot);
        const cos = Math.cos(currShip.rot);
        const accel = currShip.throttle * currShip.thrust / currShip.getMass();

        currShip.vel[0] += cos * accel * dt;
        currShip.vel[1] += sin * accel * dt;
        
        GameObjects.update(time, stepDt);

        updateCamera(time);

        this.updateShipFiring(time);

        if (InputState.firing) {
            currShip.fire(time);
        }
    }

    static updateShipFiring(time) {
        const currShip = GameObjects.controllingObject;

        if (InputState.firing) {
            const targetWorldPos = getWorldPos(InputState.mousePos);
            currShip.fire(time, targetWorldPos);
        }
    }
}

export { Game };