"use strict";

import { twoPi, vecAdd, vecLengthSq, vecSub } from "./math.js";
import { SolarSystem } from "./solar-system.js";
import { step4thOrderSymplectic, stepSemiImplicitEuler } from "./integrator.js";

class GameObjects {
    static ships = [];
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
            ship.updatePhysics(stepDt);
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
