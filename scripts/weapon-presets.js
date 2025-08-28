"use strict";

import { deg2Rad } from "./math.js";
import { ProjectileWeapon } from "./projectile-weapon.js";

export const WeaponPresets = {
    mg: new ProjectileWeapon({
        name: "Machine Gun",
        projectileTemplate: {
            mass: 0.05,
            penetration: 1,
            color: "#ff00ff",
            lifetime: 3600
        },
        fireRate: 12,
        projectileSpeed: 1500,
        firingArc: 150 * deg2Rad,
        spreadAngle: 2.5 * deg2Rad
    }),
    railgun: new ProjectileWeapon({
        name: "Railgun",
        projectileTemplate: {
            mass: 0.1,
            penetration: 2,
            color: "#00ffff",
            lifetime: 3600
        },
        fireRate: 5,
        projectileSpeed: 3000,
        firingArc: 90 * deg2Rad,
        spreadAngle: 0.6 * deg2Rad
    }),
};