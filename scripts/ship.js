"use strict";

import { getScreenPos, getScreenSize } from "./camera.js";
import { vecAdd, vecDot, vecLengthSq, vecMul, vecRotate, vecSub } from "./math.js";
import { shipCloseupThresold } from "./renderer.js";
import { SolarSystem } from "./solar-system.js";

function calculateRicochetChance(projectile, cosAngle, v2) {
    const m = projectile.mass;
    const p = projectile.penetration;

    let angleFactor = 1 - cosAngle;
    angleFactor *= angleFactor;
    angleFactor = Math.tan(0.25 * Math.PI * angleFactor);
    angleFactor *= angleFactor;

    const velFactor = 1 + m * v2 * p / 2E+6;

    return angleFactor ** velFactor;
}

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

        this.maxHealth = 0;

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

            this.maxHealth += part.maxHealth;
            this.maxHeat += part.mass * 0.01;
        }

        this.power = this.maxPower;
        this.heat = 0;

        const containerUI = document.createElement("div");
        containerUI.classList.add("ship-ui");

        document.getElementById("world-ui").appendChild(containerUI);

        this.containerUI = containerUI;

        const healthBar = document.createElement("div");
        healthBar.classList.add("ship-ui-health-bar");
        containerUI.appendChild(healthBar);
        this.healthBar = healthBar;

        const healthBarValue = document.createElement("div");
        healthBarValue.classList.add("ship-ui-health-bar-value");
        healthBar.appendChild(healthBarValue);
        this.healthBarValue = healthBarValue;

        const healthText = document.createElement("p");
        healthText.classList.add("ship-ui-health-text");
        containerUI.appendChild(healthText);
        this.healthText = healthText;
    }

    destroy() {
        this.containerUI.remove();
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

    updateResources(dt) {
        for (const reactor of this.reactors) {
            if (reactor.health > 0) {
                this.power += reactor.powerGeneration * dt;
                this.heat += reactor.heatGeneration * dt;
            }
        }
        for (const radiator of this.radiators) {
            if (radiator.health > 0) {
                this.heat -= radiator.getDissipationRate() * dt;
            }
        }

        if (this.power < 0) {
            this.power = 0;
        }
        if (this.power > this.maxPower) {
            this.power = this.maxPower;
        }

        if (this.heat < 0) {
            this.heat = 0;
        }
    }

    updateUI() {
        const screenPos = getScreenPos(this.pos);
        const screenSize = getScreenSize(this.mapSize);

        if (screenSize <= shipCloseupThresold) {
            this.containerUI.style.opacity = "0";
        } else {
            this.containerUI.style.opacity = "1";
        }

        const x = screenPos[0];
        const y = screenPos[1] + Math.max(
            screenSize, shipCloseupThresold
        );
        this.containerUI.style.position = "absolute";
        this.containerUI.style.left = x + "px";
        this.containerUI.style.top = y + "px";

        const totalHealth = this.getTotalHealth();
        const maxHealth = this.maxHealth;
        this.healthText.innerText = Math.round(
            this.getTotalHealth()
        );

        this.healthBarValue.style.width = (
            100 * totalHealth / maxHealth
        ) + "%";

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

        const v2 = vecLengthSq(relVel);
        const energy = 0.0005 * projectile.mass * v2;

        for (const hit of hits) {
            const part = hit.part;

            if (Math.random() > part.hitChance) continue;
            if (hit.damageFactor <= 0) continue;

            const damage = energy * hit.damageFactor * part.damageMultiplier;
            const applied = damage * (1 - part.armorReduction[0]);
            part.armor[0] -= damage - applied;
            part.health -= applied;
            projectile.penetration -= damage;

            if (part.armor[0] < 0) part.armor[0] = 0;
            if (part.health < 0) part.health = 0;
            if (projectile.penetration <= 0) {
                const hitPos = [0, 0];
                vecAdd(hitPos, hit.pos, hit.part.pos);
                vecRotate(hitPos, hitPos, this.rot);
                vecAdd(hitPos, hitPos, this.pos);

                projectile.pos = hitPos;
                projectile.toBeDestroyed = true;
                break;
            }

            if (part.partType !== "Radiator" &&
                Math.random() < calculateRicochetChance(
                    projectile, hit.damageFactor, v2
                )) {
                const normal = hit.normal;
                vecRotate(normal, normal, this.rot);

                const bouncedVel = [0, 0], rhs = [0, 0];
                vecMul(rhs, normal, 2 * vecDot(relVel, normal));
                vecSub(bouncedVel, projectile.vel, this.vel);
                vecSub(bouncedVel, bouncedVel, rhs);
                vecAdd(bouncedVel, bouncedVel, this.vel);

                const hitPos = [0, 0];
                vecAdd(hitPos, hit.pos, hit.part.pos);
                vecRotate(hitPos, hitPos, this.rot);
                vecAdd(hitPos, hitPos, this.pos);

                projectile.pos = hitPos;
                projectile.vel = bouncedVel;
            }
        }
    }
}

export { Ship }