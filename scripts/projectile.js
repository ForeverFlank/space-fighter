"use strict";

import { twoPi, vecDot, vecLengthSq, vecNormalize, vecRotate, vecSub } from "./math.js";
import { SolarSystem } from "./solar-system.js";

function isBetween(num, a, b) {
    return (a < num && num < b) || (a > num && num > b);
}

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
        vecSub(p0, p0, part.pos);
        vecSub(p1, p1, part.pos);

        const dir = [0, 0];
        vecSub(dir, p1, p0);
        vecNormalize(dir, dir);

        const hits = [];
        const m = (p1[1] - p0[1]) / (p1[0] - p0[0]);

        for (const part of ship.parts) {
            if (part.size[0] === part.size[1]) {
                const halfWidth = part.size[0] / 2;
                const halfHeight = part.size[2] / 2;

                const leftSideHit = p0[0] < p1[0];
                const topSideHit = p0[1] > p1[1];

                if (leftSideHit) {
                    const y = m * (-halfWidth - p0[0]) + p0[1];
                    if (-halfHeight <= y && y <= halfHeight) {
                        hits.push({
                            part: part,
                            pos: [-halfWidth, y],
                            angle: Math.acos(vecDot(dir, [1, 0]))
                        })
                    }
                } else {
                    const y = m * (halfWidth - p0[0]) + p0[1];
                    if (-halfHeight <= y && y <= halfHeight) {
                        hits.push({
                            part: part,
                            pos: [halfWidth, y],
                            angle: Math.acos(vecDot(dir, [-1, 0]))
                        })
                    }

                }
                if (topSideHit) {
                    const x = (halfHeight - p0[1]) / m + p0[0];
                    if (-halfWidth <= x && x <= halfWidth) {
                        hits.push({
                            part: part,
                            pos: [x, halfHeight],
                            angle: Math.acos(vecDot(dir, [0, -1]))
                        })
                    }
                } else {
                    const x = (-halfHeight - p0[1]) / m + p0[0];
                    if (-halfWidth <= x && x <= halfWidth) {
                        hits.push({
                            part: part,
                            pos: [x, -halfHeight],
                            angle: Math.acos(vecDot(dir, [0, 1]))
                        })
                    }
                }
            } else {
                const m2 = 2 * h / (part.size[1] - part.size[0]);
                const s = m * p0[0] - p0[1];
                const halfWidthTop = part.size[0] / 2;
                const halfWidthBtm = part.size[1] / 2;
                const halfHeight = part.size[2] / 2;

                function leftSideEq(x) {
                    return m2 * (x + halfWidthBtm) - halfHeight;
                }

                function rightSideEq(x) {
                    return -m2 * (x - halfWidthTop) + halfHeight;
                }

                const leftSideHit = (m2 > 0) === 
                    p0[1] > leftSideEq(p0[0]) &&
                    p1[1] < leftSideEq(p1[0]);
                const rightSideHit = (m2 > 0) === 
                    p0[1] > rightSideEq(p0[0]) &&
                    p1[1] < rightSideEq(p1[0]);
                const topSideHit = p0[1] > p1[1];

                if (leftSideHit) {
                    const lhs = m - m2;
                    const rhs = s + m2 * halfWidthBtm - halfHeight;
                    const x = rhs / lhs;
                    if (isBetween(x, -halfWidthTop, -halfWidthBtm)) {   
                        const normal = m2 > 0
                            ? [m2, -1]
                            : [-m2, 1];
                        vecNormalize(normal, normal);
                        hits.push({
                            part: part,
                            pos: [x, leftSideEq(x)],
                            angle: Math.acos(vecDot(dir, normal))
                        })
                    }
                }
                if (rightSideHit) {
                    const lhs = m + m2;
                    const rhs = s + m2 * halfWidthTop + halfHeight;
                    const x = rhs / lhs;
                    if (isBetween(x, halfWidthTop, halfWidthBtm)) {   
                        const normal = m2 > 0
                            ? [-m2, -1]
                            : [m2, 1];
                        vecNormalize(normal, normal);
                        hits.push({
                            part: part,
                            pos: [x, leftSideEq(x)],
                            angle: Math.acos(vecDot(dir, normal))
                        })
                    }
                }
                if (topSideHit) {
                    const x = (halfHeight - p0[1]) / m + p0[0];
                    if (-halfWidthTop <= x && x <= halfWidthTop) {
                        hits.push({
                            part: part,
                            pos: [x, halfHeight],
                            angle: Math.acos(vecDot(dir, [0, -1]))
                        })
                    }
                } else {
                    const x = (-halfHeight - p0[1]) / m + p0[0];
                    if (-halfWidthBtm <= x && x <= halfWidthBtm) {
                        hits.push({
                            part: part,
                            pos: [x, -halfHeight],
                            angle: Math.acos(vecDot(dir, [0, 1]))
                        })
                    }
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