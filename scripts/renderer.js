"use strict";

import { Orbit } from "./orbit.js";
import { SolarSystem } from "./solar-system.js";
import { GameObjects } from "./game-objects.js";
import { getScreenPos, getScreenSize } from "./camera.js";
import { drawShipOsculatingOrbit } from "./trajectory-drawer.js";
import { vecAdd, vecRotate, vecSub } from "./math.js";
import { Teams } from "./teams.js";

export const shipCloseupThresold = 10;

const maxVisibleProjectiles = 1000;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);

function brightenColor(color, brightness) {
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);

    r = parseInt(r * brightness);
    g = parseInt(g * brightness);
    b = parseInt(b * brightness);

    r = (r < 255) ? r : 255;
    g = (g < 255) ? g : 255;
    b = (b < 255) ? b : 255;

    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);

    let rNew = ((r.toString(16).length == 1)
        ? "0" + r.toString(16)
        : r.toString(16));
    let gNew = ((g.toString(16).length == 1)
        ? "0" + g.toString(16)
        : g.toString(16));
    let bNew = ((b.toString(16).length == 1)
        ? "0" + b.toString(16)
        : b.toString(16));

    return "#" + rNew + gNew + bNew;
}

function renderScene(ctx, canvas, time) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1.5;

    renderPlanetSOIs(ctx);
    renderPlanets(ctx, time);

    renderProjectiles(ctx);

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
    for (const ship of GameObjects.ships) {
        const color = Teams[ship.team];
        ctx.strokeStyle = color;
        // computeShipTrajectory(ship, time);
        // drawShipTrajectory(ctx, ship, time);
        drawShipOsculatingOrbit(ctx, ship, time)
    }
}

function renderShips(ctx) {
    for (const ship of GameObjects.ships) {
        const screenPos = getScreenPos(ship.pos);
        const color = Teams[ship.team];

        const size = Math.max(
            10, getScreenSize(ship.size)
        );

        if (size > shipCloseupThresold) {
            for (const part of ship.parts) {
                const healthFraction = part.health / part.maxHealth;
                ctx.strokeStyle = brightenColor(
                    color, 0.4 + 0.6 * healthFraction
                );

                const rotatedOffset = [0, 0];
                vecRotate(rotatedOffset, part.pos, ship.rot);

                const worldPos = [0, 0];
                vecAdd(worldPos, ship.pos, rotatedOffset);

                const screenPos = getScreenPos(worldPos);

                const wTop = getScreenSize(part.size[0]);
                const wBottom = getScreenSize(part.size[1]);
                const h = getScreenSize(part.size[2]);

                ctx.save();
                ctx.translate(screenPos[0], screenPos[1]);
                ctx.rotate(-ship.rot);

                ctx.beginPath();
                ctx.moveTo(h / 2, -wTop / 2);
                ctx.lineTo(h / 2, wTop / 2);
                ctx.lineTo(-h / 2, wBottom / 2);
                ctx.lineTo(-h / 2, -wBottom / 2);
                ctx.closePath();

                ctx.stroke();
                ctx.restore();
            }
        } else if (GameObjects.controllingShip == ship) {
            ctx.strokeStyle = color;
            drawRotatedTriangle(
                ctx,
                screenPos,
                size,
                ship.rot
            );
        } else {
            ctx.strokeStyle = color;
            ctx.strokeRect(
                screenPos[0] - size / 2,
                screenPos[1] - size / 2,
                size, size
            );
        }
    }
}

function renderProjectiles(ctx) {
    const projectileCount = GameObjects.projectiles.length;
    const renderChance =
        projectileCount < maxVisibleProjectiles
        ? 1 : maxVisibleProjectiles / projectileCount;

    for (const proj of GameObjects.projectiles) {
        if (Math.random() > renderChance) continue;

        const screenPos = getScreenPos(proj.pos);

        if (proj.prevScreenPos === undefined) {
            proj.prevScreenPos = screenPos;
        }
        const direction = [0, 0], startPos = [0, 0];
        vecSub(direction, screenPos, proj.prevScreenPos);
        vecSub(startPos, screenPos, direction);

        ctx.fillStyle = proj.color;
        ctx.strokeStyle = proj.color;

        ctx.save();

        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(...startPos);
        ctx.lineTo(...screenPos);
        ctx.stroke();

        ctx.restore();
        ctx.beginPath();
        ctx.arc(
            screenPos[0],
            screenPos[1],
            1,
            0, 2 * Math.PI);
        ctx.fill();

        proj.prevScreenPos = screenPos;
    }
}

export { canvas, ctx, resizeCanvas, renderScene };