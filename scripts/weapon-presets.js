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
            penetration: 50,
            color: "#ff00ff",
            lifetime: 3 * 60
        },
        size: [2, 2, 2],
        fireRate: 25,
        projectileSpeed: 1800,
        firingArc: 186 * deg2Rad,
        spreadAngle: 0.005 * deg2Rad,
        efficiency: 2,
        heatFactor: 2
    }),
    cannon: ({ pos = [0, 0], direction = 0 }) => new ProjectileWeapon({
        weaponName: "Cannon",
        weaponClass: "cannon",
        projectileTemplate: {
            mass: 0.025,
            penetration: 200,
            color: "#00ffff",
            lifetime: 3 * 60
        },
        pos: pos,
        facing: direction * 0.5 * Math.PI,
        size: direction % 2 === 0
            ? [2, 2, 4]
            : [4, 4, 2],
        fireRate: 8,
        projectileSpeed: 4000,
        firingArc: 90 * deg2Rad,
        spreadAngle: 0.01 * deg2Rad,
        efficiency: 0.3,
        heatFactor: 0.2
    }),
    sniper: ({ pos = [0, 0], direction = 0 }) => new ProjectileWeapon({
        weaponName: "Sniper",
        weaponClass: "sniper",
        projectileTemplate: {
            mass: 0.05,
            penetration: 1000,
            color: "#ffff00",
            lifetime: 3 * 60
        },
        pos: pos,
        facing: direction * 0.5 * Math.PI,
        size: direction % 2 === 0
            ? [2, 2, 8]
            : [8, 8, 2],
        fireRate: 2,
        projectileSpeed: 5000,
        firingArc: 60 * deg2Rad,
        spreadAngle: 0.00005 * deg2Rad,
        efficiency: 0.2,
        heatFactor: 0.2
    }),
};