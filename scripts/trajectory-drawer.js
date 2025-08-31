"use strict"

import { Orbit } from "./orbit.js";
import { getScreenPos, getWorldPos } from "./camera.js";
import { SolarSystem } from "./solar-system.js";
import { vecLengthSq, twoPi, solveBisection, vecAdd, vecSub, vecNormalize, vecRotate } from "./math.js";
import { Teams } from "./teams.js";

function drawShipOsculatingOrbit(ctx, ship, time) {
    const parent = ship.getParent();
    const soi = parent.soi;
    const mu = parent.mu;

    const parentPos = SolarSystem.getPlanetPositionAtTime(parent, time);
    const parentVel = SolarSystem.getPlanetVelocityAtTime(parent, time);

    const relShipPos = [0, 0], relShipVel = [0, 0];
    vecSub(relShipPos, ship.pos, parentPos);
    vecSub(relShipVel, ship.vel, parentVel);

    const orbit = Orbit.fromStateVectors(relShipPos, relShipVel, mu, time);

    ctx.strokeStyle = Teams[ship.team];

    ctx.beginPath();

    const steps = 180;
    let escape = false;
    let collision = false;
    let newOrbit = null;
    let grandparent = null;

    let arrowPos = null, arrowVel = null;

    const fStart = Orbit.getTrueAnomalyFromTime(orbit, mu, time);

    for (let i = 0; i <= steps && !escape && !collision; i++) {
        const fCurr = fStart + twoPi * i / steps;

        let pos = Orbit.getPositionFromTrueAnomaly(orbit, fCurr);

        if (i == Math.round(steps / 12)) {
            arrowPos = pos;
            arrowVel = Orbit.getVelocityFromTrueAnomaly(orbit, mu, fCurr);
        }

        const r2 = vecLengthSq(pos);
        escape = r2 > soi * soi;
        collision = r2 < parent.radius * parent.radius;

        if (escape || collision) {
            let target;
            if (escape) target = soi;
            if (collision) target = parent.radius;

            const sma = orbit.sma;
            const e = orbit.e;

            let left = fStart + twoPi * (i - 1) / steps;
            let right = fStart + twoPi * i / steps;

            const finalF = solveBisection(
                (m) => Orbit.getRadiusFromTrueAnomaly(sma, e, m),
                left, right, target, 1E-5, 10
            );

            pos = Orbit.getPositionFromTrueAnomaly(orbit, finalF);

            grandparent = parent.getParent();

            const finalTime = Orbit.getTimeFromTrueAnomaly(orbit, mu, finalF, time);
            const {
                pos: finalPos,
                vel: finalVel
            } = Orbit.getStateVectors(orbit, mu, finalTime);
            const {
                pos: finalParentPos,
                vel: finalParentVel
            } = Orbit.getStateVectors(parent.orbit, grandparent.mu, finalTime);

            const worldPos = [0, 0], worldVel = [0, 0];
            newOrbit = Orbit.fromStateVectors(
                vecAdd(worldPos, finalPos, finalParentPos),
                vecAdd(worldVel, finalVel, finalParentVel),
                grandparent.mu, finalTime
            );
        }

        vecAdd(pos, pos, parentPos);
        const screenPos = getScreenPos(pos);

        if (i === 0) ctx.moveTo(...screenPos);
        else ctx.lineTo(...screenPos);
    }

    ctx.stroke();
    
    if (arrowPos !== null) {
        const screenPos = getScreenPos(arrowPos);
        const angle = Math.atan2(arrowVel[1], arrowVel[0]);

        let points = [
            [-5, 4],
            [5, 0],
            [-5, -4]
        ].map(pt => vecAdd(pt, vecRotate(pt, pt, -angle), screenPos));

        ctx.fillStyle = Teams[ship.team];

        ctx.beginPath();
        ctx.moveTo(...points[0]);
        ctx.lineTo(...points[1]);
        ctx.lineTo(...points[2]);
        ctx.fill();
    }

    if (escape) {
        // drawShipNextOrbit(ctx, newOrbit, grandparent, time);
    }
}

function drawShipNextOrbit(ctx, orbit, parent, currTime) {
    const parentPos = SolarSystem.getPlanetPositionAtTime(
        parent, currTime
    );

    ctx.beginPath();

    const steps = 180;
    for (let i = 0; i <= steps; i++) {
        const f = Orbit.getTrueAnomalyFromTime(orbit, parent.mu, 0);
        const pos = Orbit.getPositionFromTrueAnomaly(
            orbit,
            f + twoPi * i / steps
        );

        pos[0] += parentPos[0];
        pos[1] += parentPos[1];

        const screenPos = getScreenPos(pos);

        if (i === 0) ctx.moveTo(...screenPos);
        else ctx.lineTo(...screenPos);
    }

    ctx.strokeStyle = "rgba(128, 0, 0, 1)";
    ctx.stroke();
}

export { drawShipOsculatingOrbit }