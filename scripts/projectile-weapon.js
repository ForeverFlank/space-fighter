"use strict";

import { GameObjects } from "./game-objects.js";
import { twoPi, vecAdd, vecSub, vecLength, vecMulAdd, vecRotate, vecMul, vecNormalize } from "./math.js";
import { Projectile } from "./projectile.js";
import { Weapon } from "./weapon.js";

class ProjectileWeapon extends Weapon {
    constructor({
        name,
        projectileTemplate,
        fireRate = 10,
        projectileSpeed = 1000,
        firingArc = twoPi,
        spreadAngle = 0
    }) {
        super({ name });

        this.projectileTemplate = projectileTemplate;

        this.fireRate = fireRate;
        this.projectileSpeed = projectileSpeed;

        this.firingArc = firingArc;
        this.spreadAngle = spreadAngle;
        this.cooldown = 0;
    }

    fire(time, ship, targetWorldPos, mountOffset = [0, 0], facing = 0) {
        if (time < this.cooldown) return;
        this.cooldown = time + 1 / this.fireRate;

        const gunPos = [0, 0];
        vecAdd(gunPos, ship.pos, mountOffset);

        const dir = [0, 0];
        vecSub(dir, targetWorldPos, gunPos);
        vecNormalize(dir, dir);

        const mountAngle = facing + ship.rot;
        const angleToTarget = Math.atan2(dir[1], dir[0]);
        
        let relAngle = angleToTarget - mountAngle;
        relAngle = ((relAngle % twoPi) + twoPi) % twoPi;
        if (relAngle > Math.PI) relAngle = twoPi - relAngle;

        // if (Math.abs(relAngle) > this.firingArc / 2) return;

        const halfSpread = this.spreadAngle / 2;
        const randomAngle = this.spreadAngle * Math.random() - halfSpread;

        vecRotate(dir, dir, randomAngle);

        const projVel = [0, 0];
        vecMulAdd(projVel, ship.vel, dir, this.projectileSpeed);

        const projectile = Object.assign({}, this.projectileTemplate);
        projectile.pos = [...gunPos];
        projectile.vel = projVel;
        projectile.parentName = ship.parentName;
        projectile.startTime = time;

        GameObjects.objects.push(new Projectile(projectile));

        const recoil = [0, 0];
        const massRatio = projectile.mass / ship.getMass();
        vecMul(recoil, dir, this.projectileSpeed * massRatio);

        vecSub(ship.vel, ship.vel, recoil);
    }
}

export { ProjectileWeapon };