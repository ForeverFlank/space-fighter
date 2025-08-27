"use strict";

import { G } from "./orbit.js";
import { SolarSystem } from "./solar-system.js";

function getAccel(pos, time, sources) {
    let ax = 0, ay = 0;
    for (const body of sources) {
        const srcPos = SolarSystem.getPlanetPositionAtTime(
            body, time
        );
        const dx = srcPos[0] - pos[0];
        const dy = srcPos[1] - pos[1];
        const d2 = dx * dx + dy * dy;
        if (d2 < body.radius * body.radius) return false;

        const inv_d3 = 1 / (d2 * Math.sqrt(d2));
        const k = G * body.mass * inv_d3;
        ax += k * dx;
        ay += k * dy;
    }
    return [ax, ay];
};

const w0 = -1.7024143839193153;
const w1 = 1.3512071919596578;
const c = [w1 / 2, (w0 + w1) / 2, (w0 + w1) / 2, w1 / 2];
const d = [w1, w0, w1];

function step4thOrderSymplectic(pos, vel, time, dt, sources) {
    let newPos = [...pos];
    let newVel = [...vel];
    let newTime = time;

    for (let s = 0; s < 4; s++) {
        const a = getAccel(newPos, newTime, sources);
        if (!a) return false;

        if (s < 3) {
            newVel[0] += a[0] * d[s] * dt;
            newVel[1] += a[1] * d[s] * dt;
        }

        newPos[0] += newVel[0] * c[s] * dt;
        newPos[1] += newVel[1] * c[s] * dt;
        newTime += c[s] * dt;
    }

    return {
        pos: newPos,
        vel: newVel,
        time: newTime
    };
}

export { getAccel, step4thOrderSymplectic }