"use strict";

import { vecAdd, vecLength, vecLengthSq, vecMul, vecMulAdd, vecSub } from "./math.js";
import { G } from "./orbit.js";
import { SolarSystem } from "./solar-system.js";

function getAccel(out, pos, time, sources) {
    out[0] = 0;
    out[1] = 0;

    const tmp = [0, 0];
    const tmp2 = [0, 0];

    for (const body of sources) {
        const srcPos = SolarSystem.getPlanetPositionAtTime(
            body, time
        );
        vecSub(tmp, srcPos, pos);
        const d2 = vecLengthSq(tmp);
        
        if (d2 < body.radius * body.radius) {
            return false;
        }

        const inv_d3 = 1 / (d2 * Math.sqrt(d2));
        const k = G * body.mass * inv_d3;
        vecMul(tmp2, tmp, k);
        vecAdd(out, out, tmp2);
    }

    return out;
}

function stepSemiImplicitEuler(pos, vel, time ,dt, sources) {
    const newPos = [...pos];
    const newVel = [...vel];

    const a = [0, 0];

    if (getAccel(a, newPos, time, sources) === false) {
        return false;
    }

    vecMulAdd(newVel, newVel, a, dt);
    vecMulAdd(newPos, newPos, newVel, dt);

    return {
        pos: newPos,
        vel: newVel,
        time: time + dt
    };
}

const w0 = -1.7024143839193153;
const w1 = 1.3512071919596578;
const c = [w1 / 2, (w0 + w1) / 2, (w0 + w1) / 2, w1 / 2];
const d = [w1, w0, w1];

function step4thOrderSymplectic(pos, vel, time, dt, sources) {
    const newPos = [...pos];
    const newVel = [...vel];
    let newTime = time;

    const a = [0, 0];
    const tmp = [0, 0];

    for (let s = 0; s < 4; s++) {
        if (getAccel(a, newPos, newTime, sources) === false) {
            return false;
        }

        if (s < 3) {
            vecMul(tmp, a, d[s] * dt);
            vecAdd(newVel, newVel, tmp);
        }

        vecMul(tmp, newVel, c[s] * dt);
        vecAdd(newPos, newPos, tmp);

        newTime += c[s] * dt;
    }

    return {
        pos: newPos,
        vel: newVel,
        time: newTime
    };
}

export { getAccel, stepSemiImplicitEuler, step4thOrderSymplectic };
