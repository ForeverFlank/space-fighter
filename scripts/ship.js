"use strict";

import { vecAdd, vecDot, vecLengthSq, vecMul, vecRotate, vecSub } from "./math.js";
import { SolarSystem } from "./solar-system.js";

class Ship {
    constructor({
        team = "neutral",
        parentName = null,
        startLocalPos = [0, 0],
        startLocalVel = [0, 0],
        torque = 0,
        rot = 0.5 * Math.PI,
        angVel = 0,
        parts = [],
        mapSize = 100
    } = {}) {
        this.type = "ship";
        this.team = team;

        this.localPos = startLocalPos;
        this.localVel = startLocalVel;
        this.parentName = parentName;

        this.torque = torque;

        this.parts = parts;

        this.mapSize = mapSize;

        this.throttle = 0;
        this.sas = true;

        this.rot = rot;
        this.angVel = angVel;

        this.maxPower = 0;
        this.maxHeat = 0;

        this.engines = [];
        this.reactors = [];
        this.radiators = [];
        this.weapons = [];
        
        for (const part of parts) {
            if (part.partType === "Engine") {
                this.engines.push(part);
            }
            if (part.partType === "Reactor") {
                this.reactors.push(part);
                this.maxPower += part.powerStorage;
            }
            if (part.partType === "Radiator") {
                this.radiators.push(part);
            }
            if (part.partType === "Weapon") {
                part.enabled = true;
                this.weapons.push(part);
            }

            this.maxHeat += part.mass * 0.01;
        }

        this.totalPower = this.maxPower;
        this.totalHeat = 0;
    }

    updateResources(dt) {

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

    applyProjectileDamages(projectile, hits) {
        const relVel = [0, 0];
        vecSub(relVel, projectile.vel, this.vel);

        const energy = 0.0005 * projectile.mass * vecLengthSq(relVel);

        for (const hit of hits) {
            const part = hit.part;

            // if (Math.random() < part.hitChance) continue;
            if (hit.damageFactor <= 0) continue;

            
            const damage = energy * hit.damageFactor;
            const applied = damage * (1 - part.armorReduction[0]);
            part.armor[0] -= damage - applied;
            part.health -= applied;
            projectile.penetration -= damage;

            if (part.partType !== "Radiator") {
                const normal = hit.normal;
                vecRotate(normal, normal, this.rot);

                const relVel = [0, 0], rhs = [0, 0];
                vecSub(relVel, projectile.vel, this.vel);
                vecMul(rhs, normal, 2 * vecDot(relVel, normal));
                vecSub(relVel, relVel, rhs);
                vecAdd(relVel, relVel, this.vel);

                const hitPos = [0, 0];
                vecAdd(hitPos, hit.pos, hit.part.pos);
                vecRotate(hitPos, hitPos, this.rot);
                vecAdd(hitPos, hitPos, this.pos);
                
                projectile.pos = hitPos;
                projectile.vel = relVel;
            }
            
            if (part.armor[0] < 0) part.armor[0] = 0;
            if (part.health < 0) part.health = 0;
            // if (projectile.penetration < 0) {
            //     return {
            //         part: part,
            //         pos: hit.pos
            //     };
            // }
        }

        return null;
    }
}

export { Ship }