"use strict"

import { Orbit } from "./orbit.js";
import { getScreenPos } from "./camera.js";
import { SolarSystem } from "./solar-system.js";
import { GameObjects } from "./game-objects.js";
import { getAccel } from "./integrator.js";
import { vecLengthSq, twoPi, solveBisection } from "./math.js";

// unused
function computeShipTrajectory(ship, time) {
    const sources = GameObjects.getGravitySources(ship);
    let startTime, pos, vel, idx;

    if (ship.orbitCache && ship.orbitCache.length > 0) {
        const last = ship.orbitCache[ship.orbitCache.length - 1];
        startTime = last.time;
        pos = [...last.pos];
        vel = [...last.vel];
        idx = last.idx;
    } else {
        ship.orbitCache = [];
        startTime = time;
        pos = [...ship.pos];
        vel = [...ship.vel];
        idx = 0;
    }

    if (ship.orbitCache.length > 0 &&
        ship.orbitCache[0].idx >= 500) {
        ship.orbitCache = [];
        startTime = time;
        pos = [...ship.pos];
        vel = [...ship.vel];
        idx = 0;
    }

    while (
        ship.orbitCache.length > 0 &&
        ship.orbitCache[0].time <= time) {
        ship.orbitCache.shift();
    }

    // wanna use this? use statevector -> orbit -> period instead
    const period = estimateOrbitPeriod(ship, ship.parent);
    const endTime = time + Math.min(period, 86400);

    let dt = Math.max(10, (endTime - startTime) / 7200);

    const w0 = -1.7024143839193153;
    const w1 = 1.3512071919596578;
    const c = [w1 / 2, (w0 + w1) / 2, (w0 + w1) / 2, w1 / 2];
    const d = [w1, w0, w1];

    for (let t = startTime; t <= endTime; t += dt) {
        const a = getAccel(pos, t, sources);
        if (!a) break;

        ship.orbitCache.push({
            pos: [...pos],
            vel: [...vel],
            time: t,
            idx: idx++
        });

        let t_s = t;
        for (let s = 0; s < 4; s++) {
            const a = getAccel(pos, t_s, sources);
            if (!a) return false;

            if (s < 3) {
                vel[0] += a[0] * d[s] * dt;
                vel[1] += a[1] * d[s] * dt;
            }

            pos[0] += vel[0] * c[s] * dt;
            pos[1] += vel[1] * c[s] * dt;
            t_s += c[s] * dt;
        }
    }
}

function drawShipTrajectory(ctx, ship, time) {
    if (!ship.orbitCache || ship.orbitCache.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(...getScreenPos(ship.pos));

    const parentPosAtStart = SolarSystem.getPlanetPositionAtTime(
        ship.parent,
        time
    );

    for (let i = 0; i < ship.orbitCache.length; i++) {
        const point = ship.orbitCache[i];
        const orbitPoint = point.pos;
        const parentPos = SolarSystem.getPlanetPositionAtTime(
            ship.parent,
            point.time
        );
        const relPos = [...orbitPoint];
        relPos[0] += parentPosAtStart[0] - parentPos[0];
        relPos[1] += parentPosAtStart[1] - parentPos[1];

        ctx.lineTo(...getScreenPos(relPos));
    }
    ctx.stroke();
}

function drawShipOsculatingOrbit(ctx, ship, time) {
    const parent = ship.getParent();
    const soi = parent.soi;
    const mu = parent.mu;

    const parentPos = SolarSystem.getPlanetPositionAtTime(
        parent, time
    );
    const parentVel = SolarSystem.getPlanetVelocityAtTime(
        parent, time
    );

    const relShipPos = [
        ship.pos[0] - parentPos[0],
        ship.pos[1] - parentPos[1],
    ];
    const relShipVel = [
        ship.vel[0] - parentVel[0],
        ship.vel[1] - parentVel[1],
    ];

    const orbit = Orbit.fromStateVectors(
        relShipPos, relShipVel, mu, time
    );

    ctx.beginPath();

    const steps = 180;
    let escape = false;
    let collision = false;
    let newOrbit = null;
    let grandparent = null;

    for (let i = 0; i <= steps && !escape && !collision; i++) {
        const f = Orbit.getTrueAnomalyFromTime(
            orbit, mu, time
        );
        let pos = Orbit.getPositionFromTrueAnomaly(
            orbit, f + twoPi * i / steps
        );

        const r2 = vecLengthSq(pos);
        escape = r2 > soi * soi;
        collision = r2 < parent.radius * parent.radius;

        if (escape || collision) {
            let target;
            if (escape) target = soi;
            if (collision) target = parent.radius;

            const sma = orbit.sma;
            const e = orbit.e;

            let left = f + twoPi * (i - 1) / steps;
            let right = f + twoPi * i / steps;

            const finalF = solveBisection(
                (m) => Orbit.getRadiusFromTrueAnomaly(sma, e, m),
                left, right, target, 1E-5, 10
            );

            pos = Orbit.getPositionFromTrueAnomaly(
                orbit, finalF
            );

            grandparent = parent.getParent();

            const finalTime = Orbit.getTimeFromTrueAnomaly(
                orbit, mu, finalF, time
            );
            const {
                pos: finalPos,
                vel: finalVel
            } = Orbit.getStateVectors(
                orbit, mu, finalTime
            );
            const {
                pos: finalParentPos,
                vel: finalParentVel
            } = Orbit.getStateVectors(
                parent.orbit, grandparent.mu, finalTime
            );

            newOrbit = Orbit.fromStateVectors(
                [
                    finalPos[0] + finalParentPos[0],
                    finalPos[1] + finalParentPos[1]
                ],
                [
                    finalVel[0] + finalParentVel[0],
                    finalVel[1] + finalParentVel[1]
                ],
                grandparent.mu, finalTime
            );
        }

        pos[0] += parentPos[0];
        pos[1] += parentPos[1];

        const screenPos = getScreenPos(pos);

        if (i === 0) ctx.moveTo(...screenPos);
        else ctx.lineTo(...screenPos);
    }

    ctx.stroke();

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

export { computeShipTrajectory, drawShipTrajectory, drawShipOsculatingOrbit }