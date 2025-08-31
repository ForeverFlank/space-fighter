"use strict";

import { GameObjects } from "./game-objects.js";
import { twoPi, vecAdd, vecDistance, vecDot, vecLengthSq, vecMul, vecSub } from "./math.js"

class AI {
    constructor(ship) {
        this.ship = ship;
        this.status = "idle";

        this.engageDistance = 1_000_000;
        this.farDistance = 100_000;
        this.nearDistance = 10_000;
    }

    updateCombat() {
        let targetShip = null, minDist = Infinity;

        for (const otherShip of GameObjects.ships) {
            if (this.ship === otherShip) continue;

            const dist = vecDistance(this.ship.pos, otherShip.pos);
            if (otherShip.team === "Allies" &&
                dist < this.engageDistance &&
                dist < minDist
            ) {
                targetShip = otherShip;
                minDist = dist;
            }
        }

        this.ship.enabledWeapons["sniper"] = minDist < this.engageDistance;
        this.ship.enabledWeapons["cannon"] = minDist < this.farDistance;
        this.ship.enabledWeapons["mg"] = minDist < this.nearDistance;

        if (targetShip === null) {
            this.ship.targets = []
            this.ship.turning = 0;
            return;
        }

        this.ship.targets = [
            { pos: targetShip.pos, vel: targetShip.vel }
        ];
    }

    updateAttitude() {
        if (this.ship.targets.length === 0) return;

        const targetPos = this.ship.targets[0].pos;
        const targetVel = this.ship.targets[0].vel;

        const currAngle = this.ship.rot;
        const targetAngle = Math.atan2(
            targetPos[1] - this.ship.pos[1],
            targetPos[0] - this.ship.pos[0],
        );
        let p = targetAngle - currAngle;
        p = ((p % twoPi) + twoPi) % twoPi;
        if (p > Math.PI) p -= twoPi;

        const relPos = [0, 0], relVel = [0, 0];
        vecSub(relPos, targetPos, this.ship.pos);
        vecSub(relVel, targetVel, this.ship.vel);
        const targetAngVel = (
            relPos[0] * relVel[1] - relPos[1] * relVel[0]
        ) / vecLengthSq(relPos);
        let d = targetAngVel - this.ship.angVel;

        const Kp = 2;
        const Kd = 2;
        let turning = Kp * p + Kd * d;
        turning *= this.ship.getInertia() / this.ship.torque;

        if (turning < -1) turning = -1;
        if (turning > 1) turning = 1;
        this.ship.turning = turning;
    }
}

function calculateFiringDirection(
    startPos, startVel,
    targetPos, targetVel,
    projectileSpeed
) {
    const deltaPos = [0, 0], deltaVel = [0, 0];
    vecSub(deltaPos, targetPos, startPos);
    vecSub(deltaVel, targetVel, startVel);

    const a = vecLengthSq(deltaPos);
    const b = vecDot(deltaPos, deltaVel);
    const c = vecLengthSq(deltaVel) - projectileSpeed * projectileSpeed;

    const inverseT = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);

    const direction = [0, 0];
    vecMul(direction, deltaPos, inverseT);
    vecAdd(direction, direction, deltaVel);
    vecMul(direction, direction, 1 / projectileSpeed);

    return direction;
}

export { AI, calculateFiringDirection }