"use strict";

import { Orbit } from "./orbit.js";
import { SolarSystem } from "./solar-system.js";
import { GameObjects } from "./game-objects.js";
import { Planet } from "./planet.js";
import { Timewarp } from "./main.js";
import { InputState } from "./input.js";
import { focusTarget, getWorldPos, setCamScale, setFocusTarget, updateCamera } from "./camera.js";
import { deg2Rad, vecAdd, vecDot, vecLength, vecLengthSq, vecMul, vecSub } from "./math.js";

function segmentToPointDistance(p0, p1, q) {
    const p0q = [0, 0], p0p1 = [0, 0];
    vecSub(p0q, q, p0);
    vecSub(p0p1, p1, p0);

    const proj = [0, 0], d = [0, 0];
    const l = vecDot(p0q, p0p1) / vecLengthSq(p1);
    vecMul(proj, p1, l);
    vecAdd(d, proj, p0);

    const p0d = [0, 0]
    vecSub(p0d, d, p0);

    const k = Math.abs(p0p1.x) > Math.abs(p0p1.y)
        ? p0d[0] / p0p1[0]
        : p0d[1] / p0p1[1];

    const out = [0, 0];
    if (k <= 0.0) {
        vecSub(out, q, p0);
    } else if (k >= 1.0) {
        vecSub(out, q, p1);
    } else {
        vecSub(out, q, d);
    }

    return vecLength(out);
}

const planets = [
    {
        name: "Sun",
        mass: 1.989E+30,
        radius: 696_265_000,
        color: "#fffdc0ff",
        satelliteNames: ["Earth", "Mars"]
    },
    {
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
    },
    {
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
    },
    // {
    //     name: "Mars",
    //     mass: 6.4171E+23,
    //     radius: 3_389_500,
    //     color: "#ff6040ff",
    //     parentName: "Sun",
    //     orbit: new Orbit(
    //         227.9E+9,
    //         0.0935,
    //         336.04084 * deg2Rad,
    //         19.412 * deg2Rad,
    //         0
    //     )
    // }
];

class Game {
    static init() {
        for (const planet of planets) {
            SolarSystem.addPlanet(new Planet(planet));
        }
    }

    static loadLevel(level) {
        this.level = level;

        GameObjects.ships = level.ships;
    }

    static start(time = 0) {
        SolarSystem.init(time);
        GameObjects.init(time);

        setCamScale(50000);
        setFocusTarget(GameObjects.ships[this.level.focusTarget]);
    }

    static update(time, timeSpeed) {
        SolarSystem.updatePlanetPositions(time);

        if (!Game.canFastTimewarp() && 
            Timewarp.index > Timewarp.maxPhysicsTimewarpIndex) {
            Timewarp.index = Timewarp.maxPhysicsTimewarpIndex;
            Timewarp.speed = Timewarp.options[Timewarp.index];
        }

        let stepDt = 1 / 60;
        if (timeSpeed >= 2) stepDt = 1 / 30;
        if (timeSpeed >= 5) stepDt = 1 / 12;
        if (timeSpeed >= 10) stepDt = 1 / 6;
        if (timeSpeed >= 1_000) stepDt = 1;
        if (timeSpeed >= 10_000) stepDt = 10;

        const currShip = GameObjects.controllingShip;

        currShip.throttle = InputState.throttle;
        currShip.sas = InputState.sas;
        currShip.turning += InputState.turning;
        if (currShip.turning < -1) currShip.turning = -1;
        if (currShip.turning > 1) currShip.turning = 1;

        GameObjects.update(time, stepDt);

        updateCamera(time);

        currShip.turning = 0;
        if (InputState.firing &&
            !InputState.camMode &&
            Timewarp.index <= Timewarp.maxPhysicsTimewarpIndex) {

            const targetPos = getWorldPos(InputState.mousePos);
            const targetVel = focusTarget.vel;
            currShip.targets = [{
                pos: targetPos, vel: targetVel
            }];
        } else {
            currShip.targets = [];
        }

        this.raycastProjectiles();
        this.updateShipAI();
        this.updateShipFiring(time);
    }

    static canFastTimewarp() {
        for (const ship of GameObjects.ships) {
            if (ship.ai.status !== "idle") {
                return false;
            }
        }
        return true;
    }

    static updateShipAI() {
        for (const ship of GameObjects.ships) {
            if (ship !== GameObjects.controllingShip) {
                ship.ai.updateCombat();
            }
            ship.ai.updateAttitude();
        }
    }

    static updateShipFiring(time) {
        for (const ship of GameObjects.ships) {
            if (ship.targets.length === 0) continue;
            ship.fire(time);
        }
    }

    static raycastProjectiles() {
        for (const proj of GameObjects.projectiles) {
            for (const ship of GameObjects.ships) {
                if (proj.team === ship.team) continue;

                const relLastPos = [0, 0], relPos = [0, 0];
                vecSub(relLastPos, proj.lastPos, ship.lastPos);
                vecSub(relPos, proj.pos, ship.pos);
                const dist = segmentToPointDistance(
                    relLastPos, relPos, [0, 0]
                );
                if (dist < 2 * ship.size) {
                    proj.raycast(ship);
                }
            }
        }
    }
}

export { Game };