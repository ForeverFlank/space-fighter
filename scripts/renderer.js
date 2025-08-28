"use strict";

import { Orbit } from "./orbit.js";
import { SolarSystem } from "./solar-system.js";
import { GameObjects } from "./game-objects.js";
import { getScreenPos, getScreenSize, updateCamera } from "./camera.js";
import { drawShipOsculatingOrbit } from "./trajectory-drawer.js";
import { vecAdd, vecRotate, vecSub } from "./math.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);

function renderScene(ctx, canvas, time) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1.5;

    renderPlanetSOIs(ctx);
    renderPlanets(ctx, time);

    renderProjectiles(ctx, time);

    renderShipOrbits(ctx, time);
    renderShips(ctx);
}

function renderPlanetSOIs(ctx) {
    const planets = Object.keys(SolarSystem.planets).reverse();

    for (const name of planets) {
        const planet = SolarSystem.planets[name];
        const pos = SolarSystem.getPlanetPosition(planet);
        const screenPos = getScreenPos(pos);

        if (!isFinite(planet.soi)) {
            continue;
        }

        const screenSoiSize = getScreenSize(planet.soi);

        const gradient = ctx.createRadialGradient(
            screenPos[0], screenPos[1], 0,
            screenPos[0], screenPos[1], screenSoiSize
        );
        gradient.addColorStop(0, "#00000000");
        gradient.addColorStop(1, "#40404060");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            screenPos[0], screenPos[1], screenSoiSize,
            0, 2 * Math.PI
        );
        ctx.fill();
    }
}

function renderPlanets(ctx, time) {
    const planets = Object.keys(SolarSystem.planets).reverse();

    for (const name of planets) {
        const planet = SolarSystem.planets[name];
        const parent = planet.getParent();
        const pos = SolarSystem.getPlanetPosition(planet);
        const screenPos = getScreenPos(pos);
        let screenSize = getScreenSize(planet.radius);
        if (screenSize < 3) screenSize = 3;

        if (parent) {
            drawPlanetOrbit(ctx, planet, parent, time);
        }

        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(
            screenPos[0], screenPos[1], screenSize,
            0, 2 * Math.PI
        );
        ctx.fill();
    }
}

function drawPlanetOrbit(ctx, planet, parent, time) {
    const parentPos = SolarSystem.getPlanetPosition(parent);
    const theta = Orbit.getTrueAnomalyFromTime(
        planet.orbit, parent.mu, time
    );

    ctx.beginPath();
    for (let i = 0; i <= 360; i++) {
        const orbitPos = Orbit.getPositionFromTrueAnomaly(
            planet.orbit, theta + i * Math.PI / 180
        );
        const worldPos = [orbitPos[0] + parentPos[0], orbitPos[1] + parentPos[1]];
        const screenPos = getScreenPos(worldPos);
        if (i === 0) ctx.moveTo(...screenPos);
        else ctx.lineTo(...screenPos);
    }
    ctx.strokeStyle = planet.color;
    ctx.stroke();
}

function drawRotatedTriangle(ctx, screenPos, size, rot) {
    const points = [
        [size * 0.75, 0],
        [-size * 0.5, -size * 0.5],
        [-size * 0.5, size * 0.5]
    ];

    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const rotated = points.map(([x, y]) => [
        screenPos[0] + x * cosR + y * sinR,
        screenPos[1] - x * sinR + y * cosR
    ]);

    ctx.beginPath();
    ctx.moveTo(...rotated[0]);
    ctx.lineTo(...rotated[1]);
    ctx.lineTo(...rotated[2]);
    ctx.closePath();
    ctx.stroke();
}

function renderShipOrbits(ctx, time) {
    for (const obj of GameObjects.objects) {
        if (obj.type === "ship") {
            const color = obj.team === "ally" ? "#0f0" : "#f00"
            ctx.strokeStyle = color;
            // computeShipTrajectory(obj, time);
            // drawShipTrajectory(ctx, obj, time);
            drawShipOsculatingOrbit(ctx, obj, time)
        }
    }
}

function renderShips(ctx) {
    for (const ship of GameObjects.objects) {
        if (ship.type !== "ship") continue;

        const screenPos = getScreenPos(ship.pos);
        const color = ship.team === "ally" ? "#0f0" : "#f00"
        ctx.strokeStyle = color;

        const size = Math.max(
            10, getScreenSize(ship.mapSize)
        );

        if (size > 10) {
            for (const col of ship.colliders) {
                // const rotatedOffset = [
                //     col.pos[0] * Math.cos(ship.rot) - col.pos[1] * Math.sin(ship.rot),
                //     col.pos[0] * Math.sin(ship.rot) + col.pos[1] * Math.cos(ship.rot)
                // ];
                const rotatedOffset = [0, 0];
                vecRotate(rotatedOffset, col.pos, ship.rot);

                const worldColPos = [0, 0];
                vecAdd(worldColPos, ship.pos, rotatedOffset);

                const colPos = getScreenPos(worldColPos);
                const w = getScreenSize(col.size[0]);
                const h = getScreenSize(col.size[1]);

                ctx.save();

                ctx.translate(colPos[0], colPos[1]);
                ctx.rotate(-ship.rot);
                ctx.strokeRect(-w / 2, -h / 2, w, h);

                ctx.restore();
            }
        } else if (GameObjects.controllingObject == ship) {
            drawRotatedTriangle(
                ctx,
                screenPos,
                size,
                ship.rot
            );
        } else {
            ctx.strokeRect(
                screenPos[0] - size / 2,
                screenPos[1] - size / 2,
                size, size
            );
        }
    }
}

function renderProjectiles(ctx, time) {
    for (const obj of GameObjects.objects) {
        const screenPos = getScreenPos(obj.pos);

        if (obj.type === "projectile") {
            // if (obj.prevScreenPos === undefined) {
            //     obj.prevScreenPos = screenPos;
            // }
            // const direction = vecSub(screenPos, obj.prevScreenPos);
            // const startPos = vecSub(screenPos, vecMul(direction, 5));

            ctx.strokeStyle = obj.color;
            ctx.beginPath();
            // ctx.moveTo(...startPos);
            // ctx.lineTo(...screenPos);
            ctx.arc(
                screenPos[0],
                screenPos[1],
                2,
                0, 2 * Math.PI);
            ctx.stroke();

            // obj.prevScreenPos = screenPos;
        } else if (obj.type !== "ship") {
            const size = 8;
            ctx.strokeStyle = "#888";
            ctx.strokeRect(
                screenPos[0] - size / 2,
                screenPos[1] - size / 2,
                size, size);
        }
    }
}

export { canvas, ctx, resizeCanvas, renderScene };