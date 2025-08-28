"use strict";

import { vecLengthSq, vecRotate, vecSub } from "./math.js";
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

        const hits = [];
        const m = (p1[1] - p0[1]) / (p1[0] - p0[0]);

        for (const col of ship.colliders) {

            const left = col.pos[0] - col.size[0] / 2;
            const right = col.pos[0] + col.size[0] / 2;
            const top = col.pos[1] + col.size[1] / 2;
            const bottom = col.pos[1] - col.size[1] / 2;

            if (p0[0] < p1[0]) {
                const y = m * (left - p0[0]) + p0[1];
                if (bottom <= y && y <= top) {
                    hits.push({
                        pos: [left, y],
                        normal: [-1, 0]
                    })
                }
            } else {
                const y = m * (right - p0[0]) + p0[1];
                if (bottom <= y && y <= top) {
                    hits.push({
                        pos: [right, y],
                        normal: [1, 0]
                    })
                }
                
            }
            if (p0[1] < p1[1]) {
                const x = (bottom - p0[1]) / m + p0[0];
                if (left <= x && x <= right) {
                    hits.push({
                        pos: [x, bottom],
                        normal: [0, -1]
                    })
                }
            } else {
                const x = (top - p0[1]) / m + p0[0];
                if (left <= x && x <= right) {
                    hits.push({
                        pos: [x, top],
                        normal: [0, 1]
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

        if (hits.length > 0) console.log(hits[0].pos)
    }
}

export { Projectile }