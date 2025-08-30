"use strict";

import { deg2Rad, vecAdd, vecDot, vecLengthSq, vecMul, vecNormalize, vecRotate, vecSub } from "./math.js";
import { SolarSystem } from "./solar-system.js";

function onSegment(p, q, r) {
    return (
        q[0] <= Math.max(p[0], r[0]) &&
        q[0] >= Math.min(p[0], r[0]) &&
        q[1] <= Math.max(p[1], r[1]) &&
        q[1] >= Math.min(p[1], r[1])
    );
}

function checkWinding(p, q, r) {
    let val =
        (q[1] - p[1]) * (r[0] - q[0]) -
        (q[0] - p[0]) * (r[1] - q[1]);

    if (val === 0) return 0;
    return (val > 0) ? 1 : -1;
}

function intersectInto(p0, p1, q0, q1) {
    let o1 = checkWinding(p0, p1, q0);
    let o2 = checkWinding(p0, p1, q1);
    let o3 = checkWinding(q0, q1, p0);
    let o4 = checkWinding(q0, q1, p1);

    if (o1 === 1 && o2 === -1 && o3 !== o4)
        return true;

    if (o1 === 0 &&
        onSegment(p0, q0, p1)) return true;

    if (o2 === 0 &&
        onSegment(p0, q1, p1)) return true;

    if (o3 === 0 &&
        onSegment(q0, p0, q1)) return true;

    if (o4 === 0 &&
        onSegment(q0, p1, q1)) return true;

    return false;
}

function raycastRectanglePart(p0, p1, m, dir, part, hits) {
    const isRadiator = part.partType === "Radiator";

    const halfWidth = 0.5 * part.size[0];
    const halfHeight = 0.5 * part.size[2];
    const c = p0[1] - m * p0[0];

    const q0 = [-halfHeight, halfWidth];
    const q1 = [halfHeight, halfWidth];
    const q2 = [halfHeight, -halfWidth];
    const q3 = [-halfHeight, -halfWidth];

    const hitTop = intersectInto(p0, p1, q0, q1);
    const hitRgh = intersectInto(p0, p1, q1, q2);
    const hitBtm = intersectInto(p0, p1, q2, q3);
    const hitLft = intersectInto(p0, p1, q3, q0);

    let x, y, damageFactor;
    if (hitTop) {
        y = halfWidth;
        x = (y - c) / m;
        damageFactor = -dir[1];
        hits.push({ part, pos: [x, y], normal: [0, 1], damageFactor});
    }
    if (hitBtm) {
        y = -halfWidth;
        x = (y - c) / m;
        damageFactor = dir[1];
        hits.push({ part, pos: [x, y], normal: [0, -1], damageFactor });
    }
    if (hitLft) {
        x = -halfHeight;
        y = m * x + c;
        damageFactor = isRadiator ? 1 - dir[0] : dir[0];
        hits.push({ part, pos: [x, y], normal: [-1, 0], damageFactor });
    }
    if (hitRgh) {
        x = halfHeight
        y = m * x + c;
        damageFactor = isRadiator ? 1 + dir[0] : -dir[0];
        hits.push({ part, pos: [x, y], normal: [1, 0], damageFactor });
    }
}

function raycastTrapezoidPart(p0, p1, m, dir, part, hits) {
    const slope = 0.5 * (part.size[0] - part.size[1]) / part.size[2];

    const halfWidthRight = 0.5 * part.size[0];
    const halfWidthLeft = 0.5 * part.size[1];
    const halfHeight = 0.5 * part.size[2];
    const c = p0[1] - m * p0[0];

    function topSideEq(x) {
        return slope * (x + halfHeight) + halfWidthLeft;
    }
    function bottomSideEq(x) {
        return -slope * (x + halfHeight) - halfWidthLeft;
    }

    const q0 = [-halfHeight, halfWidthLeft];
    const q1 = [halfHeight, halfWidthRight];
    const q2 = [halfHeight, -halfWidthRight];
    const q3 = [-halfHeight, -halfWidthLeft];

    const hitTop = intersectInto(p0, p1, q0, q1);
    const hitRgh = intersectInto(p0, p1, q1, q2);
    const hitBtm = intersectInto(p0, p1, q2, q3);
    const hitLft = intersectInto(p0, p1, q3, q0);

    let x, y, damageFactor;
    if (hitTop) {
        const lhs = m - slope;
        const rhs = slope * halfHeight + halfWidthLeft - c;
        x = rhs / lhs;
        y = topSideEq(x);

        const normal = [Math.abs(slope), -1];
        vecNormalize(normal, normal);

        damageFactor = vecDot(dir, normal);
        vecMul(normal, normal, -1);
        hits.push({ part, pos: [x, y], normal, damageFactor });
    }
    if (hitBtm) {
        const lhs = m + slope;
        const rhs = -slope * halfHeight - halfWidthLeft - c;
        x = rhs / lhs;
        y = bottomSideEq(x);

        const normal = [Math.abs(slope), 1];
        vecNormalize(normal, normal);
        
        damageFactor = vecDot(dir, normal);
        vecMul(normal, normal, -1);
        hits.push({ part, pos: [x, y], normal, damageFactor });
    }
    if (hitLft) {
        x = -halfHeight;
        y = m * x + c;
        damageFactor = dir[0];
        hits.push({ part, pos: [x, y], normal: [-1, 0], damageFactor });
    }
    if (hitRgh) {
        x = halfHeight
        y = m * x + c;
        damageFactor = -dir[0];
        hits.push({ part, pos: [x, y], normal: [1, 0], damageFactor });
    }
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
        this.toBeDestroyed = false;
    }

    getParent() {
        return SolarSystem.planets[this.parentName];
    }

    setParent(planet) {
        this.parentName = planet.name;
    }

    raycast(ship) {
        const p0Orig = [0, 0], p1Orig = [0, 0];
        vecSub(p0Orig, this.lastPos, ship.lastPos);
        vecSub(p1Orig, this.pos, ship.pos);
        vecRotate(p0Orig, p0Orig, -ship.rot);
        vecRotate(p1Orig, p1Orig, -ship.rot);
        
        const dir = [0, 0];
        vecSub(dir, p1Orig, p0Orig);
        vecNormalize(dir, dir);

        const hits = [];
        const m = (p1Orig[1] - p0Orig[1]) / (p1Orig[0] - p0Orig[0]);
        
        const p0 = [0, 0], p1 = [0, 0];
        for (const part of ship.parts) {
            vecSub(p0, p0Orig, part.pos);
            vecSub(p1, p1Orig, part.pos);

            if (part.size[0] === part.size[1]) {
                raycastRectanglePart(p0, p1, m, dir, part, hits);
            } else {
                raycastTrapezoidPart(p0, p1, m, dir, part, hits);
            }
        }

        const d0 = [0, 0], d1 = [0, 0];
        hits.sort((a, b) => {
            vecSub(d0, p0Orig, a.pos);
            vecSub(d1, p0Orig, b.pos);
            return vecLengthSq(d0) - vecLengthSq(d1);
        });

        ship.applyProjectileDamages(this, hits);
    }
}

export { Projectile }