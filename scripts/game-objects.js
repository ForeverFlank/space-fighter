"use strict";

import { deg2Rad, vecAdd, vecLengthSq, vecSub } from "./math.js";
import { Ship } from "./ship.js";
import { SolarSystem } from "./solar-system.js";
import { step4thOrderSymplectic, stepSemiImplicitEuler } from "./integrator.js";
import { WeaponPresets } from "./weapon-presets.js";

class GameObjects {
    static objects = [
        new Ship({
            team: "ally",
            parentName: "Moon",
            startLocalPos: [6978000, 0],
            startLocalVel: [0, 860],
            dryMass: 10000,
            propMass: 90000,
            thrust: 100000,
            torque: 1000,
            rot: 0,
            angVel: 0,
            mapSize: 100,
            weapons: {
                mg: {
                    weapon: WeaponPresets.mg,
                    mount: [0, 0],
                    facing: 0,
                    enabled: true
                },
                railgun: {
                    weapon: WeaponPresets.railgun,
                    mount: [0, 0],
                    facing: 90 * deg2Rad,
                    enabled: true
                },
                sniper: {
                    weapon: WeaponPresets.railgun,
                    mount: [0, 0],
                    facing: -90 * deg2Rad,
                    enabled: true
                }
            },
            colliders: [
                {
                    part: "hull",
                    pos: [28, 0],
                    size: [20, 8]
                },
                {
                    part: "tank",
                    pos: [0, 0],
                    size: [36, 12]
                },
                {
                    part: "engine",
                    pos: [-22, 0],
                    size: [8, 8]
                },
                {
                    part: "radiator",
                    pos: [-10, 14],
                    size: [8, 16]
                },
                {
                    part: "radiator",
                    pos: [-10, -14],
                    size: [8, 16]
                }
            ]
        }),
        new Ship({
            team: "enemy",
            parentName: "Moon",
            startLocalPos: [0, 10536000],
            startLocalVel: [-700, 0],
            dryMass: 10000,
            propMass: 90000,
            thrust: 1000,
            torque: 1000,
            rot: Math.PI / 2,
            angVel: 0,
            mapSize: 120
        }),
        new Ship({
            team: "ally",
            parentName: "Moon",
            startLocalPos: [2500000, -5042000],
            startLocalVel: [750, 500],
            dryMass: 10000,
            propMass: 90000,
            thrust: 10000,
            isp: 750,
            torque: 1000,
            mapSize: 80
        })
    ];
    static controllingObject = null;

    static init(time = 0) {
        this.objects.forEach(obj => {
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

            obj.time = time;
        });

        this.controllingObject = this.objects[0];
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

    static update(endTime, stepDt) {
        this.objects = this.objects.filter(obj => {
            if (!obj.pos || !obj.vel) return true;
            if (obj.time === undefined) obj.time = endTime;

            obj.rot += obj.angVel * (endTime - obj.time);

            const sources = this.getGravitySources(obj);
            const stepFunction = obj.type === "ship"
                ? step4thOrderSymplectic
                : stepSemiImplicitEuler;
            const expireTime = obj.lifetime !== undefined
                ? obj.startTime + obj.lifetime
                : Infinity;

            if (obj.type === "projectile") {
                obj.lastPos = obj.pos;
            }

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
            const parentPos = SolarSystem.getPlanetPositionAtTime(
                parent, endTime
            );

            const relParentPos = [0, 0]
            vecSub(relParentPos, obj.pos, parentPos);

            const distToParentSq = vecLengthSq(relParentPos)
            const soi = parent.soi;
            if (distToParentSq > soi * soi) {
                obj.setParent(parent.getParent());
            }

            for (const sat of parent.getSatellites()) {
                const satPos = sat.localPos;

                const relSatPos = [0, 0];
                vecSub(relSatPos, relParentPos, satPos);

                if (vecLengthSq(relSatPos) < sat.soi * sat.soi) {
                    obj.setParent(sat);
                    break;
                }
            }

            return true;
        });
    }
}

export { GameObjects };
