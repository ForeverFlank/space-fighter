"use strict";

import { vecAdd, vecLengthSq, vecSub } from "./math.js";
import { Ship } from "./ship.js";
import { SolarSystem } from "./solar-system.js";
import { step4thOrderSymplectic, stepSemiImplicitEuler } from "./integrator.js";
import { WeaponPresets } from "./weapon-presets.js";
import { EnginePart, HullPart, RadiatorPart, TankPart } from "./part.js";

class GameObjects {
    static ships = [
        new Ship({
            team: "ally",
            parentName: "Moon",
            startLocalPos: [6978000, 0],
            startLocalVel: [0, 860],
            thrust: 100000,
            torque: 1000,
            rot: 0,
            angVel: 0,
            mapSize: 50,
            parts: [
                new HullPart({
                    pos: [28, 0],
                    size: [6, 12, 20],
                    armorTiers: [1, 1, 0]
                }),
                new TankPart({
                    pos: [0, 0],
                    size: [12, 12, 36],
                    armorTiers: [1, 1, 0]
                }),
                new EnginePart({
                    pos: [-22, 0],
                    size: [4, 6, 8],
                    thrust: 100000,
                    isp: 750
                }),
                new RadiatorPart({
                    pos: [-10, 16],
                    size: [20, 20, 8],
                    armorTiers: [1, 0, 0]
                }),
                new RadiatorPart({
                    pos: [-10, -16],
                    size: [20, 20, 8],
                    armorTiers: [1, 0, 0]
                }),
                WeaponPresets.mg({
                    pos: [10, 7],
                    direction: 1
                }),
                WeaponPresets.mg({
                    pos: [10, -7],
                    direction: -1
                }),
                WeaponPresets.railgun({
                    pos: [40, 0],
                    direction: 0
                })
            ]
        })
    ];
    static projectiles = [];
    static controllingObject = null;

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

        this.controllingObject = this.ships[0];
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
        if (!obj.pos || !obj.vel) return true;
        if (obj.time === undefined) obj.time = endTime;

        obj.lastPos = [...obj.pos];

        if (obj.type === "ship") {
            obj.lastRot = obj.rot;
            obj.rot += obj.angVel * (endTime - obj.time);
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
        this.ships = this.ships.filter(ship =>
            this.updateObject(ship, endTime, stepDt));

        this.projectiles = this.projectiles.filter(proj =>
            this.updateObject(proj, endTime, stepDt));

        this.projectiles = this.projectiles.filter(p =>
            endTime < p.startTime + p.lifetime);
    }
}

export { GameObjects };
