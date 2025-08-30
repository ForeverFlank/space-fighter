"use strict";

import { deg2Rad } from "./math.js";
import { ProjectileWeapon } from "./projectile-weapon.js";

export const WeaponPresets = {
    mg: ({ pos = [0, 0], direction = 0 }) => new ProjectileWeapon({
        weaponName: "Machine Gun",
        weaponClass: "mg",
        pos: pos,
        facing: direction * 0.5 * Math.PI,
        projectileTemplate: {
            mass: 0.05,
            penetration: 10,
            color: "#ff00ff",
            lifetime: 5 * 60
        },
        size: [2, 2, 2],
        fireRate: 20,
        projectileSpeed: 1200,
        firingArc: 186 * deg2Rad,
        spreadAngle: 1.5 * deg2Rad,
        powerUsage: 0.1,
        heatGeneration: 6
    }),
    cannon: ({ pos = [0, 0], direction = 0 }) => new ProjectileWeapon({
        weaponName: "Cannon",
        weaponClass: "cannon",
        projectileTemplate: {
            mass: 0.1,
            penetration: 25,
            color: "#00ffff",
            lifetime: 5 * 60
        },
        pos: pos,
        facing: direction * 0.5 * Math.PI,
        size: direction % 2 === 0
            ? [2, 2, 4]
            : [4, 4, 2],
        fireRate: 5,
        projectileSpeed: 2500,
        firingArc: 90 * deg2Rad,
        spreadAngle: 0.3 * deg2Rad,
        powerUsage: 1.5,
        heatGeneration: 10
    }),
    sniper: ({ pos = [0, 0], direction = 0 }) => new ProjectileWeapon({
        weaponName: "Sniper",
        weaponClass: "sniper",
        projectileTemplate: {
            mass: 0.01,
            penetration: 100,
            color: "#ffff00",
            lifetime: 5 * 60
        },
        pos: pos,
        facing: direction * 0.5 * Math.PI,
        size: direction % 2 === 0
            ? [2, 2, 8]
            : [8, 8, 2],
        fireRate: 1.5,
        projectileSpeed: 4500,
        firingArc: 15 * deg2Rad,
        spreadAngle: 0.05 * deg2Rad,
        powerUsage: 10,
        heatGeneration: 50
    }),
};