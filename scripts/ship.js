"use strict";

import { vecDot, vecLengthSq, vecSub } from "./math.js";
import { SolarSystem } from "./solar-system.js";

class Ship {
    constructor({
        team = "neutral",
        parentName = null,
        startLocalPos = [0, 0],
        startLocalVel = [0, 0],
        torque = 0,
        projectileArmor = 0,
        laserArmor = 0,
        nukeArmor = 0,
        maxProjectileArmor = 0,
        maxLaserArmor = 0,
        maxNukeArmor = 0,
        parts = [],
        mapSize = 100
    } = {}) {
        this.type = "ship";
        this.team = team;

        this.localPos = startLocalPos;
        this.localVel = startLocalVel;
        this.parentName = parentName;

        this.torque = torque;

        this.projectileArmor = projectileArmor;
        this.laserArmor = laserArmor;
        this.nukeArmor = nukeArmor;
        this.maxProjectileArmor = maxProjectileArmor;
        this.maxLaserArmor = maxLaserArmor;
        this.maxNukeArmor = maxNukeArmor;

        this.parts = parts;

        this.mapSize = mapSize;

        this.throttle = 0;
        this.sas = true;

        this.rot = Math.PI / 2;
        this.angVel = 0;

        this.weapons = [];
        this.engines = [];
        for (const part of parts) {
            if (part.partType === "Weapon") {
                part.enabled = true;
                this.weapons.push(part);
            }
            if (part.partType === "Engine") {
                this.engines.push(part);
            }
        }
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
            res += part.armor[0];
            res += part.armor[1];
            res += part.armor[2];
        }
        return res;
    }

    getMaxArmor() {
        let res = 0;
        for (const part of this.parts) {
            res += part.maxArmor[0];
            res += part.maxArmor[1];
            res += part.maxArmor[2];
        }
        return res;
    }

    getThrust() {
        let totalThrust = 0;
        for (const engine of this.engines) {
            if (engine.health === 0) continue;
            totalThrust += engine.thrust;
        }
        return totalThrust;
    }
    
    getIsp() {
        let totalThrust = 0, totalMassFlow = 0;
        for (const engine of this.engines) {
            if (engine.health === 0) continue;
            totalThrust += engine.thrust;
            totalMassFlow += engine.thrust / engine.isp;
        }
        if (totalMassFlow === 0) return 0;
        return totalThrust / totalMassFlow;
    }

    fire(time, targetWorldPos) {
        for (const weapon of Object.values(this.weapons)) {
            if (!weapon.enabled) continue;

            weapon.fire(
                time, this,
                targetWorldPos
            );
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
            const applied = damage * (1 - part.projectileReduction);
            part.projectileArmor -= damage - applied;
            part.health -= applied;

            if (part.projectileArmor < 0) part.projectileArmor = 0;
            if (part.health < 0) part.health = 0;
        }
    }
}

export { Ship }