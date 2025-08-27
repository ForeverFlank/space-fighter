"use strict";

import { Orbit } from "./orbit.js";
import { SolarSystem } from "./solar-system.js";
import { GameObjects } from "./game-objects.js";
import { getScreenPos, getScreenSize, updateCamera } from "./camera.js";
import { drawShipOsculatingOrbit } from "./trajectory-drawer.js";
import { vecMul, vecSub } from "./math.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // const topUI = document.querySelectorAll(".top-ui");
    // let topHeight = 0;
    // topUI.forEach(el => topHeight += el.offsetHeight);

    // topHeight *= 0.6;

    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight - topHeight;

    // canvas.style.position = "absolute";
    // canvas.style.top = `${topHeight}px`;
    // canvas.style.left = "0";
}
window.addEventListener("resize", resizeCanvas);

function renderScene(ctx, canvas, time) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1.5;

    renderPlanetSOIs(ctx);
    renderPlanets(ctx, time);
    
    renderObjectOrbits(ctx, time);
    renderObjects(ctx);

    updateCamera(time);
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

function renderObjectOrbits(ctx, time) {
    for (const obj of GameObjects.objects) {
        const screenPos = getScreenPos(obj.pos);

        if (obj.type === "ship") {
            const color = obj.team === "ally" ? "#0f0" : "#f00"
            ctx.strokeStyle = color;
            
            // computeShipTrajectory(obj, time);
            // drawShipTrajectory(ctx, obj, time);
            drawShipOsculatingOrbit(ctx, obj, time)
        }
    }
}

function renderObjects(ctx) {
    for (const obj of GameObjects.objects) {
        const screenPos = getScreenPos(obj.pos);

        if (obj.type === "ship") {
            const color = obj.team === "ally" ? "#0f0" : "#f00"
            ctx.strokeStyle = color;

            const size = Math.max(
                10, getScreenSize(100)
            );
            if (GameObjects.controllingObject == obj) {
                drawRotatedTriangle(
                    ctx,
                    screenPos,
                    size,
                    obj.rot
                );
            } else {
                ctx.strokeRect(
                    screenPos[0] - size / 2,
                    screenPos[1] - size / 2,
                    size, size
                );
            }
        } else if (obj.type === "projectile") {
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
        } else {
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