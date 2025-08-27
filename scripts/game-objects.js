"use strict";

import { vecLengthSq } from "./math.js";
import { Ship } from "./ship.js";
import { SolarSystem } from "./solar-system.js";
import { step4thOrderSymplectic } from "./integrator.js";

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
            sas: false
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
            sas: false
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
            torque: 1000
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

            obj.pos = [
                parentPos[0] + obj.localPos[0],
                parentPos[1] + obj.localPos[1]
            ];
            obj.vel = [
                parentVel[0] + obj.localVel[0],
                parentVel[1] + obj.localVel[1]
            ];

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

            let expireTime;
            if (obj.lifetime !== undefined) {
                expireTime = obj.startTime + obj.lifetime;
            } else {
                expireTime = Infinity;
            }

            obj.rot += obj.angVel * (endTime - obj.time);

            const sources = this.getGravitySources(obj);

            while (obj.time < endTime) {
                if (obj.time > expireTime) {
                    return false;
                }

                let remaining = endTime - obj.time;
                let currDt = Math.min(stepDt, remaining);

                const state = step4thOrderSymplectic(
                    obj.pos,
                    obj.vel,
                    obj.time,
                    currDt,
                    sources
                );

                if (state === false) {
                    return false;
                }

                obj.pos = state.pos;
                obj.vel = state.vel;
                obj.time = state.time;
            }

            const parent = obj.getParent();
            const parentPos = SolarSystem.getPlanetPositionAtTime(parent);
            const relParentPos = [
                obj.pos[0] - parentPos[0],
                obj.pos[1] - parentPos[1]
            ];
            const distToParentSq = vecLengthSq(relParentPos)
            const soi = parent.soi;
            if (distToParentSq > soi * soi) {
                obj.setParent(parent.getParent());
            }

            for (const sat of parent.getSatellites()) {
                const satPos = sat.localPos;
                const relSatPos = [
                    relParentPos[0] - satPos[0],
                    relParentPos[1] - satPos[1]
                ];
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
