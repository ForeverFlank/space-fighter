"use strict";

import { twoPi, vecDot, vecLengthSq, vecNormalize, vecRotate, vecSub } from "./math.js";
import { SolarSystem } from "./solar-system.js";

class Projectile {
    constructor({
        pos,
        vel,
        team,
        mass,
        penetration = 1,
        parentName,
        color,
        startTime,
        lifetime = 3600
    } = {}) {
        this.type = "projectile";
        this.team = team;

        this.pos = pos;
        this.lastPos = pos;
        this.vel = vel;
        this.parentName = parentName;

        this.mass = mass;
        this.penetration = penetration;

        this.color = color;

        this.startTime = startTime;
        this.time = startTime;
        this.lifetime = lifetime;
    }

    getParent() {
        return SolarSystem.planets[this.parentName];
    }

    setParent(planet) {
        this.parentName = planet.name;
    }

    raycast(ship) {
        const p0 = [0, 0];
        const p1 = [0, 0];
        vecSub(p0, this.lastPos, ship.lastPos);
        vecSub(p1, this.pos, ship.pos);
        vecRotate(p0, p0, -ship.rot);
        vecRotate(p1, p1, -ship.rot);

        const dir = [0, 0];
        vecSub(dir, p1, p0);
        vecNormalize(dir, dir);

        const hits = [];
        const m = (p1[1] - p0[1]) / (p1[0] - p0[0]);

        for (const part of ship.parts) {

            const left = part.pos[0] - part.size[0] / 2;
            const right = part.pos[0] + part.size[0] / 2;
            const top = part.pos[1] + part.size[1] / 2;
            const bottom = part.pos[1] - part.size[1] / 2;

            if (p0[0] < p1[0]) {
                const y = m * (left - p0[0]) + p0[1];
                if (bottom <= y && y <= top) {
                    hits.push({
                        part: part,
                        pos: [left, y],
                        angle: Math.acos(vecDot(dir, [1, 0]))
                    })
                }
            } else {
                const y = m * (right - p0[0]) + p0[1];
                if (bottom <= y && y <= top) {
                    hits.push({
                        part: part,
                        pos: [right, y],
                        angle: Math.acos(vecDot(dir, [-1, 0]))
                    })
                }
                
            }
            if (p0[1] < p1[1]) {
                const x = (bottom - p0[1]) / m + p0[0];
                if (left <= x && x <= right) {
                    hits.push({
                        part: part,
                        pos: [x, bottom],
                        angle: Math.acos(vecDot(dir, [0, 1]))
                    })
                }
            } else {
                const x = (top - p0[1]) / m + p0[0];
                if (left <= x && x <= right) {
                    hits.push({
                        part: part,
                        pos: [x, top],
                        angle: Math.acos(vecDot(dir, [0, -1]))
                    })
                }
            }
        }

        const d0 = [0, 0], d1 = [0, 0];
        hits.sort((a, b) => {
            vecSub(d0, p0, a);
            vecSub(d1, p1, b);
            return vecLengthSq(d0) - vecLengthSq(d1);
        });

        ship.applyProjectileDamages(this, hits);
    }
}

export { Projectile }