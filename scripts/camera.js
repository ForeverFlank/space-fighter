"use strict";

import { InputState } from "./input.js";
import { SolarSystem } from "./solar-system.js";
import { GameObjects } from "./game-objects.js";
import { vecLength } from "./math.js";

let basePos = [0, 0];
let camPos = [0, 0];
let camScale = 100000;
let camOffset = [0, 0];

const zoomFactor = 1.15;
const zoomLerpFactor = 0.25;

let zoomTarget = [0, 0];
let targetCamScale = camScale;

let isDragging = false;
let lastMouse = [0, 0];

export var FocusTarget = {
    type: null,
    object: null
};

canvas.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
        isDragging = true;
        lastMouse = [e.clientX, e.clientY];
    }
});

canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mouseleave", () => isDragging = false);

canvas.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let dx = e.clientX - lastMouse[0];
    let dy = e.clientY - lastMouse[1];

    camOffset[0] -= dx * camScale;
    camOffset[1] += dy * camScale;

    lastMouse = [e.clientX, e.clientY];
});

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    if (e.deltaY < 0) targetCamScale /= zoomFactor;
    else targetCamScale *= zoomFactor;

    const mousePos = InputState.mousePos;
    zoomTarget = getWorldPos(mousePos);
    zoomTarget[0] -= basePos[0];
    zoomTarget[1] -= basePos[1];

}, { passive: false });

canvas.addEventListener("mousedown", (e) => {
    if (InputState.selectedWeapon !== "cam" || e.button !== 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closest = null;
    let closestDist = Infinity;

    for (const obj of GameObjects.objects) {
        if (!obj.pos || obj.type !== "ship") continue;
        const screenPos = getScreenPos(obj.pos);
        const dx = screenPos[0] - mouseX;
        const dy = screenPos[1] - mouseY;
        const dist = vecLength([dx, dy]);
        if (dist < 20 && dist < closestDist) {
            closestDist = dist;
            closest = { type: "ship", object: obj };
        }
    }

    for (const name in SolarSystem.planets) {
        const planet = SolarSystem.planets[name];
        const pos = SolarSystem.getPlanetPosition(planet);
        const screenPos = getScreenPos(pos);
        const dx = screenPos[0] - mouseX;
        const dy = screenPos[1] - mouseY;
        const dist = vecLength([dx, dy]);
        if (dist < 20 && dist < closestDist) {
            closestDist = dist;
            closest = { type: "planet", object: planet };
        }
    }

    if (closest) {
        FocusTarget = closest;
        camOffset = [0, 0];
    }
});

function getScreenPos(worldPos) {
    return [
        (worldPos[0] - camPos[0]) / camScale + canvas.width/2,
        canvas.height/2 - (worldPos[1] - camPos[1]) / camScale
    ];
}

function getWorldPos(screenPos) {
    return [
        (screenPos[0] - canvas.width/2) * camScale + camPos[0],
        camPos[1] + (canvas.height/2 - screenPos[1]) * camScale
    ];
}

function getScreenSize(size) {
    return size / camScale;
}

function updateCamera(time) {
    const oldCamScale = camScale;
    camScale += (targetCamScale - camScale) * zoomLerpFactor;
    const zoomRatio = camScale / oldCamScale;

    if (!FocusTarget.object) return;

    basePos = (FocusTarget.type === "planet")
        ? SolarSystem.getPlanetPositionAtTime(FocusTarget.object, time)
        : FocusTarget.object.pos;

    const diff = [
        (zoomTarget[0] - camOffset[0]) * zoomRatio,
        (zoomTarget[1] - camOffset[1]) * zoomRatio,
    ];

    camOffset = [
        zoomTarget[0] - diff[0],
        zoomTarget[1] - diff[1],
    ];
    
    camPos[0] = basePos[0] + camOffset[0];
    camPos[1] = basePos[1] + camOffset[1];
}

export {
    getScreenPos,
    getWorldPos,
    getScreenSize,
    updateCamera,
    camPos
};
