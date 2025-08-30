"use strict";

import { deg2Rad, twoPi, vecAdd, vecLengthSq, vecSub } from "./math.js";
import { Ship } from "./ship.js";
import { SolarSystem } from "./solar-system.js";
import { step4thOrderSymplectic, stepSemiImplicitEuler } from "./integrator.js";
import { WeaponPresets } from "./weapon-presets.js";
import { ControlPart, EnginePart, HullPart, RadiatorPart, ReactorPart, TankPart } from "./part.js";

class GameObjects {
    static ships = [
        new Ship({
            team: "ally",
            parentName: "Moon",
            startLocalPos: [4500000, 0],
            startLocalVel: [0, 1050],
            thrust: 100000,
            torque: 1000,
            mapSize: 40,
            rot: 0,
            parts: [
                new HullPart({
                    pos: [28, 0],
                    size: [6, 12, 20],
                    armorTiers: [2, 1, 0]
                }),
                new ControlPart({
                    pos: [14, 0],
                    size: [12, 12, 8],
                    armorTiers: [2, 1, 0]
                }),
                new TankPart({
                    pos: [-4, 0],
                    size: [12, 12, 28],
                    armorTiers: [2, 1, 0]
                }),
                new RadiatorPart({
                    pos: [-18, 16],
                    size: [20, 20, 8],
                    armorTiers: [1, 0, 0]
                }),
                new RadiatorPart({
                    pos: [-18, -16],
                    size: [20, 20, 8],
                    armorTiers: [1, 0, 0]
                }),
                new ReactorPart({
                    pos: [-22, 0],
                    size: [12, 12, 8]
                }),
                new EnginePart({
                    pos: [-30, 0],
                    size: [4, 6, 8],
                    thrust: 100000,
                    isp: 750
                }),
                WeaponPresets.mg({
                    pos: [6, 7],
                    direction: 1,
                    armorTiers: [2, 0, 0]
                }),
                WeaponPresets.mg({
                    pos: [6, -7],
                    direction: -1,
                    armorTiers: [2, 0, 0]
                }),
                WeaponPresets.cannon({
                    pos: [40, 0],
                    direction: 0,
                    armorTiers: [2, 0, 0]
                }),
                WeaponPresets.sniper({
                    pos: [-4, 7],
                    direction: 0,
                    armorTiers: [2, 0, 0]
                }),
                WeaponPresets.sniper({
                    pos: [-4, -7],
                    direction: 0,
                    armorTiers: [2, 0, 0]
                })
            ]
        }),
        new Ship({
            team: "enemy",
            parentName: "Moon",
            startLocalPos: [6000000, 0],
            startLocalVel: [50, 900],
            thrust: 100000,
            torque: 1000,
            mapSize: 40,
            rot: 0,
            parts: [
                new HullPart({
                    pos: [28, 0],
                    size: [6, 12, 20],
                    armorTiers: [2, 1, 0]
                }),
                new ControlPart({
                    pos: [14, 0],
                    size: [12, 12, 8],
                    armorTiers: [2, 1, 0]
                }),
                new TankPart({
                    pos: [-4, 0],
                    size: [12, 12, 28],
                    armorTiers: [2, 1, 0]
                }),
                new RadiatorPart({
                    pos: [-18, 16],
                    size: [20, 20, 8],
                    armorTiers: [1, 0, 0]
                }),
                new RadiatorPart({
                    pos: [-18, -16],
                    size: [20, 20, 8],
                    armorTiers: [1, 0, 0]
                }),
                new ReactorPart({
                    pos: [-22, 0],
                    size: [12, 12, 8]
                }),
                new EnginePart({
                    pos: [-30, 0],
                    size: [4, 6, 8],
                    thrust: 100000,
                    isp: 750
                }),
                WeaponPresets.mg({
                    pos: [6, 7],
                    direction: 1,
                    armorTiers: [2, 0, 0]
                }),
                WeaponPresets.mg({
                    pos: [6, -7],
                    direction: -1,
                    armorTiers: [2, 0, 0]
                }),
                WeaponPresets.cannon({
                    pos: [40, 0],
                    direction: 0,
                    armorTiers: [2, 0, 0]
                }),
                WeaponPresets.sniper({
                    pos: [-4, 7],
                    direction: 0,
                    armorTiers: [2, 0, 0]
                }),
                WeaponPresets.sniper({
                    pos: [-4, -7],
                    direction: 0,
                    armorTiers: [2, 0, 0]
                })
            ]
        }),
    ];
    static projectiles = [];
    static controllingShip = null;

