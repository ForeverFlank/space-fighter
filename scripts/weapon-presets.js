"use strict";

import { deg2Rad } from "./math.js";
import { ProjectileWeapon } from "./projectile-weapon.js";

export const WeaponPresets = {
    mg: ({ pos = [0, 0], direction = 0 }) => new ProjectileWeapon({
        weaponName: "Machine Gun",
        pos: pos,
        facing: direction * 0.5 * Math.PI,
        projectileTemplate: {
            mass: 0.05,
            penetration: 10,
            color: "#ff00ff",
            lifetime: 3600
        },
        size: [2, 2, 2],
        fireRate: 15,
        projectileSpeed: 900,
        firingArc: 180 * deg2Rad,
        spreadAngle: 2.5 * deg2Rad*0
    }),
    railgun: ({ pos = [0, 0], direction = 0 }) => new ProjectileWeapon({
        weaponName: "Railgun",
        projectileTemplate: {
            mass: 0.1,
            penetration: 20,
            color: "#00ffff",
            lifetime: 3600
        },
        pos: pos,
        facing: direction * 0.5 * Math.PI,
        size: direction % 2 === 0
            ? [2, 2, 4]
            : [4, 4, 2],
        fireRate: 5,
        projectileSpeed: 2000,
        firingArc: 90 * deg2Rad,
        spreadAngle: 0.6 * deg2Rad*0
    }),
};