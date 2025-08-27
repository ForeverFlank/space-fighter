"use strict"

import { getWorldPos } from "./camera.js";
import { GameObjects } from "./game-objects.js";
import { InputState } from "./input.js";
import { Projectile } from "./projectile.js";
import { SolarSystem } from "./solar-system.js";

class Ship {
    constructor({
        team = "neutral",
        parentName = null,
        startLocalPos = [0, 0],
        startLocalVel = [0, 0],
        dryMass = 1000,
        propMass = 0,
        thrust = 0,
        isp = 0,
        torque = 0,
        health = 100,
        maxHealth = 100,
        projectileArmor = 0,
        laserArmor = 0,
        nukeArmor = 0,
        maxProjectileArmor = 0,
        maxLaserArmor = 0,
        maxNukeArmor = 0,
        colliders = [],
        weapons = []
    } = {}) {
        this.type = "ship";
        this.team = team;

        this.localPos = startLocalPos;
        this.localVel = startLocalVel;
        this.parentName = parentName;

        this.dryMass = dryMass;
        this.propMass = propMass;
        this.thrust = thrust;
        this.isp = isp;
        this.torque = torque;

        this.health = health;
        this.maxHealth = maxHealth;

        this.projectileArmor = projectileArmor;
        this.laserArmor = laserArmor;
        this.nukeArmor = nukeArmor;
        this.maxProjectileArmor = maxProjectileArmor;
        this.maxLaserArmor = maxLaserArmor;
        this.maxNukeArmor = maxNukeArmor;

        this.colliders = colliders;
        this.weapons = weapons;

        this.throttle = 0;
        this.sas = false;

        this.rot = Math.PI / 2;
        this.angVel = 0
    }

    getParent() {
        return SolarSystem.planets[this.parentName];
    }

    setParent(planet) {
        this.parentName = planet.name;
    }

    getMass() {
        return this.dryMass + this.propMass;
    }

    getInertia() {
        return 5000;
    }

    getTotalArmor() {
        return this.projectileArmor +
            this.laserArmor +
            this.nukeArmor;
    }

    getMaxArmor() {
        return this.maxProjectileArmor +
            this.maxLaserArmor +
            this.maxNukeArmor;
    }

    fire(time) {
        const launchSpeed = 1000;
        const worldMousePos = getWorldPos(InputState.mousePos);

        const dx = worldMousePos[0] - this.pos[0];
        const dy = worldMousePos[1] - this.pos[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;
        
        const dirX = dx / dist;
        const dirY = dy / dist;

        GameObjects.objects.push(new Projectile({
            pos: [...this.pos],
            vel: [
                this.vel[0] + dirX * launchSpeed,
                this.vel[1] + dirY * launchSpeed
            ],
            parentName: this.parentName,
            mass: 0.05,
            penetration: 1,
            color: "#ff00ff",
            startTime: time,
            lifetime: 3600
        }));
    }
}

export { Ship }