    static init(time = 0) {
        this.ships.forEach(obj => {
            const parentPos = SolarSystem.getPlanetPositionAtTime(
                obj.getParent(), time
            );
            const parentVel = SolarSystem.getPlanetVelocityAtTime(
                obj.getParent(), time
            );

            const posOut = [0, 0];
            const velOut = [0, 0];
            obj.pos = vecAdd(posOut, obj.localPos, parentPos);
            obj.vel = vecAdd(velOut, obj.localVel, parentVel);

            obj.lastPos = [...obj.pos];
            obj.time = time;
        });

        this.controllingShip = this.ships[0];
    }

    static getGravitySources(obj) {
        const sources = new Set();

        const addSource = (planet) => {
            if (planet && !sources.has(planet)) {
                sources.add(planet);
            }
        };

        const collectSources = (planet) => {
            if (!planet) return;

            const parent = planet.getParent();
            if (parent) {
                addSource(parent);
                collectSources(parent);

                parent.getSatellites()?.forEach(sibling => {
                    if (sibling !== planet) addSource(sibling);
                });
            }

            planet.getSatellites()?.forEach(child => {
                addSource(child);
            });
        };

        const parent = obj.getParent();
        if (parent) {
            collectSources(parent);
            addSource(parent);
        }

        return Array.from(sources);
    }

    static updateObject(obj, endTime, stepDt) {
        if (obj.toBeDestroyed) return false;
        if (!obj.pos || !obj.vel) return true;
        if (obj.time === undefined) obj.time = endTime;

        obj.lastPos = [...obj.pos];

        if (obj.type === "ship") {
            obj.lastRot = obj.rot;
            obj.rot += obj.angVel * (endTime - obj.time);
            obj.rot %= twoPi;
        }

        const sources = this.getGravitySources(obj);
        const stepFunction = obj.type === "ship"
            ? step4thOrderSymplectic
            : stepSemiImplicitEuler;
        const expireTime = obj.lifetime !== undefined
            ? obj.startTime + obj.lifetime
            : Infinity;

        while (obj.time < endTime) {
            if (obj.time > expireTime) return false;

            const remaining = endTime - obj.time;
            const currDt = Math.min(stepDt, remaining);

            const state = stepFunction(
                obj.pos, obj.vel, obj.time,
                currDt, sources
            );

            if (state === false) return false;

            obj.pos = state.pos;
            obj.vel = state.vel;
            obj.time = state.time;
        }

        const parent = obj.getParent();
        const parentPos = SolarSystem.getPlanetPositionAtTime(parent, endTime);

        const relParentPos = [0, 0];
        vecSub(relParentPos, obj.pos, parentPos);

        const distToParentSq = vecLengthSq(relParentPos);
        const soi = parent.soi;
        if (distToParentSq > soi * soi) {
            obj.setParent(parent.getParent());
        }

        for (const sat of parent.getSatellites()) {
            const relSatPos = [0, 0];
            vecSub(relSatPos, relParentPos, sat.localPos);

            if (vecLengthSq(relSatPos) < sat.soi * sat.soi) {
                obj.setParent(sat);
                break;
            }
        }

        return true;
    }

    static update(endTime, stepDt) {
        this.ships = this.ships.filter(ship => {
            ship.updateResources(stepDt);
            if (!this.updateObject(ship, endTime, stepDt)) {
                ship.destroy();
                return false;
            }
            return true;
        });

        this.projectiles = this.projectiles.filter(proj =>
            this.updateObject(proj, endTime, stepDt)
        );

        this.projectiles = this.projectiles.filter(p =>
            endTime < p.startTime + p.lifetime
        );
    }
}

export { GameObjects };
