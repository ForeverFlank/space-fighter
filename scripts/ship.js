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

function displayNumber(num) {
    if (num < 1_000) {
        return Math.round(num);
    }
    if (num < 10_000) {
        return (num / 1_000).toFixed(2) + "k";
    }
    if (num < 1_000_000) {
        return (num / 1_000).toFixed(1) + "k";
    }
    return (num / 1_000_000).toFixed(2) + "M";
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
        this.mapSize = mapSize;
        this.parts = parts;
        
        this.throttle = 0;
        this.sas = true;
        
        this.rot = rot;
        this.angVel = angVel;
        this.torque = torque;

        this.maxHealth = 0;
        this.maxPower = 0;
        this.maxHeat = 0;

        this.engines = [];
        this.reactors = [];
        this.radiators = [];
        this.weapons = [];
        
        this.enabledWeapons = {
            "mg": false,
            "cannon": false,
            "sniper": false,
        };

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

        const armorBar = document.createElement("div");
        armorBar.classList.add("ship-ui-armor-bar");
        containerUI.appendChild(armorBar);
        this.armorBar = armorBar;

        const armorBarValue = document.createElement("div");
        armorBarValue.classList.add("ship-ui-armor-bar-value");
        armorBar.appendChild(armorBarValue);
        this.armorBarValue = armorBarValue;

        const healthText = document.createElement("p");
        healthText.classList.add("ship-ui-health-text");
        containerUI.appendChild(healthText);
        this.healthText = healthText;
    }

    destroy() {
        this.containerUI.innerHTML = "";
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

    getArmorAmount() {
        let res = [0, 0, 0];
        for (const part of this.parts) {
            res[0] += part.armor[0];
            res[1] += part.armor[1];
            res[2] += part.armor[2];
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
        this.containerUI.style.position = "fixed";
        this.containerUI.style.left = x + "px";
        this.containerUI.style.top = y + "px";

        const totalHealth = this.getTotalHealth();
        const maxHealth = this.maxHealth;
        const healthPercent = 100 * totalHealth / maxHealth;

        const totalArmor = this.getTotalArmor();
        const maxArmor = this.getMaxArmor();
        const armorPercent = 100 * totalArmor / maxArmor;

        this.healthBarValue.style.width = healthPercent + "%";
        this.armorBarValue.style.width = armorPercent + "%";

        const armor = this.getArmorAmount();
        const total = armor.reduce((a, b) => a + b, 0);
        const width = armor.map(a => (a / total) * 100);
        const stops = [
            `#aaa 0% ${width[0]}%`,
            `#3dd ${width[0]}% ${width[0] + width[1]}%`,
            `#ea0 ${width[0] + width[1]}% 100%`
        ];

        this.armorBarValue.style.background =
            `linear-gradient(to right, ${stops.join(', ')})`;

        this.healthText.innerText =
            "❤ " + displayNumber(totalHealth) + " | " +
            "⛊ " + displayNumber(totalArmor);
    }

    fire(time, targetWorldPos) {
        for (const weapon of this.weapons) {
            if (!this.enabledWeapons[weapon.weaponClass]) {
                continue;
            }

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