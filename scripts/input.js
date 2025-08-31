"use strict";

import { GameObjects } from "./game-objects.js";
import { Game } from "./game.js";
import { Timewarp } from "./main.js";

export const InputState = {
    mousePos: [0, 0],

    throttle: 0,
    sas: true,
    turning: 0,
    turningLeft: 0,
    turningRight: 0,
    firing: 0,

    camMode: false
}

export function setupInput(canvas) {
    window.addEventListener("keydown", (e) => {
        if (e.key === ",") {
            Timewarp.index = Math.max(
                0, Timewarp.index - 1
            );
        }
        if (e.key === ".") {
            Timewarp.index = Math.min(
                Timewarp.index + 1, Timewarp.options.length - 1
            );
        }
        if (e.key === '/') {
            Timewarp.index = 0;
        }
        Timewarp.speed = Timewarp.options[Timewarp.index];

        if (e.key === "c") {
            InputState.camMode = !InputState.camMode;
        }

        if (e.key === "t") {
            InputState.sas = !InputState.sas;
        }

        if (e.key === "z") {
            InputState.throttle = 1;
        }
        if (e.key === "x") {
            InputState.throttle = 0;
        }

        if (e.key === "q") {
            InputState.turningLeft = 1;
        }
        if (e.key === "e") {
            InputState.turningRight = -1;
        }
        InputState.turning = InputState.turningLeft + InputState.turningRight;
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "q") {
            InputState.turningLeft = 0;
        }
        if (e.key === "e") {
            InputState.turningRight = 0;
        }
        InputState.turning = InputState.turningLeft + InputState.turningRight;
    });

    canvas.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
            InputState.firing = true;
        }
    });

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        InputState.mousePos = [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    });

    canvas.addEventListener("mouseup", (e) => {
        InputState.firing = false;
    });

    canvas.addEventListener("mouseleave", (e) => {
        InputState.firing = false;
    });

    const weaponsContainer = document.getElementById("weapons-menu");
    weaponsContainer.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-weapon]");
        if (!button) return;

        const ship = GameObjects.controllingShip;
        const enabledWeapons = ship.enabledWeapons;

        weaponsContainer.querySelectorAll("button[data-weapon]").forEach((btn) => {
            const weapon = btn.getAttribute("data-weapon");
            if (!weapon) return;

            if (btn === button) {
                enabledWeapons[weapon] = !enabledWeapons[weapon];
            }
        });
    });

    const camButton = document.getElementById("button-cam");
    camButton.addEventListener("click", () => {
        InputState.camMode = !InputState.camMode;
    });
}
