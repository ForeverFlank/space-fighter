"use strict";

import { vecDot, vecLengthSq, vecSub } from "./math.js";
import { SolarSystem } from "./solar-system.js";

class Ship {
    constructor({
        team = "neutral",
        parentName = null,
        startLocalPos = [0, 0],
        startLocalVel = [0, 0],
        thrust = 0,
        isp = 0,
        torque = 0,
        projectileArmor = 0,
        laserArmor = 0,
        nukeArmor = 0,
        maxProjectileArmor = 0,
        maxLaserArmor = 0,
        maxNukeArmor = 0,
        parts = [],
        weapons = [],
        mapSize = 100
    } = {}) {
        this.type = "ship";
        this.team = team;

        this.localPos = startLocalPos;
        this.localVel = startLocalVel;
        this.parentName = parentName;

        this.thrust = thrust;
        this.isp = isp;
        this.torque = torque;

        this.projectileArmor = projectileArmor;
        this.laserArmor = laserArmor;
        this.nukeArmor = nukeArmor;
        this.maxProjectileArmor = maxProjectileArmor;
        this.maxLaserArmor = maxLaserArmor;
        this.maxNukeArmor = maxNukeArmor;

        this.parts = parts;
        this.weapons = weapons;

        this.mapSize = mapSize;

        this.throttle = 0;
        this.sas = true;

        this.rot = Math.PI / 2;
        this.angVel = 0

        this.parts.forEach((part) => {
            const area = part.size[0] * part.size[1];
            part.mass = part.density * area;

            part.maxHealth = part.healthPerArea * area;
            part.health = part.maxHealth;

            part.maxProjectileArmor = part.armorPerArea[0] * area;
            part.maxLaserArmor = part.armorPerArea[1] * area;
            part.maxNukeArmor = part.armorPerArea[2] * area;

            part.projectileArmor = part.maxProjectileArmor;
            part.laserArmor = part.maxLaserArmor;
            part.nukeArmor = part.maxNukeArmor;

            part.projectileReduction = part.armorReduction[0];
            part.laserReduction = part.armorReduction[1];
            part.nukeReduction = part.armorReduction[2];

            if (part.hitChance === undefined) {
                part.hitChance = 1;
            }
            if (part.damageMultiplier === undefined) {
                part.damageMultiplier = 1;
            }
        });
    }

    getParent() {
        return SolarSystem.planets[this.parentName];
    }

    setParent(planet) {
        this.parentName = planet.name;
    }

    getMass() {
        let res = 0;
        for (const part of this.parts) {
            res += part.mass;
        }
        return res;
    }

    getInertia() {
        return 5000;
    }

    getTotalHealth() {
        let res = 0;
        for (const part of this.parts) {
            res += part.health;
        }
        return res;
    }
    
    getMaxHealth() {
        let res = 0;
        for (const part of this.parts) {
            res += part.maxHealth;
        }
        return res;
    }

    getTotalArmor() {
        let res = 0;
        for (const part of this.parts) {
            res += part.projectileArmor;
            res += part.laserArmor;
            res += part.nukeArmor;
        }
        return res;
    }

    getMaxArmor() {
        let res = 0;
        for (const part of this.parts) {
            res += part.maxProjectileArmor;
            res += part.maxLaserArmor;
            res += part.maxNukeArmor;
        }
        return res;
    }

    fire(time, targetWorldPos) {
        for (const weapon of Object.values(this.weapons)) {
            if (!weapon.enabled) continue;

            weapon.weapon.fire(
                time,
                this,
                targetWorldPos,
                weapon.mount,
                weapon.facing
            )
        }
    }

    applyProjectileDamages(projecitle, hits) {
        const relVel = [0, 0];
        vecSub(relVel, projecitle.vel, this.vel);

        const energy = 0.0005 * projecitle.mass * vecLengthSq(relVel);

        for (const hit of hits) {
            const part = hit.part;
            if (Math.random() > part.hitChance) continue;

            const damage = energy * Math.cos(hit.angle) * part.damageMultiplier;
            // console.log(damage)
            const applied = damage * (1 - part.projectileReduction);
            part.projectileArmor -= damage - applied;
            part.health -= applied;

            if (part.projectileArmor < 0) part.projectileArmor = 0;
            if (part.health < 0) part.health = 0;
        }
    }
}

export { Ship }