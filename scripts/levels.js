"use strict";

import { Ship } from "./ship.js";
import { WeaponPresets } from "./weapon-presets.js";
import { ControlPart, EnginePart, HullPart, RadiatorPart, ReactorPart, TankPart } from "./part.js";

export var Levels = {
    0: {
        ships: [
            new Ship({
                team: "Allies",
                parentName: "Moon",
                startLocalPos: [4800000, 0],
                startLocalVel: [0, 1020],
                torque: 1000,
                size: 100,
                rot: 0,
                parts: [
                    new HullPart({
                        pos: [40, 0],
                        size: [8, 16, 20],
                        armorTiers: [2, 1, 0]
                    }),
                    new ControlPart({
                        pos: [25, 0],
                        size: [16, 16, 10],
                        armorTiers: [2, 1, 0]
                    }),
                    new TankPart({
                        pos: [0, 0],
                        size: [16, 16, 40],
                        armorTiers: [2, 1, 0]
                    }),
                    new RadiatorPart({
                        pos: [-20, 18],
                        size: [20, 20, 8],
                        armorTiers: [1, 0, 0]
                    }),
                    new RadiatorPart({
                        pos: [-20, -18],
                        size: [20, 20, 8],
                        armorTiers: [1, 0, 0]
                    }),
                    new ReactorPart({
                        pos: [-25, 0],
                        size: [16, 16, 10]
                    }),
                    new EnginePart({
                        pos: [-34, 0],
                        size: [4, 6, 8],
                        thrust: 1_500_000,
                        isp: 450
                    }),
                    WeaponPresets.mg({
                        pos: [15, 9],
                        direction: 1,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.mg({
                        pos: [15, -9],
                        direction: -1,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.cannon({
                        pos: [52, 2],
                        direction: 0,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.cannon({
                        pos: [52, -2],
                        direction: 0,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.sniper({
                        pos: [0, 9],
                        direction: 0,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.sniper({
                        pos: [0, -9],
                        direction: 0,
                        armorTiers: [2, 0, 0]
                    })
                ]
            }),
            new Ship({
                team: "Enemies",
                parentName: "Moon",
                startLocalPos: [-5000000, 6400000],
                startLocalVel: [-680, -440],
                torque: 1000,
                size: 100,
                rot: 0,
                parts: [
                    new HullPart({
                        pos: [40, 0],
                        size: [8, 16, 20],
                        armorTiers: [2, 1, 0]
                    }),
                    new ControlPart({
                        pos: [25, 0],
                        size: [16, 16, 10],
                        armorTiers: [2, 1, 0]
                    }),
                    new TankPart({
                        pos: [0, 0],
                        size: [16, 16, 40],
                        armorTiers: [2, 1, 0]
                    }),
                    new RadiatorPart({
                        pos: [-20, 18],
                        size: [20, 20, 8],
                        armorTiers: [1, 0, 0]
                    }),
                    new RadiatorPart({
                        pos: [-20, -18],
                        size: [20, 20, 8],
                        armorTiers: [1, 0, 0]
                    }),
                    new ReactorPart({
                        pos: [-25, 0],
                        size: [16, 16, 10]
                    }),
                    new EnginePart({
                        pos: [-34, 0],
                        size: [4, 6, 8],
                        thrust: 225_000,
                        isp: 750
                    }),
                    WeaponPresets.mg({
                        pos: [15, 9],
                        direction: 1,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.mg({
                        pos: [15, -9],
                        direction: -1,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.cannon({
                        pos: [52, 2],
                        direction: 0,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.cannon({
                        pos: [52, -2],
                        direction: 0,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.sniper({
                        pos: [0, 9],
                        direction: 0,
                        armorTiers: [2, 0, 0]
                    }),
                    WeaponPresets.sniper({
                        pos: [0, -9],
                        direction: 0,
                        armorTiers: [2, 0, 0]
                    })
                ]
            }),
        ],
        focusTarget: 0
    }
};